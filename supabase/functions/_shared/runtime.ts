declare const Deno:{env:{get(nome:string):string|undefined};serve(handler:(req:Request)=>Promise<Response>):void}
export function configuracaoAmbiente(ler:(nome:string)=>string=(n)=>Deno.env.get(n)??''){
 try{
  const url=ler('SUPABASE_URL'),esperado=ler('EXPECTED_PROJECT_REF'),origem=ler('APP_ORIGIN'),ambiente=ler('APP_ENV')
  const servidor=new URL(url),app=new URL(origem)
  // SUPABASE_URL é injetada pela plataforma. Nunca assumir um projeto padrão.
  const real=servidor.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1]
  if(!esperado||!real||real!==esperado||servidor.protocol!=='https:'||servidor.port||servidor.username||servidor.password||servidor.pathname!=='/'||servidor.search||servidor.hash)throw new Error()
  if(!['staging','production'].includes(ambiente)||app.origin!==origem||!['https:','http:'].includes(app.protocol)||(ambiente==='production'&&app.protocol!=='https:'))throw new Error()
  const anon=ler('SUPABASE_ANON_KEY'),service=ler('SUPABASE_SERVICE_ROLE_KEY')
  if(!anon||!service)throw new Error()
  return {url,anon,service,origem,segredo:ler('PURGA_SECRET')}
 }catch{
  // URL inválida e demais erros de configuração nunca expõem ref, URL ou secret.
  throw new Error('Configuração do ambiente inválida. Execução recusada.')
 }
}
export const servir=(handler:(req:Request)=>Promise<Response>)=>Deno.serve(handler)
