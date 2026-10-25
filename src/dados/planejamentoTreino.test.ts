import { expect, test } from 'vitest'
import { planejamentoDoTreino } from './planejamentoTreino'
import { criarRegistro } from './repositorio'
import type { TreinoExercicio, SerieTreino } from './modelos'

test('planejamento limita séries sem modificar a sessão e preserva cardio e ordem', () => {
 const ficha={...criarRegistro(),nome:'Misto',ordem:0}
 const item:TreinoExercicio={...criarRegistro(),treino_id:'t',exercicio_id:'forca',nome:'Força',ordem:0,descanso_segundos:90,tipo:'forca'}
 const cardio={...item,id:'cardio',exercicio_id:'cardio',tipo:'cardio' as const,descanso_segundos:0}
 const series:SerieTreino[]=Array.from({length:23},(_,n)=>({...criarRegistro(),treino_id:'t',exercicio_id:'forca',numero_serie:n+1,tipo:'normal',peso_digitado:0,peso_total:0,repeticoes:10,recorde:false}))
 const antes=JSON.stringify(series)
 const plano=planejamentoDoTreino(ficha,[item,cardio,{...item,id:'removido',apagado_em:'2026-10-18'}],series)
 expect(plano.map(i=>i.series_planejadas)).toEqual([20,1])
 expect(plano.map(i=>i.ordem)).toEqual([0,1])
 expect(plano[1].descanso_segundos).toBe(0)
 expect(JSON.stringify(series)).toBe(antes)
})

test('ignora séries excluídas e de outras sessões e usa mínimo válido para exercício vazio',()=>{
 const ficha={...criarRegistro(),nome:'Teste',ordem:0}
 const item:TreinoExercicio={...criarRegistro(),treino_id:'t',exercicio_id:'e',nome:'Teste',ordem:0,descanso_segundos:90}
 const serie:SerieTreino={...criarRegistro(),treino_id:'t',exercicio_id:'e',numero_serie:1,tipo:'normal',peso_digitado:0,peso_total:0,repeticoes:10,recorde:false}
 expect(planejamentoDoTreino(ficha,[item],[serie,{...serie,id:'excluida',apagado_em:'2026-10-18'},{...serie,id:'outra',treino_id:'outro'}])[0].series_planejadas).toBe(1)
 expect(planejamentoDoTreino(ficha,[item],[])[0].series_planejadas).toBe(1)
})
