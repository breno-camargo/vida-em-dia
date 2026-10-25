import { expect, test } from 'vitest'
import { configuracaoAmbiente } from '../../supabase/functions/_shared/runtime'
function ambiente(tipo='staging'){
 const ref=(tipo==='staging'?'a':'b').repeat(20)
 const valores:Record<string,string>={APP_ENV:tipo,SUPABASE_URL:`https://${ref}.supabase.co`,EXPECTED_PROJECT_REF:ref,APP_ORIGIN:`https://${tipo}.example.test`,SUPABASE_ANON_KEY:'anon-sintetica',SUPABASE_SERVICE_ROLE_KEY:'servico-sintetico',PURGA_SECRET:'segredo-sintetico'}
 return {valores,ler:(nome:string)=>valores[nome]??''}
}
test('EXPECTED_PROJECT_REF ausente recusa, mesmo com URL injetada válida',()=>{
 const e=ambiente();delete e.valores.EXPECTED_PROJECT_REF
 expect(()=>configuracaoAmbiente(e.ler)).toThrow('Execução recusada')
})
test('ref divergente recusa sem divulgar ref ou secrets',()=>{
 const e=ambiente();e.valores.EXPECTED_PROJECT_REF='c'.repeat(20)
 try{configuracaoAmbiente(e.ler);throw new Error('Deveria recusar')}
 catch(erro){expect((erro as Error).message).toBe('Configuração do ambiente inválida. Execução recusada.')}
})
test.each(['staging','production'])('%s aceita somente ref correspondente e origem de configuração',tipo=>{
 const e=ambiente(tipo),c=configuracaoAmbiente(e.ler)
 expect(c.url).toBe(e.valores.SUPABASE_URL);expect(c.origem).toBe(e.valores.APP_ORIGIN)
 expect(c.service).toBe('servico-sintetico')
})
test('URL inválida, domínio disfarçado e configuração incompleta falham fechados',()=>{
 for(const mudar of [
  (v:Record<string,string>)=>{v.SUPABASE_URL='url-invalida-com-ref'},
  (v:Record<string,string>)=>{v.SUPABASE_URL+='@outro.example.test'},
  (v:Record<string,string>)=>{v.SUPABASE_URL+='.outro.example.test'},
  (v:Record<string,string>)=>{v.APP_ORIGIN+='/'},
  (v:Record<string,string>)=>{v.SUPABASE_SERVICE_ROLE_KEY=''},
  (v:Record<string,string>)=>{v.APP_ENV=''},
 ]){const e=ambiente();mudar(e.valores);expect(()=>configuracaoAmbiente(e.ler)).toThrow('Configuração do ambiente inválida. Execução recusada.')}
 const e=ambiente('production');e.valores.APP_ORIGIN='http://production.example.test';expect(()=>configuracaoAmbiente(e.ler)).toThrow('Execução recusada')
})
