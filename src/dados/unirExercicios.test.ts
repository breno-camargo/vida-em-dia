import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { filaBanco } from '../sincronizacao/armazenamento'
import { criarRegistro } from './repositorio'
import { gruposDuplicados, unirExercicios } from './unirExercicios'
import type { Exercicio } from './modelos'

beforeEach(async () => { await banco.delete(); await banco.open(); await filaBanco.delete(); await filaBanco.open() })
async function preparar() {
 const a:Exercicio={...criarRegistro(),nome:'Supino',tipo:'forca',grupo_muscular:'Peito',equipamento:'Barra',descanso_padrao_segundos:90,modo_carga:'total',peso_barra:20,nota_fixa:'',como_fazer:'',musculos:'Peito',origem:'manual'}
 const b={...a,id:crypto.randomUUID()}
 await tabela('exercicios').bulkAdd([a,b]); return {a,b}
}
test('une histórico, planejamento e blobs sem alterar IDs dos filhos ou tombstones',async()=>{
 const {a,b}=await preparar(), treino={...criarRegistro(),data:'2026-10-19',inicio:'2026-10-19T10:00:00Z',fim:'2026-10-19T11:00:00Z',observacao:''}
 await tabela('treinos').add(treino)
 const item={...criarRegistro(),treino_id:treino.id,exercicio_id:b.id,nome:b.nome,ordem:0,descanso_segundos:90}
 await tabela('treino_exercicios').add(item)
 const serie={...criarRegistro(),treino_id:treino.id,exercicio_id:b.id,numero_serie:1,tipo:'normal' as const,peso_digitado:20,peso_total:20,repeticoes:10,recorde:false,apagado_em:'2026-10-19T12:00:00Z'}
 await tabela('series_treino').add(serie)
 const foto={...criarRegistro(),tipo:'maquina' as const,angulo:null,data:'2026-10-19',tamanho_bytes:3,exercicio_id:b.id,imagem_local:new Blob(['abc'],{type:'image/png'})}
 await tabela('fotos').add(foto)
 await unirExercicios([a.id,b.id],a.id)
 expect((await tabela('treino_exercicios').get(item.id))?.exercicio_id).toBe(a.id)
 expect(await tabela('series_treino').get(serie.id)).toMatchObject({exercicio_id:a.id,apagado_em:serie.apagado_em,repeticoes:10})
 expect((await tabela('fotos').get(foto.id))?.imagem_local?.size).toBe(3)
 expect((await tabela('fotos').get(foto.id))?.exercicio_id).toBe(a.id)
 expect((await tabela('exercicios').get(b.id))?.apagado_em).toBeTruthy()
})
test('conteúdo ou proprietário diferente não permite união e preserva dados',async()=>{
 const {a,b}=await preparar()
 await tabela('exercicios').update(b.id,{nota_fixa:'Adaptação'})
 await expect(unirExercicios([a.id,b.id],a.id)).rejects.toThrow('diferenças')
 expect((await tabela('exercicios').get(b.id))?.apagado_em).toBeNull()
 expect(gruposDuplicados([a,{...b,user_id:'outra'}])).toEqual([])
})
test('cópias na mesma ficha são bloqueadas antes de alterar fotos ou exercícios',async()=>{
 const {a,b}=await preparar(), ficha={...criarRegistro(),nome:'A',ordem:0}
 await tabela('fichas').add(ficha)
 for(const [ordem,ex] of [a,b].entries())await tabela('ficha_exercicios').add({...criarRegistro(),ficha_id:ficha.id,exercicio_id:ex.id,ordem,series_planejadas:3,descanso_segundos:90})
 await expect(unirExercicios([a.id,b.id],a.id)).rejects.toThrow('mesma ficha')
 expect(await tabela('exercicios').filter(e=>!e.apagado_em).count()).toBe(2)
})
test('treino em andamento impede união',async()=>{
 const {a,b}=await preparar()
 await tabela('treinos').add({...criarRegistro(),data:'2026-10-19',inicio:new Date().toISOString(),observacao:''})
 await expect(unirExercicios([a.id,b.id],a.id)).rejects.toThrow('andamento')
})
