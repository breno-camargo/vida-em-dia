import { registrarTemaManual, usarTemaAutomatico } from '../utilitarios/tema'
import { useTema, useModoTema } from '../hooks/useTema'
import { recolherDetalhesSuavemente, recolherSecaoSuavemente } from '../utilitarios/enquadrarDetalhes'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, UserRound, DatabaseBackup, Ruler, Activity, Smartphone, Info, Download, Sun, ShieldCheck } from 'lucide-react'
import { tabela } from '../dados/banco'
import { BackupConfiguracoes } from '../componentes/BackupConfiguracoes'
import { PrivacidadeDados } from '../componentes/PrivacidadeDados'
import { BotaoSairDaConta, ContaConfiguracoes } from '../componentes/ContaConfiguracoes'
import { ConfigurarAtividade } from '../componentes/ConfigurarAtividade'
import { ConfigurarLembreteMedidas } from '../componentes/ConfigurarLembreteMedidas'
import { useConta } from '../sincronizacao/estado'
function mostrarSecao(secao: HTMLElement | null) {
  const conteudo = secao?.closest<HTMLElement>('main#conteudo')
  if (!secao || !conteudo) return
  const caixa = secao.getBoundingClientRect()
  const area = conteudo.getBoundingClientRect()
  const margem = Math.max(12, (conteudo.clientHeight - caixa.height) / 2)
  conteudo.scrollTo({ top: conteudo.scrollTop + caixa.top - area.top - margem, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
export type SecaoConfiguracoes = 'conta' | 'backup' | 'medidas' | 'atividade' | 'aparelho' | 'instalar' | 'sobre' | 'aparencia'
export function Configuracoes({ instalado, persistente, inicial, abrirAcesso }: { instalado: boolean; persistente: boolean | null; inicial?:SecaoConfiguracoes; abrirAcesso?: () => void }) {
  const raiz = useRef<HTMLDivElement>(null)
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const conta = useConta()
  const tema = useTema()
  const modoTema = useModoTema()
  const [aberta, definirAberta] = useState<SecaoConfiguracoes|null>(inicial??null)
  const [erroTema, definirErroTema] = useState('')
  useEffect(() => {
    if (!aberta) return
    const secao = raiz.current?.querySelector<HTMLElement>('.secao-config.expandida')
    if (!secao) return
    let quadro = 0
    const observador = new ResizeObserver(() => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => mostrarSecao(secao))
    })
    const parar = () => { observador.disconnect(); cancelAnimationFrame(quadro) }
    observador.observe(secao)
    const prazo = window.setTimeout(parar, 1500)
    window.addEventListener('pointerdown', parar, { once: true })
    window.addEventListener('wheel', parar, { once: true })
    return () => { parar(); clearTimeout(prazo); window.removeEventListener('pointerdown', parar); window.removeEventListener('wheel', parar) }
  }, [aberta])
  const data = (valor?: string) => valor ? new Date(valor).toLocaleString('pt-BR') : 'Nunca'
  const secoes = [
    {id:'conta' as const, titulo:'Conta e sincronização', resumo:conta.usuario?.email??'Entrar e conectar seus dados', icone:<UserRound size={20}/>, conteudo:<ContaConfiguracoes resumida abrirAcesso={abrirAcesso}/>},
    {id:'aparencia' as const,titulo:'Aparência',resumo:modoTema==='automatico'?'Acompanha o celular':tema==='claro'?'Tema claro':'Tema escuro',icone:<Sun size={20}/>,conteudo:<section className="painel"><h2>Aparência</h2><p className="nota-resumo">Escolha como você prefere ver seu espaço.</p><div className="abas-treino tres-abas"><button type="button" aria-pressed={modoTema==='automatico'} onClick={usarTemaAutomatico}>Auto</button><button type="button" aria-pressed={modoTema==='escuro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'escuro',atualizado_em:new Date().toISOString()}).then(()=>registrarTemaManual('escuro')).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Escuro</button><button type="button" aria-pressed={modoTema==='claro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'claro',atualizado_em:new Date().toISOString()}).then(()=>registrarTemaManual('claro')).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Claro</button></div>{modoTema==='automatico'&&<p className="nota-resumo">{tema==='claro'?'O navegador informa tema claro.':'O navegador informa tema escuro.'}</p>}{erroTema&&<p role="alert">{erroTema}</p>}</section>},
    {id:'backup' as const, titulo:'Backup dos seus dados', resumo:'Exportar, importar e configurar lembretes', icone:<DatabaseBackup size={20}/>, conteudo:<BackupConfiguracoes/>},
    {id:'medidas' as const, titulo:'Lembrete de medidas', resumo:'Escolher o dia da semana', icone:<Ruler size={20}/>, conteudo:<ConfigurarLembreteMedidas/>},
    {id:'atividade' as const, titulo:'Cardio e movimento', resumo:'Metas, calorias e feriados', icone:<Activity size={20}/>, conteudo:<ConfigurarAtividade/>},
    {id:'aparelho' as const, titulo:'Seu aparelho', resumo:'Instalação e proteção dos dados', icone:<Smartphone size={20}/>, conteudo:<section className="painel"><h2>Seu aparelho</h2><dl>
      <div><dt>App instalado</dt><dd>{instalado?'Sim':'Não'}</dd></div>
      <div><dt>Armazenamento persistente</dt><dd>{persistente===null?'Indisponível':persistente?'Concedido':'Não concedido'}</dd></div>
      <div><dt>Tema</dt><dd>{config?.tema==='claro'?'Claro':'Escuro'}</dd></div><div><dt>Última sincronização</dt><dd>{data(config?.ultima_sincronizacao)}</dd></div>
      <div><dt>Último backup</dt><dd>{data(config?.ultimo_backup)}</dd></div>
    </dl><p>Instalar, sincronizar e exportar backups ajuda a proteger seus dados. A persistência depende do navegador.</p></section>},
    ...(!instalado?[{id:'instalar' as const,titulo:'Instalar no iPhone',resumo:'Adicionar à Tela de Início',icone:<Download size={20}/>,conteudo:<section className="painel"><h2>Instalar no iPhone</h2><p>Abra no Safari → Compartilhar → Adicionar à Tela de Início.</p><p>Instale antes de registrar dados ou fazer login. Safari e app instalado podem ter dados separados; cada endereço tem seu próprio armazenamento.</p></section>}]:[]),
    {id:'sobre' as const,titulo:'Sobre o Vida em Dia',resumo:'Versão e próximas novidades',icone:<Info size={20}/>,conteudo:<section className="painel"><h2>Sobre o Vida em Dia</h2><p>Seu espaço pessoal de treino, alimentação e evolução.</p><small>Versão 0.7.0 · Backup e proteção dos dados</small><h3>Em breve</h3><p>Sincronização das fotos na etapa 11. Personalização do tema na etapa 13.</p></section>},
  ]
  const grupos = [
    {titulo:'SEU PERFIL',ids:['conta']},
    {titulo:'PREFERÊNCIAS',ids:['aparencia','medidas','atividade']},
    {titulo:'DADOS E APLICATIVO',ids:['backup','aparelho','instalar','sobre']},
  ]
  return <div ref={raiz} className="configuracoes-grupos">{grupos.map(grupo=><section className="config-bloco" key={grupo.titulo}><h2>{grupo.titulo}</h2><div className="config-lista">{secoes.filter(s=>grupo.ids.includes(s.id)).map(secao=>{
    const expandida=aberta===secao.id
    return <section className={`secao-config${expandida?' expandida':''}`} key={secao.id}>
      <h2><button type="button" id={`titulo-config-${secao.id}`} aria-expanded={expandida} aria-controls={`conteudo-config-${secao.id}`} onClick={()=>{ const anterior=raiz.current?.querySelector<HTMLElement>('.secao-config.expandida'); const mudar=()=>definirAberta(expandida?null:secao.id); if(anterior)recolherSecaoSuavemente(anterior,mudar);else mudar() }}>
        <span className="icone-config">{secao.icone}</span><span className="texto-config"><strong>{secao.titulo}</strong><small>{secao.resumo}</small></span><ChevronDown className="seta-config" size={18}/>
      </button></h2>
      <div id={`conteudo-config-${secao.id}`} role="region" aria-labelledby={`titulo-config-${secao.id}`} hidden={!expandida} className="conteudo-config">{expandida&&secao.conteudo}</div>
    </section>
  })}</div></section>)}<details className="privacidade-recolhida" onToggle={e => { if (e.target === e.currentTarget && e.currentTarget.open) mostrarSecao(e.currentTarget) }}><summary onClick={recolherDetalhesSuavemente}><span className="icone-config"><ShieldCheck size={20} aria-hidden="true" /></span><span className="texto-config"><strong>Privacidade e eliminação</strong><small>Seus dados e itens removidos</small></span><ChevronDown className="seta-config" size={18} aria-hidden="true" /></summary><PrivacidadeDados/></details><BotaoSairDaConta/></div>
}
