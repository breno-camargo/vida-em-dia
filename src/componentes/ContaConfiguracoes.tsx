import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LogOut } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { supabase } from '../sincronizacao/cliente'
import { confirmarVinculo, definirRecuperacao, sairConta, sincronizar, useConta } from '../sincronizacao/estado'
import { tabela } from '../dados/banco'
import { Painel } from './Painel'
export function ContaConfiguracoes({entrada=false,resumida=false}:{entrada?:boolean;resumida?:boolean}){
 const conta=useConta()
 const config=useLiveQuery(()=>tabela('configuracoes').where('chave').equals('principal').first())
 const [email,setEmail]=useState(''),[senha,setSenha]=useState(''),[codigo,setCodigo]=useState('')
 const [modo,setModo]=useState<'entrar'|'recuperar'|'codigo'|'nova'>('entrar')
 const [mostrarSenha,setMostrarSenha]=useState(false)
 const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[aviso,setAviso]=useState(''),[mesclar,setMesclar]=useState(false)
 const executar=async(acao:()=>Promise<void>)=>{setOcupado(true);setErro('');try{await acao()}catch(e){setErro(e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.')}finally{setOcupado(false)}}
 async function enviar(e:FormEvent){e.preventDefault();await executar(async()=>{
  if(!supabase)return
  if(!navigator.onLine)throw new Error('Você está offline. Conecte à internet para acessar sua conta ou continue sem conta.')
  if(modo==='entrar'){
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password:senha})
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
 {conta.carregando?<p role="status">Abrindo sua sessão…</p>:(!conta.usuario||modo==='nova'||modo==='codigo')?<form onSubmit={enviar} className="formulario-conta">
 {modo!=='nova'&&<label>E-mail<input type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@exemplo.com" required value={email} onChange={e=>setEmail(e.target.value)} disabled={ocupado}/></label>}
 {(modo==='entrar'||modo==='nova')&&<div className="campo-senha"><label htmlFor={entrada?'senha-entrada':'senha-conta'}>{modo==='nova'?'Nova senha':'Senha'}</label><div><input id={entrada?'senha-entrada':'senha-conta'} type={mostrarSenha?'text':'password'} placeholder={modo==='nova'?'Pelo menos 8 caracteres':'Sua senha'} autoComplete={modo==='nova'?'new-password':'current-password'} minLength={modo==='nova'?8:1} required value={senha} onChange={e=>setSenha(e.target.value)} disabled={ocupado}/><button type="button" aria-label={mostrarSenha?'Ocultar senha':'Mostrar senha'} aria-pressed={mostrarSenha} onClick={()=>setMostrarSenha(!mostrarSenha)}>{mostrarSenha?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>}
 {modo==='codigo'&&<label>Código recebido por e-mail<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\D/g,''))}/></label>}
 <button className="botao-principal" disabled={ocupado}>{ocupado?'Aguarde…':modo==='entrar'?'Entrar':modo==='recuperar'?'Enviar código':modo==='codigo'?'Confirmar código':'Salvar nova senha'}</button>
 {modo==='entrar'?<button type="button" className="link-conta recuperar-senha" onClick={()=>{setModo('recuperar');definirRecuperacao(true);setSenha('');setErro('')}}>Esqueci minha senha</button>:<button type="button" className="link-conta" onClick={()=>{setModo('entrar');definirRecuperacao(false);setSenha('');setErro('')}}>Voltar para entrar</button>}
 {!entrada&&<small>Sua conta é criada pelo administrador. O treino continua disponível sem login.</small>}
 </form>:<div className="conta-sessao">
 {!resumida&&<p>{conta.usuario.email}</p>}
 {!conta.vinculado?<div className="conta-vinculo"><p>Conecte este aparelho para sincronizar seus registros.</p><button className="botao-principal" onClick={()=>setMesclar(true)}>Conectar meus dados</button></div>:<>
 <BotaoSincronizar/>
 <label className="backup-checkbox"><input type="checkbox" checked={config?.sync_automatico??false} disabled={conta.ocupado} onChange={e=>{if(config)void tabela('configuracoes').update(config.id,{sync_automatico:e.target.checked})}}/>Sincronizar ao abrir, voltar ao app e finalizar treino</label>
 </>}
 <div className="conta-rodape"><button className="sair-conta" disabled={conta.ocupado||ocupado} onClick={()=>void executar(sairConta)}><LogOut size={16}/>Sair da conta</button><p>Seus registros continuam neste aparelho.</p></div>
 <details className="ajuda-conta"><summary>Sobre seus dados</summary><p>Use o app em um aparelho pessoal. Sair mantém os dados e o vínculo com esta conta. As fotos ficam no aparelho; inclua-as no backup JSON para guardá-las.</p></details>
 </div>}
 </>}
 {aviso&&<p role="status">{aviso}</p>}{erro&&<p role="alert" className="erro">{erro}</p>}
 {mesclar&&<Painel titulo="Conectar este aparelho" fechar={()=>{if(!ocupado)setMesclar(false)}}><p>Mesclar envia seus registros para {conta.usuario?.email} e baixa os dados dessa conta. Para registros com o mesmo identificador, vale a alteração mais recente. Registros diferentes na mesma data podem exigir revisão.</p><p>Guarde um backup JSON com fotos antes de continuar. Este aparelho ficará vinculado a esta conta.</p><button className="botao-principal" disabled={ocupado} onClick={()=>void executar(async()=>{await confirmarVinculo();setMesclar(false)})}>{ocupado?'Conectando…':'Confirmar e mesclar'}</button><button className="botao-secundario" disabled={ocupado} onClick={()=>setMesclar(false)}>Agora não</button>{erro&&<p role="alert" className="erro">{erro}</p>}</Painel>}
 </section>
}
export function BotaoSincronizar({abrirConta}:{abrirConta?:()=>void}){
 const conta=useConta(),config=useLiveQuery(()=>tabela('configuracoes').where('chave').equals('principal').first())
 return <div className="estado-sync"><button className="botao-secundario" disabled={conta.ocupado||conta.carregando} onClick={()=>{if(!conta.usuario||!conta.vinculado)abrirConta?.();else void sincronizar()}}>{conta.ocupado?'Sincronizando…':!conta.usuario?'Entrar para sincronizar':!conta.vinculado?'Conectar meus dados':'Sincronizar agora'}</button><small>Última sincronização: {config?.ultima_sincronizacao?new Date(config.ultima_sincronizacao).toLocaleString('pt-BR'):'Nunca'}{conta.pendentes>0?` · ${conta.pendentes} pendências`:''}</small>{conta.mensagem&&<p role="status">{conta.mensagem}</p>}{conta.erro&&<p role="alert" className="erro">{conta.erro}</p>}</div>
}
