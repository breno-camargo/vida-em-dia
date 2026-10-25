export interface ServicosExclusao {
 origem:string
 validarJWT(token:string):Promise<{id:string;email?:string}|null>
 tentar(id:string):Promise<boolean>
 verificarSenha(email:string,senha:string):Promise<string|null>
 marcar(id:string,etapa:string):Promise<void>
 apagarStorage(id:string):Promise<void>
 apagarLinhas(id:string):Promise<void>
 apagarAuth(id:string):Promise<void>
}
function resposta(status:number,body:unknown,origem?:string){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(origem?{'Access-Control-Allow-Origin':origem,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})}})}
export function handlerExclusao(s:ServicosExclusao){return async(req:Request)=>{
 if(!s.origem||req.headers.get('origin')!==s.origem)return resposta(403,{erro:'Origem não autorizada.'})
 if(req.method==='OPTIONS')return resposta(200,{},s.origem)
 if(req.method!=='POST')return resposta(405,{erro:'Método inválido.'},s.origem)
 let etapa='autenticacao'
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const usuario=token?await s.validarJWT(token):null
  if(!usuario?.email)return resposta(401,{erro:'Entre novamente para excluir sua conta.'},s.origem)
  if(!await s.tentar(usuario.id))return resposta(429,{erro:'Limite de tentativas. Aguarde 15 minutos.'},s.origem)
  const texto=await req.text();if(texto.length>16384)return resposta(413,{erro:'Solicitação muito grande.'},s.origem)
  let dados:{senha?:unknown;confirmacao?:unknown};try{dados=JSON.parse(texto)}catch{return resposta(400,{erro:'Solicitação inválida.'},s.origem)}
  if(dados.confirmacao!=='EXCLUIR MINHA CONTA'||typeof dados.senha!=='string'||!dados.senha||dados.senha.length>1024)return resposta(400,{erro:'Confirme a exclusão e informe sua senha atual.'},s.origem)
  // Reautenticação feita AGORA por cliente anon, não pelo cliente de serviço.
  if(await s.verificarSenha(usuario.email,dados.senha)!==usuario.id)return resposta(401,{erro:'Não foi possível confirmar sua senha.'},s.origem)
  dados.senha=undefined
  etapa='storage';await s.marcar(usuario.id,etapa);await s.apagarStorage(usuario.id)
  etapa='dados';await s.marcar(usuario.id,etapa);await s.apagarLinhas(usuario.id)
  etapa='auth';await s.marcar(usuario.id,etapa);await s.apagarAuth(usuario.id)
  return resposta(200,{concluido:true},s.origem)
 }catch{
  // Nunca devolver erro do SDK, stack, senha, e-mail ou JWT.
  return resposta(503,{concluido:false,etapa,erro:etapa==='autenticacao'?'Não foi possível autenticar a solicitação.':'Exclusão incompleta. Parte dos dados remotos pode ter sido apagada. Seus dados locais permanecem. Repita a exclusão para concluir.'},s.origem)
 }
}}
export async function segredoIgual(recebido:string,esperado:string){
 const encoder=new TextEncoder(),[a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(recebido)),crypto.subtle.digest('SHA-256',encoder.encode(esperado))])
 const x=new Uint8Array(a),y=new Uint8Array(b);let diferenca=0;for(let i=0;i<32;i++)diferenca|=x[i]^y[i]
 return diferenca===0
}
export function handlerPurga(s:{segredo:string;origem:string;purgar:()=>Promise<void>;removerObjetos:()=>Promise<void>}){return async(req:Request)=>{
 const origem=req.headers.get('origin');if(origem&&origem!==s.origem)return resposta(403,{erro:'Origem não autorizada.'})
 if(req.method!=='POST')return resposta(405,{erro:'Método inválido.'})
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'')??''
 if(s.segredo.length<32||!await segredoIgual(token,s.segredo))return resposta(401,{erro:'Não autorizado.'})
 try{await s.purgar();await s.removerObjetos();return resposta(200,{concluido:true})}
 catch{return resposta(503,{concluido:false,erro:'Purga parcial. Objetos pendentes serão tentados novamente.'})}
}}
