import { enquadrarDetalhes, recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { useId, useState, type FormEvent } from 'react'
import { Eye, EyeOff, LogOut, RefreshCw, CloudUpload } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { supabase } from '../sincronizacao/cliente'
import { confirmarVinculo, definirRecuperacao, sairConta, sincronizar, useConta } from '../sincronizacao/estado'
import { tabela } from '../dados/banco'
import { Painel } from './Painel'
import { RevisaoSincronizacao } from './RevisaoSincronizacao'
import { cadastrarConta, confirmarCadastro, reenviarCadastro } from '../sincronizacao/cadastro'
import { prepararPerfilCadastro } from '../dados/perfilCadastro'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, dataMedida, formatarValorMedida } from '../dados/medidas'
import { criarRegistro } from '../dados/repositorio'
import { EditorMedida } from './EditorMedida'
export function ContaConfiguracoes({entrada=false,resumida=false,abrirAcesso}:{entrada?:boolean;resumida?:boolean;abrirAcesso?:()=>void}){
 const conta=useConta()
 const config=useLiveQuery(()=>tabela('configuracoes').where('chave').equals('principal').first())
 const [email,setEmail]=useState(''),[senha,setSenha]=useState(''),[codigo,setCodigo]=useState('')
 const [confirmacao,setConfirmacao]=useState('')
 const [nome,setNome]=useState(''),[altura,setAltura]=useState('')
 const [medidaCadastro,setMedidaCadastro]=useState<MedidaCorporal>()
 const [editarMedidas,setEditarMedidas]=useState(false)
 const [baseMedida]=useState(()=>({...criarRegistro(),data:dataMedida()}))
 const [modo,setModo]=useState<'entrar'|'recuperar'|'codigo'|'nova'|'cadastro'|'confirmarCadastro'>(conta.recuperando&&conta.usuario?'nova':'entrar')
 const [mostrarSenha,setMostrarSenha]=useState(false)
 const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[aviso,setAviso]=useState(''),[mesclar,setMesclar]=useState(false)
 const executar=async(acao:()=>Promise<void>)=>{setOcupado(true);setErro('');try{await acao()}catch(e){setErro(e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.')}finally{setOcupado(false)}}
 async function enviar(e:FormEvent){e.preventDefault();await executar(async()=>{
  if(!supabase)return
  if(!navigator.onLine)throw new Error('Você está offline. Conecte à internet para acessar sua conta ou continue sem conta.')
  if(modo==='cadastro'){
   const perfil={nome,altura_cm:altura.trim()?Number(altura.replace(',','.')):undefined,medida:medidaCadastro}
   const resultado=await cadastrarConta(email,senha,confirmacao,perfil)
   prepararPerfilCadastro(email,perfil)
   setSenha('');setConfirmacao('');setCodigo('')
   setModo(resultado==='confirmar'?'confirmarCadastro':'entrar')
   setAviso(resultado==='confirmar'?'Confira seu e-mail para confirmar o cadastro. Se recebeu um link, abra-o e depois volte para Entrar. Se recebeu um código, digite abaixo.':'Conta criada. Seus dados continuam neste aparelho até você confirmar a conexão.')
  } else if(modo==='confirmarCadastro'){
   await confirmarCadastro(email,codigo);setCodigo('');setModo('entrar');setAviso('E-mail confirmado. A conexão dos dados será feita somente com sua confirmação.')
  } else if(modo==='entrar'){
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password:senha})
   if(error?.code==='email_not_confirmed'){
    setSenha('');setCodigo('');setModo('confirmarCadastro')
    setAviso('Solicitando um novo e-mail de confirmação…')
    try {
     await reenviarCadastro(email)
     setAviso('Solicitação de envio aceita. Confira seu e-mail e o spam. A mensagem pode levar alguns instantes para chegar.')
    } catch(e) {
     setAviso('Sua conta continua aguardando confirmação. Você pode tentar novamente em Reenviar confirmação.')
     throw e
    }
    return
   }
   if(error)throw new Error('Não foi possível entrar. Confira e-mail, senha e conexão.')
   setSenha('')
  } else if(modo==='recuperar'){
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim())
   if(error)throw new Error(error.code==='over_email_send_rate_limit'?'Muitas solicitações de código. Aguarde antes de tentar novamente.':(error.status??0)>=500?'Não foi possível enviar o e-mail de recuperação. O serviço de envio precisa ser verificado.':'Não foi possível solicitar o código. Confira a conexão e tente novamente.')
   setAviso('Se o e-mail estiver cadastrado, você receberá um código. Digite-o aqui no app.');setModo('codigo')
  } else if(modo==='codigo'){
   const {error}=await supabase.auth.verifyOtp({email:email.trim(),token:codigo.trim(),type:'recovery'})
   if(error)throw new Error('Código inválido ou expirado. Solicite outro código.')
   setCodigo('');setModo('nova')
  } else {
   const {error}=await supabase.auth.updateUser({password:senha})
   if(error)throw new Error('Não foi possível alterar a senha. Use pelo menos 8 caracteres e tente novamente.')
   setSenha('');setModo('entrar');definirRecuperacao(false);setAviso('Senha atualizada.')
  }
 })}
 return <section className={entrada?'conta conta-entrada':'painel conta'} aria-label={entrada?'Acesso à conta':'Conta e sincronização'}>{!entrada&&!resumida&&<h2>Conta e sincronização</h2>}
 {!supabase?<p>A conexão com a nuvem ainda não foi configurada. Seus dados continuam salvos neste aparelho.</p>:<>
 {!entrada && !conta.usuario && abrirAcesso ? <div className="conta-vinculo"><p>Entre, crie sua conta ou recupere seu acesso.</p><button type="button" className="botao-principal" onClick={abrirAcesso}>Acessar minha conta</button></div> : conta.carregando?<p role="status">Abrindo sua sessão…</p>:(!conta.usuario||modo==='nova'||modo==='codigo')?<form onSubmit={enviar} className="formulario-conta">
 {modo==='confirmarCadastro'&&<div className="aviso-confirmacao-conta" role="status"><strong>Confirme seu e-mail para liberar o acesso</strong><p>Sua conta foi criada, mas você precisa confirmar o e-mail antes de entrar.</p><p>Confira a caixa de entrada e o spam de <b>{email}</b>. Digite o código abaixo ou abra o link da confirmação.</p>{aviso&&<p>{aviso}</p>}</div>}
 {modo==='cadastro'&&<p className="nota-resumo">Crie sua conta para acessar seus registros em outros aparelhos. Cadastrar não envia os dados deste aparelho automaticamente.</p>}
 {modo==='cadastro'&&<label>Como você se chama?<input autoComplete="given-name" maxLength={80} required value={nome} onChange={e=>setNome(e.target.value)} disabled={ocupado}/></label>}
 {modo!=='nova'&&<label>E-mail<input type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@exemplo.com" required value={email} onChange={e=>setEmail(e.target.value)} disabled={ocupado||modo==='confirmarCadastro'}/></label>}
 {(modo==='entrar'||modo==='nova'||modo==='cadastro')&&<div className="campo-senha"><label htmlFor={entrada?'senha-entrada':'senha-conta'}>{modo==='nova'?'Nova senha':'Senha'}</label><div><input id={entrada?'senha-entrada':'senha-conta'} type={mostrarSenha?'text':'password'} placeholder={modo==='nova'?'Pelo menos 8 caracteres':'Sua senha'} autoComplete={modo==='nova'||modo==='cadastro'?'new-password':'current-password'} minLength={modo==='nova'||modo==='cadastro'?8:1} required value={senha} onChange={e=>setSenha(e.target.value)} disabled={ocupado}/><button type="button" aria-label={mostrarSenha?'Ocultar senha':'Mostrar senha'} aria-pressed={mostrarSenha} onClick={()=>setMostrarSenha(!mostrarSenha)}>{mostrarSenha?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>}
 {(modo==='codigo'||modo==='confirmarCadastro')&&<label>Código recebido por e-mail<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\D/g,''))}/></label>}
 {modo==='cadastro'&&<><p className="nota-resumo">Use uma senha com pelo menos 8 caracteres.</p><label>Confirmar senha<input type={mostrarSenha?'text':'password'} autoComplete="new-password" minLength={8} required value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} disabled={ocupado}/></label></>}
 {modo==='cadastro'&&<details className="perfil-opcional-cadastro" onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}>Altura e medidas (opcional)</summary><div className="formulario"><p className="nota-resumo">Já tem suas medidas? Preencha apenas o que souber ou deixe para depois.</p><label>Altura em cm<input inputMode="decimal" placeholder="Ex.: 175" value={altura} onChange={e=>setAltura(e.target.value)} disabled={ocupado}/></label><button type="button" className="botao-secundario" disabled={ocupado} onClick={()=>setEditarMedidas(true)}>{medidaCadastro?'Editar medidas iniciais':'Adicionar peso e medidas'}</button>{medidaCadastro&&<><p className="nota-resumo">{camposMedidas.filter(([campo])=>medidaCadastro[campo]!==undefined).map(([campo,rotulo,unidade])=>`${rotulo}: ${formatarValorMedida(campo,medidaCadastro[campo]!)} ${unidade}`).join(' · ')}</p><button type="button" className="link-conta" disabled={ocupado} onClick={()=>setMedidaCadastro(undefined)}>Preencher medidas depois</button></>}<p className="nota-resumo">As medidas ficam como rascunho nesta aba. Após confirmar o e-mail e conectar o aparelho, você poderá salvá-las. Se fechar ou atualizar a página antes disso, preencha novamente na aba Medidas.</p></div></details>}
 <button className="botao-principal" disabled={ocupado}>{ocupado?'Aguarde…':modo==='entrar'?'Entrar':modo==='cadastro'?'Criar conta':modo==='confirmarCadastro'?'Confirmar e-mail':modo==='recuperar'?'Enviar código':modo==='codigo'?'Confirmar código':'Salvar nova senha'}</button>
 {modo==='entrar'&&<button type="button" className="botao-secundario" disabled={ocupado} onClick={()=>{setModo('cadastro');setSenha('');setConfirmacao('');setAviso('');setErro('')}}>Criar conta</button>}
 {modo==='confirmarCadastro'&&<button type="button" className="botao-secundario" disabled={ocupado} onClick={()=>void executar(async()=>{if(!navigator.onLine)throw new Error('Conecte à internet para reenviar.');await reenviarCadastro(email);setAviso('Se houver cadastro pendente, uma nova confirmação será enviada ao e-mail informado.')})}>Reenviar confirmação</button>}
 {modo==='codigo'&&<button type="button" className="botao-secundario" disabled={ocupado} onClick={()=>void executar(async()=>{if(!supabase)return;if(!navigator.onLine)throw new Error('Conecte à internet para reenviar o código.');const {error}=await supabase.auth.resetPasswordForEmail(email.trim());if(error)throw new Error(error.code==='over_email_send_rate_limit'?'Muitas solicitações de código. Aguarde antes de tentar novamente.':(error.status??0)>=500?'Não foi possível enviar o e-mail de recuperação. O serviço de envio precisa ser verificado.':'Não foi possível reenviar o código. Confira a conexão e tente novamente.');setAviso('Novo código enviado. Confira sua caixa de entrada e o spam.')})}>Reenviar código</button>}
 {modo==='entrar'?<button type="button" className="link-conta recuperar-senha" disabled={ocupado} onClick={()=>{setModo('recuperar');definirRecuperacao(true);setSenha('');setConfirmacao('');setCodigo('');setAviso('');setErro('')}}>Esqueci minha senha</button>:<button type="button" className="link-conta" disabled={ocupado} onClick={()=>void executar(async()=>{if(modo==='nova'&&conta.usuario)await sairConta();definirRecuperacao(false);setModo('entrar');setSenha('');setCodigo('');setErro('')})}>Voltar para entrar</button>}

 </form>:<div className="conta-sessao">
 {!resumida&&<p>{conta.usuario.email}</p>}
 <NomeDaConta key={conta.usuario.id} />
 {!conta.vinculado?<div className="conta-vinculo"><p>Conecte este aparelho para sincronizar seus registros.</p><button className="botao-principal" onClick={()=>setMesclar(true)}>Conectar meus dados</button></div>:<>
 <BotaoSincronizar/>
 <label className="opcao-sync-automatica"><span className="texto-sync-automatica"><strong>Sincronização automática</strong><span>Ao abrir, voltar ao app ou finalizar um treino.</span></span><input type="checkbox" role="switch" aria-label="Sincronização automática" checked={config?.sync_automatico??false} disabled={conta.ocupado||ocupado||!config} onChange={e=>{const ativar=e.target.checked;if(config)void executar(async()=>{await tabela('configuracoes').update(config.id,{sync_automatico:ativar})})}}/><span className="interruptor-sync" aria-hidden="true"/></label>
 </>}
 <details className="ajuda-conta"><summary onClick={recolherDetalhesSuavemente}>Sobre seus dados</summary><p>Use o app em um aparelho pessoal. Sair mantém os dados e o vínculo com esta conta. As fotos ficam no aparelho; inclua-as no backup JSON para guardá-las.</p></details>
 </div>}
 </>}
 {aviso&&modo!=='confirmarCadastro'&&<p role="status">{aviso}</p>}{erro&&<p role="alert" className="erro">{erro}</p>}
 {editarMedidas&&<EditorMedida medida={medidaCadastro??baseMedida} fechar={()=>setEditarMedidas(false)} aoConfirmar={medida=>setMedidaCadastro(medida)}/>}
 {mesclar&&<Painel titulo="Conectar este aparelho" fechar={()=>{if(!ocupado)setMesclar(false)}}><p>Mesclar envia seus registros para {conta.usuario?.email} e baixa os dados dessa conta. Para registros com o mesmo identificador, vale a alteração mais recente. Registros diferentes na mesma data podem exigir revisão.</p><p>Guarde um backup JSON com fotos antes de continuar. Este aparelho ficará vinculado a esta conta.</p><button className="botao-principal" disabled={ocupado} onClick={()=>void executar(async()=>{await confirmarVinculo();setMesclar(false)})}>{ocupado?'Conectando…':'Confirmar e mesclar'}</button><button className="botao-secundario" disabled={ocupado} onClick={()=>setMesclar(false)}>Agora não</button>{erro&&<p role="alert" className="erro">{erro}</p>}</Painel>}
 </section>
}
export function BotaoSairDaConta(){
 const conta=useConta()
 const [ocupado,definirOcupado]=useState(false),[erro,definirErro]=useState('')
 if(!conta.usuario)return null
 return <div className="saida-config">
  <button type="button" className="sair-conta" disabled={conta.ocupado||ocupado} onClick={async()=>{
   definirOcupado(true);definirErro('')
   try{await sairConta()}catch(e){definirErro(e instanceof Error?e.message:'Não foi possível sair. Tente novamente.')}finally{definirOcupado(false)}
  }}><LogOut size={18}/>{ocupado?'Saindo…':'Sair da conta'}</button>
  <p>Seus registros continuam neste aparelho.</p>
  {erro&&<p role="alert" className="erro">{erro}</p>}
 </div>
}
export function BotaoSincronizar({abrirConta}:{abrirConta?:()=>void}){
 const [pedidoRevisao,definirPedidoRevisao]=useState(0)
 const conta=useConta(),config=useLiveQuery(()=>tabela('configuracoes').where('chave').equals('principal').first())
 const ultima=config?.ultima_sincronizacao?new Date(config.ultima_sincronizacao).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Ainda não realizada'
 const mensagem=conta.mensagem&&!conta.ocupado&&conta.mensagem!=='Dados sincronizados.'?conta.mensagem:''
 return <div className="estado-sync">
  <button className="botao-principal acao-sincronizar" disabled={conta.ocupado||conta.carregando} aria-busy={conta.ocupado} onClick={async()=>{if(!conta.usuario||!conta.vinculado)abrirConta?.();else if(await sincronizar()==='revisar')definirPedidoRevisao(v=>v+1)}}>
   {conta.ocupado?<RefreshCw size={18} className="icone-sincronizando" aria-hidden="true"/>:<CloudUpload size={19} aria-hidden="true"/>}
   <span>{conta.ocupado?'Sincronizando…':!conta.usuario?'Entrar para sincronizar':!conta.vinculado?'Conectar meus dados':'Sincronizar agora'}</span>
  </button>
  <div className="detalhes-sync"><span>Última sincronização</span><time dateTime={config?.ultima_sincronizacao}>{ultima}</time>{conta.pendentes>0&&<span className="pendencias-sync">{conta.pendentes} {conta.pendentes===1?'alteração pendente':'alterações pendentes'}</span>}</div>
  {mensagem&&<p className="mensagem-sync" role="status">{mensagem}</p>}{conta.erro&&<p role="alert" className="erro">{conta.erro}</p>}<RevisaoSincronizacao pedido={pedidoRevisao}/>
 </div>
}

