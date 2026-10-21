import { expect, test } from 'vitest'
import { handlerExclusao, handlerPurga, segredoIgual, type ServicosExclusao } from '../../supabase/functions/_shared/handlers'
const origem='https://staging.example.test'
const pedido=(senha='senha-atual')=>new Request('https://edge.test/excluir-conta',{method:'POST',headers:{origin:origem,authorization:'Bearer jwt-sintetico'},body:JSON.stringify({senha,confirmacao:'EXCLUIR MINHA CONTA'})})
function exemplo(){
 const chamadas:string[]=[];let falhar=true
 const s:ServicosExclusao={origem,async validarJWT(){chamadas.push('jwt');return{id:'A',email:'sintetico@example.test'}},async tentar(){chamadas.push('limite');return true},async verificarSenha(_email,senha){chamadas.push('senha-anon');return senha==='senha-atual'?'A':null},async marcar(_id,etapa){chamadas.push('etapa:'+etapa)},async apagarStorage(){chamadas.push('storage');if(falhar)throw new Error('segredo interno')},async apagarLinhas(){chamadas.push('dados')},async apagarAuth(){chamadas.push('auth')}}
 return{s,chamadas,liberar(){falhar=false}}
}
test('valida JWT, limita tentativas e reautentica antes de alterar; falha parcial informa estado e permite retry',async()=>{
 const e=exemplo(),handler=handlerExclusao(e.s)
 const primeira=await handler(pedido());expect(primeira.status).toBe(503)
 const body=await primeira.text();expect(body).toContain('storage');expect(body).not.toMatch(/segredo interno|jwt-sintetico|sintetico@|senha-atual/)
 expect(e.chamadas).not.toContain('dados');expect(e.chamadas).not.toContain('auth')
 e.liberar();const segunda=await handler(pedido());expect(await segunda.json()).toEqual({concluido:true})
 expect(e.chamadas.slice(-8)).toEqual(['limite','senha-anon','etapa:storage','storage','etapa:dados','dados','etapa:auth','auth'])
})
test('senha errada, usuário da reautenticação diferente, origem e JWT inválidos não apagam nada',async()=>{
 const e=exemplo();expect((await handlerExclusao(e.s)(pedido('errada'))).status).toBe(401)
 e.s.verificarSenha=async()=> 'B';expect((await handlerExclusao(e.s)(pedido())).status).toBe(401)
 e.s.validarJWT=async()=>null;expect((await handlerExclusao(e.s)(pedido())).status).toBe(401)
 const r=pedido();r.headers.set('origin','https://outro.test');expect((await handlerExclusao(e.s)(r)).status).toBe(403)
 expect(e.chamadas).not.toContain('storage')
})
test('limite de tentativas bloqueia reautenticação e falha em Auth continua repetível',async()=>{
 const e=exemplo();e.s.tentar=async()=>false
 expect((await handlerExclusao(e.s)(pedido())).status).toBe(429);expect(e.chamadas).not.toContain('senha-anon')
 e.s.tentar=async()=>true;e.liberar();e.s.apagarAuth=async()=>{throw new Error('falha')}
 const r=await handlerExclusao(e.s)(pedido());expect((await r.json()).etapa).toBe('auth')
 expect(e.chamadas).toContain('dados')
})
test('endpoint sem cron exige segredo comparado por digest e conserva retry de Storage',async()=>{
 expect(await segredoIgual('a','a')).toBe(true);expect(await segredoIgual('a','b')).toBe(false)
 const segredo='s'.repeat(48),chamadas:string[]=[]
 const h=handlerPurga({origem,segredo,async purgar(){chamadas.push('sql')},async removerObjetos(){chamadas.push('api');throw new Error('offline')}})
 const req=(token:string)=>new Request('https://edge.test/purgar',{method:'POST',headers:{authorization:'Bearer '+token}})
 expect((await h(req('errado'))).status).toBe(401)
 expect((await h(req(segredo))).status).toBe(503);expect(chamadas).toEqual(['sql','api'])
})
