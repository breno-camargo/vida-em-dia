import { ConcluirPerfilCadastro } from './componentes/ConcluirPerfilCadastro'
import { continuarSemConta, useConta } from './sincronizacao/estado'
import { supabase } from './sincronizacao/cliente'
import { ContaConfiguracoes, BotaoSairDaConta } from './componentes/ContaConfiguracoes'
import { lazy, Suspense, useLayoutEffect, useState } from 'react'
import { Settings, X, Utensils, Ruler, ChartNoAxesCombined, Leaf } from 'lucide-react'
import { Navegacao, type Aba } from './componentes/Navegacao'
import { EstadoVazio } from './componentes/EstadoVazio'
import { AvisosPwa } from './componentes/AvisosPwa'
import { Hoje } from './telas/Hoje'
import type { SecaoConfiguracoes } from './telas/Configuracoes'
import { useAmbiente } from './hooks/useAmbiente'
import { Treino } from './telas/Treino'
const Configuracoes = lazy(() => import('./telas/Configuracoes').then(m => ({ default: m.Configuracoes })))
const Medidas = lazy(() => import('./telas/Medidas'))
const Evolucao = lazy(() => import('./telas/Evolucao'))

const proximas = {
  Comida: { icone: Utensils, titulo: 'Mais simples, mais constante', texto: 'Um diário rápido para acompanhar suas refeições, sem complicar a rotina.', etapa: 9 },
  Medidas: { icone: Ruler, titulo: 'Cada mudança conta', texto: 'Acompanhe peso e medidas e descubra sua evolução ao longo do tempo.', etapa: 5 },
  Evolução: { icone: ChartNoAxesCombined, titulo: 'Veja o caminho que percorreu', texto: 'Seus primeiros gráficos de treino estarão aqui. Cada registro conta uma parte da sua história.', etapa: 4 },
}
export default function App() {
  const [aba, definirAba] = useState<Aba>('Hoje')
  const [menu, definirMenu] = useState(false)
  const [secaoConfiguracoes, definirSecaoConfiguracoes] = useState<SecaoConfiguracoes>()
  const [registrarMedida, definirRegistrarMedida] = useState(false)
  const [entradaTreino, definirEntradaTreino] = useState(0)
  const [erro] = useState('')
  const ambiente = useAmbiente()
  const conta = useConta()
  const entrada = !!supabase && !conta.visitante && (!conta.usuario || conta.recuperando)
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [aba, menu])
  const selecionar = (nova: Aba) => { if (nova === aba && !menu) return; definirRegistrarMedida(false); if (nova === 'Treino') definirEntradaTreino(v => v + 1); definirAba(nova); definirMenu(false) }
  const abrirConfiguracoes = (secao?:SecaoConfiguracoes) => { definirSecaoConfiguracoes(secao); definirMenu(true) }
  if (supabase && conta.carregando && !conta.visitante) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada" aria-busy={!erro}>
      {erro ? <p role="alert" className="erro">{erro}</p> : <p role="status">Abrindo seu espaço…</p>}
    </main>
  </div>
  if (supabase && conta.usuario && !conta.vinculado && !conta.recuperando) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada">
      <div className="apresentacao-entrada"><h1>Vamos separar seus dados.</h1><p>Entrar em outra conta não transfere os registros deste navegador.</p></div>
      <p className="nota-resumo">Se este navegador já foi usado por outra pessoa, use um perfil separado do navegador ou outro aparelho para sua conta. Os registros locais ficam protegidos até a validação do vínculo.</p>
      <ContaConfiguracoes entrada />
      <BotaoSairDaConta />
    </main>
  </div>
  if (entrada) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada">
      <div className="apresentacao-entrada"><h1>{conta.recuperando ? 'Vamos recuperar seu acesso.' : 'Bom ter você aqui.'}</h1><p>{conta.recuperando ? 'Receba um código e crie uma nova senha.' : 'Seu treino, sua rotina e sua evolução, juntos.'}</p></div>
      {erro && <p role="alert" className="erro">{erro}</p>}
      <ContaConfiguracoes entrada />
      <div className="alternativa-entrada"><span>ou</span><button className="link-conta" onClick={continuarSemConta}>Continuar sem conta</button><p>Você pode entrar depois. Seus registros de visitante ficam vis?veis a quem usar este perfil do navegador.</p></div>
    </main>
    <AvisosPwa />
  </div>
  return <div className={`app ${ambiente.instalado ? 'instalado' : 'nao-instalado'}`}>
    <header className="cabecalho"><div className="marca"><span><Leaf size={22} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></div>
      <button className="botao-icone" aria-label={menu ? 'Fechar configurações' : 'Abrir configurações'} aria-expanded={menu} onClick={() => menu ? definirMenu(false) : abrirConfiguracoes()}>{menu ? <X /> : <Settings size={22} />}</button>
    </header>
    <main id="conteudo"><div className="linha-data"><span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="estado-rede"><i className={ambiente.online ? 'online' : ''} />{ambiente.online ? 'Online' : 'Offline'}</span></div>
      <h1>{menu ? 'Configurações' : aba === 'Hoje' ? 'Olá, vamos cuidar de você?' : aba}</h1>
      {erro && <div role="alert" className="erro">{erro}</div>}
      <ConcluirPerfilCadastro abrirConta={() => abrirConfiguracoes('conta')} />
      <div className="conteudo-pagina">{menu ? <Suspense fallback={<p role="status">Carregando configurações…</p>}><Configuracoes {...ambiente} inicial={secaoConfiguracoes} /></Suspense> : aba === 'Hoje' ? <Hoje abrirBackup={() => abrirConfiguracoes('backup')} abrirConta={() => abrirConfiguracoes('conta')} abrir={selecionar} registrarMedida={() => { selecionar('Medidas'); definirRegistrarMedida(true) }} /> : aba === 'Treino' ? <Treino key={entradaTreino} online={ambiente.online} /> : aba === 'Evolução' ? <Suspense fallback={<p role="status">Carregando evolução…</p>}><Evolucao /></Suspense> : aba === 'Medidas' ? <Suspense fallback={<p role="status">Carregando medidas…</p>}><Medidas registrarInicial={registrarMedida} /></Suspense> : <EstadoVazio {...proximas[aba]} />}</div>
    </main>
    <AvisosPwa /><Navegacao atual={aba} selecionar={selecionar} />
  </div>
}
