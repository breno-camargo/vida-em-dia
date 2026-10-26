import { GuiaInstalacao } from '../componentes/GuiaInstalacao'
import { EditorMedida } from '../componentes/EditorMedida'
import { novaMedida } from '../dados/medidas'
import type { MedidaCorporal } from '../dados/modelos'
import { ConfigurarAgua } from '../componentes/ConfigurarAgua'
import { ConfigurarEnergia } from '../componentes/PerfilEnergia'
import { registrarTemaManual, usarTemaAutomatico } from '../utilitarios/tema'
import { useTema, useModoTema } from '../hooks/useTema'
import { enquadrarDetalhes, recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, UserRound, DatabaseBackup, Ruler, Activity, Smartphone, Info, Download, Sun, ShieldCheck, Droplets } from 'lucide-react'
import { tabela } from '../dados/banco'
import { BackupConfiguracoes } from '../componentes/BackupConfiguracoes'
import { PrivacidadeDados } from '../componentes/PrivacidadeDados'
import { BotaoSairDaConta, ContaConfiguracoes } from '../componentes/ContaConfiguracoes'
import { ConfigurarAtividade } from '../componentes/ConfigurarAtividade'
import { ConfigurarLembreteMedidas } from '../componentes/ConfigurarLembreteMedidas'
import { useConta } from '../sincronizacao/estado'

