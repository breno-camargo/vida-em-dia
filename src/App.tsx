import { registrarTemaManual } from './utilitarios/tema'
import { useTema } from './hooks/useTema'
import { temaRecuperacaoSenha } from './sincronizacao/recuperacaoSenha'
import { ConcluirPerfilCadastro } from './componentes/ConcluirPerfilCadastro'
import { continuarSemConta, useConta } from './sincronizacao/estado'
import { supabase } from './sincronizacao/cliente'
import { ContaConfiguracoes } from './componentes/ContaConfiguracoes'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDeslizarAbas } from './hooks/useDeslizarAbas'
import { useTransicaoSuave } from './hooks/useTransicaoSuave'
import { Settings, X, Leaf, Sun, Moon } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from './dados/banco'
import { Navegacao, type Aba } from './componentes/Navegacao'
import { AvisosPwa } from './componentes/AvisosPwa'
import { Hoje } from './telas/Hoje'
import type { SecaoConfiguracoes } from './telas/Configuracoes'
import { useAmbiente } from './hooks/useAmbiente'
const carregarTreino = () => import('./telas/Treino').then(m => ({ default: m.Treino }))
const carregarMedidas = () => import('./telas/Medidas')
const carregarEvolucao = () => import('./telas/Evolucao')
const Treino = lazy(carregarTreino)
const Configuracoes = lazy(() => import('./telas/Configuracoes').then(m => ({ default: m.Configuracoes })))
const Medidas = lazy(carregarMedidas)
const Evolucao = lazy(carregarEvolucao)
const Comida = lazy(() => import('./telas/Comida').then(m => ({ default: m.Comida })))
const prepararAba = (aba: Aba) => {
  const carregar = aba === 'Treino' ? carregarTreino : aba === 'Medidas' ? carregarMedidas : aba === 'Evolução' ? carregarEvolucao : undefined
  if (carregar) void carregar().catch(() => { /* A navegação mantém seu tratamento de carregamento. */ })
}

