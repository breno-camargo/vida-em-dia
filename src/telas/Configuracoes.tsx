import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, UserRound, DatabaseBackup, Ruler, Activity, Smartphone, Info, Download, Sun, ShieldCheck } from 'lucide-react'
import { tabela } from '../dados/banco'
import { BackupConfiguracoes } from '../componentes/BackupConfiguracoes'
import { PrivacidadeDados } from '../componentes/PrivacidadeDados'
import { BotaoSairDaConta, ContaConfiguracoes } from '../componentes/ContaConfiguracoes'
import { ConfigurarAtividade } from '../componentes/ConfigurarAtividade'
import { ConfigurarLembreteMedidas } from '../componentes/ConfigurarLembreteMedidas'
import { useConta } from '../sincronizacao/estado'
export type SecaoConfiguracoes = 'conta' | 'backup' | 'medidas' | 'atividade' | 'aparelho' | 'instalar' | 'sobre' | 'aparencia'
export function Configuracoes({ instalado, persistente, inicial }: { instalado: boolean; persistente: boolean | null; inicial?:SecaoConfiguracoes }) {
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const conta = useConta()
  const [aberta, definirAberta] = useState<SecaoConfiguracoes|null>(inicial??null)
  const [erroTema, definirErroTema] = useState('')
  const data = (valor?: string) => valor ? new Date(valor).toLocaleString('pt-BR') : 'Nunca'
  const secoes = [
    {id:'conta' as const, titulo:'Conta e sincronização', resumo:conta.usuario?.email??'Entrar e conectar seus dados', icone:<UserRound size={20}/>, conteudo:<ContaConfiguracoes resumida/>},
    {id:'aparencia' as const,titulo:'Aparência',resumo:config?.tema==='claro'?'Tema claro':'Tema escuro',icone:<Sun size={20}/>,conteudo:<section className="painel"><h2>Aparência</h2><p className="nota-resumo">Escolha como você prefere ver seu espaço.</p><div className="abas-treino"><button type="button" aria-pressed={config?.tema==='escuro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'escuro',atualizado_em:new Date().toISOString()}).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Escuro</button><button type="button" aria-pressed={config?.tema==='claro'} onClick={()=>{if(config)void tabela('configuracoes').update(config.id,{tema:'claro',atualizado_em:new Date().toISOString()}).catch(()=>definirErroTema('Não foi possível salvar o tema.'))}}>Claro</button></div>{erroTema&&<p role="alert">{erroTema}</p>}</section>},
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
  return <div className="configuracoes-grupos">{grupos.map(grupo=><section className="config-bloco" key={grupo.titulo}><h2>{grupo.titulo}</h2><div className="config-lista">{secoes.filter(s=>grupo.ids.includes(s.id)).map(secao=>{
    const expandida=aberta===secao.id
    return <section className={`secao-config${expandida?' expandida':''}`} key={secao.id}>
      <h2><button type="button" id={`titulo-config-${secao.id}`} aria-expanded={expandida} aria-controls={`conteudo-config-${secao.id}`} onClick={()=>definirAberta(expandida?null:secao.id)}>
        <span className="icone-config">{secao.icone}</span><span className="texto-config"><strong>{secao.titulo}</strong><small>{secao.resumo}</small></span><ChevronDown className="seta-config" size={18}/>
      </button></h2>
      <div id={`conteudo-config-${secao.id}`} role="region" aria-labelledby={`titulo-config-${secao.id}`} hidden={!expandida} className="conteudo-config">{expandida&&secao.conteudo}</div>
    </section>
  })}</div></section>)}<details className="privacidade-recolhida"><summary><span className="icone-config"><ShieldCheck size={20} aria-hidden="true" /></span><span className="texto-config"><strong>Privacidade e eliminação</strong><small>Seus dados e itens removidos</small></span><ChevronDown className="seta-config" size={18} aria-hidden="true" /></summary><PrivacidadeDados/></details><BotaoSairDaConta/></div>
}