function assegurarVisivel(secao: HTMLElement | null | undefined) {
  if (!secao) return
  const conteudo = secao.closest<HTMLElement>('main#conteudo')
  if (!conteudo) return
  const caixa = secao.getBoundingClientRect()
  const area = conteudo.getBoundingClientRect()
  const margemSuperior = 16
  const margemInferior = 20

  if (caixa.top < area.top + margemSuperior) {
    conteudo.scrollTo({
      top: conteudo.scrollTop + (caixa.top - area.top - margemSuperior),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  } else if (caixa.bottom > area.bottom - margemInferior) {
    const deslocamento = Math.min(caixa.bottom - area.bottom + margemInferior, caixa.top - area.top - margemSuperior)
    if (deslocamento > 0) {
      conteudo.scrollTo({
        top: conteudo.scrollTop + deslocamento,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      })
    }
  }
}

export type SecaoConfiguracoes = 'conta' | 'backup' | 'medidas' | 'atividade' | 'aparelho' | 'instalar' | 'sobre' | 'aparencia' | 'agua' | 'energia'

export function Configuracoes({ instalado, persistente, inicial, abrirAcesso }: { instalado: boolean; persistente: boolean | null; inicial?:SecaoConfiguracoes; abrirAcesso?: () => void }) {
  const [medidaAberta, setMedidaAberta] = useState<MedidaCorporal>()
  const [erroMedida, setErroMedida] = useState('')
  async function registrarPeso() {
    try { setErroMedida(''); setMedidaAberta(await novaMedida()) }
    catch { setErroMedida('Não foi possível abrir o registro de medidas.') }
  }
  const raiz = useRef<HTMLDivElement>(null)
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const conta = useConta()
  const tema = useTema()
  const modoTema = useModoTema()
  const [aberta, definirAberta] = useState<SecaoConfiguracoes|null>(inicial??null)
  const [secoesMontadas, definirSecoesMontadas] = useState<Set<SecaoConfiguracoes>>(() => new Set(inicial ? [inicial] : []))
  const [prevInicial, setPrevInicial] = useState(inicial)
  const [erroTema, definirErroTema] = useState('')

  if (inicial !== prevInicial) {
    setPrevInicial(inicial)
    if (inicial) {
      definirAberta(inicial)
      definirSecoesMontadas(ant => new Set(ant).add(inicial))
    }
  }

  // Mede a caixa final, sem disputar a rolagem durante a transicao.
  useEffect(() => {
    if (!aberta) return
    const elemento = raiz.current?.querySelector<HTMLElement>(`#secao-config-${aberta}`)
    const gaveta = elemento?.querySelector<HTMLElement>('.gaveta-config')
    if (!elemento || !gaveta) return
    let cancelado = false
    let conferido = false
    let quadro = 0
    const cancelar = () => { cancelado = true }
    const conferir = () => {
      if (cancelado || conferido) return
      conferido = true
      assegurarVisivel(elemento)
    }
    const terminou = (evento: TransitionEvent) => {
      if (evento.target === gaveta && evento.propertyName === 'grid-template-rows') conferir()
    }
    gaveta.addEventListener('transitionend', terminou)
    const conteudo = elemento.closest('main#conteudo')
    conteudo?.addEventListener('pointerdown', cancelar, { passive: true })
    conteudo?.addEventListener('wheel', cancelar, { passive: true })
    quadro = requestAnimationFrame(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) conferir()
    })
    // Cobre ausencia de transicao e preenchimento assincrono inicial.
    const prazo = setTimeout(conferir, 300)
    return () => {
      cancelAnimationFrame(quadro)
      clearTimeout(prazo)
      gaveta.removeEventListener('transitionend', terminou)
      conteudo?.removeEventListener('pointerdown', cancelar)
      conteudo?.removeEventListener('wheel', cancelar)
    }
  }, [aberta])

  const alternarSecao = (id: SecaoConfiguracoes) => {
    const nova = aberta === id ? null : id
    if (nova) definirSecoesMontadas(ant => new Set(ant).add(nova))
    definirAberta(nova)
  }

  const data = (valor?: string) => valor ? new Date(valor).toLocaleString('pt-BR') : 'Nunca'
  const secoes = [
    {id:'conta' as const, titulo:'Conta e sincronização', resumo:conta.usuario?.email??'Entrar e conectar seus dados', icone:<UserRound size={20}/>, conteudo:<ContaConfiguracoes resumida abrirAcesso={abrirAcesso}/>},
    {id:'aparencia' as const,titulo:'Aparência',resumo:modoTema==='automatico'?'Acompanha o celular':tema==='claro'?'Tema claro':'Tema escuro',icone:<Sun size={20}/>,conteudo:<section className="painel"><h2>Aparência</h2><p className="nota-resumo">Escolha como você prefere ver seu espaço.</p><div className="abas-treino tres-abas"><button type="button" aria-pressed={modoTema==='automatico'} onClick={usarTemaAutomatico}>Auto</button><button type="button" aria-pressed={modoTema==='escuro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'escuro',atualizado_em:new Date().toISOString()}).then(()=>registrarTemaManual('escuro')).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Escuro</button><button type="button" aria-pressed={modoTema==='claro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'claro',atualizado_em:new Date().toISOString()}).then(()=>registrarTemaManual('claro')).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Claro</button></div>{modoTema==='automatico'&&<p className="nota-resumo">{tema==='claro'?'O navegador informa tema claro.':'O navegador informa tema escuro.'}</p>}{erroTema&&<p role="alert">{erroTema}</p>}</section>},
    {id:'backup' as const, titulo:'Backup dos seus dados', resumo:'Exportar, importar e configurar lembretes', icone:<DatabaseBackup size={20}/>, conteudo:<BackupConfiguracoes/>},
    {id:'agua' as const, titulo:'Minha garrafa e água', resumo:'Capacidade e meta diária', icone:<Droplets size={20}/>, conteudo:<ConfigurarAgua/>},
    {id:'energia' as const, titulo:'Metabolismo e alimentação', resumo:'Gasto estimado e metas alimentares', icone:<Activity size={20}/>, conteudo:<ConfigurarEnergia registrarPeso={registrarPeso}/>},
    {id:'medidas' as const, titulo:'Lembrete de medidas', resumo:'Escolher o dia da semana', icone:<Ruler size={20}/>, conteudo:<ConfigurarLembreteMedidas/>},
    {id:'atividade' as const, titulo:'Cardio e movimento', resumo:'Metas, calorias e feriados', icone:<Activity size={20}/>, conteudo:<ConfigurarAtividade/>},
    {id:'aparelho' as const, titulo:'Seu aparelho', resumo:'Instalação e proteção dos dados', icone:<Smartphone size={20}/>, conteudo:<section className="painel aparelho-resumo"><h2>Seu aparelho</h2><p className="nota-resumo">Como seus dados estão protegidos neste aparelho.</p><dl className="aparelho-status">
      <div><dt><Smartphone size={17} aria-hidden="true"/>App instalado</dt><dd>{instalado?'Instalado':'No navegador'}</dd></div>
      <div><dt><ShieldCheck size={17} aria-hidden="true"/>Armazenamento</dt><dd>{persistente===null?'Indisponível':persistente?'Persistente':'Padrão do navegador'}</dd></div>
      <div><dt><Sun size={17} aria-hidden="true"/>Tema atual</dt><dd>{tema==='claro'?'Claro':'Escuro'}</dd></div><div><dt><Activity size={17} aria-hidden="true"/>Última sincronização</dt><dd>{data(config?.ultima_sincronizacao)}</dd></div>
      <div><dt><DatabaseBackup size={17} aria-hidden="true"/>Último backup</dt><dd>{data(config?.ultimo_backup)}</dd></div>
    </dl><p className="aparelho-nota"><ShieldCheck size={18} aria-hidden="true"/><span>Mantenha um backup fora do app. A proteção do armazenamento depende do navegador.</span></p>{instalado && <details onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}>Como instalar em outro celular</summary><GuiaInstalacao instalado={instalado}/></details>}</section>},
    ...(!instalado ? [{id:'instalar' as const, titulo:'Instalar o aplicativo', resumo:'Ajuda para iPhone e Android', icone:<Download size={20}/>, conteudo:<GuiaInstalacao instalado={instalado}/>}]:[]),
    {id:'sobre' as const,titulo:'Sobre o Vida em Dia',resumo:'Recursos e armazenamento',icone:<Info size={20}/>,conteudo:<section className="painel"><h2>Sobre o Vida em Dia</h2><p>Seu espaço pessoal de treino, alimentação e evolução.</p><small>Novo visual · Temas claro, escuro e automático</small><h3>Seus dados</h3><p>Registros disponíveis offline, com backup e sincronização pela conta. As fotos ficam neste aparelho; inclua-as no backup para guardá-las.</p></section>},
  ]
  const grupos = [
    {titulo:'SEU PERFIL',ids:['conta','agua','energia']},
    {titulo:'PREFERÊNCIAS',ids:['aparencia','medidas','atividade']},
    {titulo:'DADOS E APLICATIVO',ids:['backup','aparelho','instalar','sobre']},
  ]
  return <div ref={raiz} className="configuracoes-grupos">{grupos.map(grupo=><section className="config-bloco" key={grupo.titulo}><h2>{grupo.titulo}</h2><div className="config-lista">{secoes.filter(s=>grupo.ids.includes(s.id)).map(secao=>{
    const expandida=aberta===secao.id
    const montada=expandida||secoesMontadas.has(secao.id)
    return <section id={`secao-config-${secao.id}`} className={`secao-config${expandida?' expandida':''}`} key={secao.id}>
      <h2><button type="button" id={`titulo-config-${secao.id}`} aria-expanded={expandida} aria-controls={`conteudo-config-${secao.id}`} onClick={()=>alternarSecao(secao.id)}>
        <span className="icone-config">{secao.icone}</span><span className="texto-config"><strong>{secao.titulo}</strong><small>{secao.resumo}</small></span><ChevronDown className="seta-config" size={18}/>
      </button></h2>
      <div id={`conteudo-config-${secao.id}`} role="region" aria-labelledby={`titulo-config-${secao.id}`} className={`gaveta-config${expandida ? ' aberta' : ''}`} inert={!expandida ? true : undefined}>
        <div className="gaveta-interna">
          <div className="conteudo-config">{montada&&secao.conteudo}</div>
        </div>
      </div>
    </section>
  })}</div></section>)}<details className="privacidade-recolhida" onToggle={e => { if (e.target === e.currentTarget && e.currentTarget.open) assegurarVisivel(e.currentTarget) }}><summary onClick={recolherDetalhesSuavemente}><span className="icone-config"><ShieldCheck size={20} aria-hidden="true" /></span><span className="texto-config"><strong>Privacidade e eliminação</strong><small>Seus dados e itens removidos</small></span><ChevronDown className="seta-config" size={18} aria-hidden="true" /></summary><PrivacidadeDados/></details><BotaoSairDaConta/>{erroMedida && <p className="erro" role="alert">{erroMedida}</p>}{medidaAberta && <EditorMedida medida={medidaAberta} fechar={() => setMedidaAberta(undefined)} />}</div>
}
