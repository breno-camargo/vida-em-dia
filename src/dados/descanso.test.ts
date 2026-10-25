import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { criarRegistro } from './repositorio'
import { salvarFicha } from './fichas'
import { adicionarExercicio, iniciarTreino } from './treinos'
import { salvarDescansoExercicio } from './descanso'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca() })
async function preparar() {
  const [a,b] = await tabela('exercicios').filter(e=>e.tipo==='forca').toArray()
  const ficha = {...criarRegistro(),nome:'Ficha A',ordem:0}
  const outra = {...criarRegistro(),nome:'Ficha B',ordem:1}
  const vinculo = (ficha_id:string,exercicio_id:string,descanso_segundos:number,ordem=0)=>({...criarRegistro(),ficha_id,exercicio_id,descanso_segundos,ordem,series_planejadas:2})
  const va=vinculo(ficha.id,a.id,90),vb=vinculo(ficha.id,b.id,120,1),vc=vinculo(outra.id,a.id,45)
  await salvarFicha(ficha,[va,vb]); await salvarFicha(outra,[vc])
  const treino=await iniciarTreino(ficha.id)
  const item=(await tabela('treino_exercicios').where('treino_id').equals(treino).toArray()).find(i=>i.exercicio_id===a.id)!
  return {a,ficha,va,vb,vc,treino,item}
}
test('lembra na próxima sessão, sem alterar outro exercício ou outra ficha',async()=>{
  const {a,ficha,va,vb,vc,treino,item}=await preparar()
  await salvarDescansoExercicio(item.id,60)
  expect((await tabela('ficha_exercicios').get(va.id))?.descanso_segundos).toBe(60)
  expect((await tabela('ficha_exercicios').get(vb.id))?.descanso_segundos).toBe(120)
  expect((await tabela('ficha_exercicios').get(vc.id))?.descanso_segundos).toBe(45)
  expect((await tabela('exercicios').get(a.id))?.descanso_padrao_segundos).toBe(a.descanso_padrao_segundos)
  await tabela('treinos').update(treino,{fim:new Date().toISOString()})
  const proximo=await iniciarTreino(ficha.id)
  expect((await tabela('treino_exercicios').where('treino_id').equals(proximo).toArray()).find(i=>i.exercicio_id===a.id)?.descanso_segundos).toBe(60)
})
test('a última alteração prevalece e não muda o cronômetro em andamento',async()=>{
  const {item,treino,va}=await preparar(),fim=new Date(Date.now()+90000).toISOString()
  await tabela('treinos').update(treino,{descanso_fim:fim})
  await salvarDescansoExercicio(item.id,60);await salvarDescansoExercicio(item.id,120)
  expect((await tabela('ficha_exercicios').get(va.id))?.descanso_segundos).toBe(120)
  expect((await tabela('treinos').get(treino))?.descanso_fim).toBe(fim)
})
test('treino livre lembra o padrão do exercício na próxima inclusão',async()=>{
  const ex=(await tabela('exercicios').toArray())[0],id=await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(id))!,ex)
  const item=(await tabela('treino_exercicios').where('treino_id').equals(id).toArray())[0]
  await salvarDescansoExercicio(item.id,120)
  await tabela('treinos').update(id,{fim:new Date().toISOString()})
  const novo=await iniciarTreino();await adicionarExercicio((await tabela('treinos').get(novo))!,(await tabela('exercicios').get(ex.id))!)
  expect((await tabela('treino_exercicios').where('treino_id').equals(novo).toArray())[0].descanso_segundos).toBe(120)
})
test('não recria vínculo removido da ficha',async()=>{
  const {item,va}=await preparar();await tabela('ficha_exercicios').update(va.id,{apagado_em:new Date().toISOString()})
  await salvarDescansoExercicio(item.id,60)
  expect((await tabela('ficha_exercicios').get(va.id))?.descanso_segundos).toBe(90)
  expect((await tabela('treino_exercicios').get(item.id))?.descanso_segundos).toBe(60)
})
test('rejeita tempo inválido e treino finalizado sem gravação parcial',async()=>{
  const {item,va,treino}=await preparar()
  for(const valor of [-1,1.5,Infinity,3601])await expect(salvarDescansoExercicio(item.id,valor)).rejects.toThrow()
  await tabela('treinos').update(treino,{fim:new Date().toISOString()})
  await expect(salvarDescansoExercicio(item.id,60)).rejects.toThrow('andamento')
  expect((await tabela('treino_exercicios').get(item.id))?.descanso_segundos).toBe(90)
  expect((await tabela('ficha_exercicios').get(va.id))?.descanso_segundos).toBe(90)
})