export default function App() {
  const [aba, definirAba] = useState<Aba>('Hoje')
  const [menu, definirMenu] = useState(false)
  const [acessoSolicitado, definirAcessoSolicitado] = useState(false)
  const conta = useConta()
  const nomeCadastrado: unknown = conta.usuario?.user_metadata?.nome
  const primeiroNome = typeof nomeCadastrado === 'string' ? nomeCadastrado.trim().split(/\s+/)[0] : ''
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}! Vamos cuidar de você?` : 'Olá, vamos cuidar de você?'
  const conteudoRef = useRef<HTMLElement>(null)
  useTransicaoSuave(conteudoRef, menu ? 'configuracoes' : aba)
  useEffect(() => {
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conexao?.saveData) return
    if ('requestIdleCallback' in window) {
      const pedido = window.requestIdleCallback(() => prepararAba('Treino'), { timeout: 2000 })
      return () => window.cancelIdleCallback(pedido)
    }
    const pedido = setTimeout(() => prepararAba('Treino'), 1000)
    return () => clearTimeout(pedido)
  }, [])
  const [secaoConfiguracoes, definirSecaoConfiguracoes] = useState<SecaoConfiguracoes>()
  const [registrarMedida, definirRegistrarMedida] = useState(false)
  const [entradaTreino, definirEntradaTreino] = useState(0)
  const [erro, definirErro] = useState('')
  const configVisual = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const temaPreferido = useTema()
  const temaSalvo = conta.recuperando ? temaRecuperacaoSenha() ?? temaPreferido : temaPreferido
  const temaAnterior = useRef<string | undefined>(undefined)
  useLayoutEffect(() => {
    const raiz = document.documentElement, tema = temaSalvo
    const animar = temaAnterior.current !== undefined && temaAnterior.current !== tema && !matchMedia('(prefers-reduced-motion: reduce)').matches
    raiz.classList.toggle('mudando-tema', animar)
    raiz.dataset.tema = tema
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(raiz).getPropertyValue('--visual-fundo').trim())
    temaAnterior.current = temaSalvo
    const prazo = animar ? setTimeout(() => raiz.classList.remove('mudando-tema'), 300) : undefined
    return () => { clearTimeout(prazo); raiz.classList.remove('mudando-tema') }
  }, [temaSalvo])
  const ambiente = useAmbiente()

  const entrada = !!supabase && ((acessoSolicitado && !conta.usuario) || conta.recuperando || (!conta.visitante && !conta.usuario))
  useLayoutEffect(() => { document.getElementById('conteudo')?.scrollTo({ top: 0, behavior: 'instant' }); window.scrollTo({ top: 0, behavior: 'instant' }) }, [aba, menu])
  const selecionar = useCallback((nova: Aba, abrirMedida = false) => {
    if (nova === aba && !menu && !abrirMedida) return
    definirRegistrarMedida(abrirMedida); if (nova === 'Treino') definirEntradaTreino(v => v + 1); definirAba(nova); definirMenu(false)
  }, [aba, menu])
  useDeslizarAbas(conteudoRef, aba, selecionar, !menu && !entrada && !(supabase && conta.carregando && !conta.visitante))
  const abrirConfiguracoes = (secao?:SecaoConfiguracoes) => { definirSecaoConfiguracoes(secao); definirMenu(true) }
  if (supabase && conta.carregando && !conta.visitante) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada" aria-busy={!erro}>
      {erro ? <p role="alert" className="erro">{erro}</p> : <p role="status">Abrindo seu espaço…</p>}
    </main>
  </div>
  if (entrada) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada">
      <div className="apresentacao-entrada"><h1>{conta.recuperando ? 'Vamos recuperar seu acesso.' : 'Bom ter você aqui.'}</h1><p>{conta.recuperando ? 'Receba um código e crie uma nova senha.' : 'Seu treino, sua rotina e sua evolução, juntos.'}</p></div>
      {erro && <p role="alert" className="erro">{erro}</p>}
      <ContaConfiguracoes entrada />
      <div className="alternativa-entrada"><span>ou</span><button className="link-conta" onClick={() => { definirAcessoSolicitado(false); continuarSemConta() }}>Continuar sem conta</button><p>Você pode entrar depois. Seus registros de visitante ficam visíveis a quem usar este perfil do navegador.</p></div>
    </main>
    <AvisosPwa />
  </div>
  return <div className={`app ${ambiente.instalado ? 'instalado' : 'nao-instalado'}`}>
    <header className="cabecalho"><div className="marca"><span><Leaf size={22} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></div>
      <div className="acoes-cabecalho"><button className="botao-icone" aria-label={temaSalvo === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'} onClick={() => { if(configVisual)void tabela('configuracoes').update(configVisual.id,{tema:temaSalvo==='claro'?'escuro':'claro',atualizado_em:new Date().toISOString()}).then(()=>registrarTemaManual(temaSalvo==='claro'?'escuro':'claro')).catch(()=>definirErro('Não foi possível salvar o tema.')) }}>{configVisual?.tema === 'claro' ? <Moon size={20}/> : <Sun size={20}/>}</button><button className="botao-icone" aria-label={menu ? 'Fechar configurações' : 'Abrir configurações'} aria-expanded={menu} onClick={() => menu ? definirMenu(false) : abrirConfiguracoes()}>{menu ? <X /> : <Settings size={22} />}</button></div>
    </header>
    <main ref={conteudoRef} id="conteudo"><div className="linha-data"><span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="estado-rede"><i className={ambiente.online ? 'online' : ''} />{ambiente.online ? 'Online' : 'Offline'}</span></div>
      <h1>{menu ? 'Configurações' : aba === 'Hoje' ? saudacao : aba}</h1>
      {erro && <div role="alert" className="erro">{erro}</div>}
      <ConcluirPerfilCadastro abrirConta={() => abrirConfiguracoes('conta')} />
      {conta.visitante && <p className="nota-resumo aviso-modo-visitante">Modo visitante: estes registros ficam visíveis a quem usar este perfil do navegador. Eles não são transferidos ao criar ou acessar uma conta.</p>}
      <div className="conteudo-pagina">{menu ? <Suspense fallback={<p role="status">Carregando configurações…</p>}><Configuracoes {...ambiente} inicial={secaoConfiguracoes} abrirAcesso={() => definirAcessoSolicitado(true)} /></Suspense> : aba === 'Hoje' ? <Hoje configurarAgua={() => abrirConfiguracoes('agua')} abrirBackup={() => abrirConfiguracoes('backup')} abrirConta={() => abrirConfiguracoes('conta')} abrir={selecionar} registrarMedida={() => selecionar('Medidas', true)} /> : aba === 'Treino' ? <Suspense fallback={<p role="status">Carregando treino…</p>}><Treino key={entradaTreino} online={ambiente.online} /></Suspense> : aba === 'Evolução' ? <Suspense fallback={<p role="status">Carregando evolução…</p>}><Evolucao /></Suspense> : aba === 'Medidas' ? <Suspense fallback={<p role="status">Carregando medidas…</p>}><Medidas registrarInicial={registrarMedida} /></Suspense> : <Suspense fallback={<p role="status">Carregando alimentação…</p>}><Comida /></Suspense>}</div>
    </main>
    <AvisosPwa /><Navegacao atual={aba} selecionar={selecionar} preparar={prepararAba} />
  </div>
}
