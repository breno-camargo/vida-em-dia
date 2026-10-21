declare const Deno:{env:{get(nome:string):string|undefined};serve(handler:(req:Request)=>Promise<Response>):void}
export function configuracaoStaging(){
 const ler=(n:string)=>Deno.env.get(n)??''
 const url=ler('SUPABASE_URL'),ref=ler('STAGING_PROJECT_REF'),origem=ler('APP_ORIGIN')
 if(ler('APP_ENV')!=='staging'||!ref||new URL(url).hostname!==ref+'.supabase.co'||new URL(origem).origin!==origem)throw new Error('Ambiente staging não configurado.')
 const anon=ler('SUPABASE_ANON_KEY'),service=ler('SUPABASE_SERVICE_ROLE_KEY')
 if(!anon||!service)throw new Error('Secrets do servidor ausentes.')
 return {url,anon,service,origem,segredo:ler('PURGA_SECRET')}
}
export const servir=(handler:(req:Request)=>Promise<Response>)=>Deno.serve(handler)