function NomeDaConta() {
 const { usuario } = useConta()
 const [aberto, setAberto] = useState(false)
 const [nome, setNome] = useState('')
 const [ocupado, setOcupado] = useState(false)
 const [erro, setErro] = useState('')
 const formulario = useId()
 const cadastrado = typeof usuario?.user_metadata?.nome === 'string' ? usuario.user_metadata.nome.trim() : ''
 async function salvar(evento: FormEvent) {
  evento.preventDefault()
  if (ocupado || !usuario || !supabase) return
  const completo = nome.trim().replace(/\s+/g, ' ')
  if (!completo || completo.length > 80) { setErro('Informe seu nome, com até 80 caracteres.'); return }
  if (!navigator.onLine) { setErro('Conecte à internet para salvar seu nome na conta.'); return }
  setOcupado(true); setErro('')
  try {
   const { error } = await supabase.auth.updateUser({ data: { nome: completo } })
   if (error) throw new Error('Não foi possível salvar o nome. Tente novamente.')
   setAberto(false)
  } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar o nome.') }
  finally { setOcupado(false) }
 }
 return <><button type="button" className="data-medida" onClick={() => { setNome(cadastrado); setErro(''); setAberto(true) }}><span>Nome completo</span><strong>{cadastrado || 'Informar nome'}</strong></button>
 {aberto && <Painel titulo="Seu nome" fechar={() => { if (!ocupado) setAberto(false) }} acao={<button type="submit" form={formulario} className="botao-principal salvar-cabecalho" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar'}</button>}><form id={formulario} className="formulario formulario-conta" onSubmit={salvar}><label>Nome completo<input autoComplete="name" required maxLength={80} value={nome} disabled={ocupado} onChange={e => setNome(e.target.value)} placeholder="Ex.: Breno Camargo" /></label><p className="nota-resumo">Na tela inicial, mostramos apenas seu primeiro nome.</p>{erro && <p className="erro" role="alert">{erro}</p>}</form></Painel>}
 </>
}
