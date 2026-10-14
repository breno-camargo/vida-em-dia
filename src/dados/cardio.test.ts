import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro, repositorio } from './repositorio'
import { caloriasCardio, novoCardio, salvarCardio, velocidadeCardio, ritmoCardio, gastoDoDia, recordesCardio } from './cardio'
import { feriadosNacionais, iniciarFeriados, salvarAtividade, tipoDia } from './atividade'
import { salvarMedida } from './medidas'
import { iniciarBiblioteca } from './biblioteca'
import { iniciarTreino, completarCardioDaFicha, concluirSerie, adicionarExercicio } from './treinos'
import { salvarFicha } from './fichas'
beforeEach(async()=>{await banco.delete();await banco.open();await iniciarBanco()})
test('calcule velocidade e ritmo sem inventar distância ou passos',()=>{
 const s={...novoCardio('corrida'),duracao_minutos:30,distancia_km:5}
 expect(velocidadeCardio(s)).toBe(10)
 expect(ritmoCardio(s)).toBe('6:00 min/km')
 expect(velocidadeCardio({...s,velocidade_media_kmh:9})).toBe(9)
 expect(ritmoCardio({...s,distancia_km:undefined})).toBeUndefined()
 expect(s.passos).toBeUndefined()
})
test('preserve calorias da máquina e aplique fator somente na soma',async()=>{
 const s={...novoCardio(),data:'2026-01-03',duracao_minutos:30,calorias_informadas:200}
 await salvarCardio(s)
 const salva=(await tabela('cardio_sessoes').get(s.id))!
 expect(salva.calorias_informadas).toBe(200)
 expect(salva.calorias_estimadas).toBeUndefined()
 expect(caloriasCardio(salva,80)).toBe(160)
 expect(caloriasCardio({...salva,calorias_informadas:0},80)).toBe(0)
})
test('estime pelo último peso até a data, respeite exclusões e ausência de peso',async()=>{
 const semPeso={...novoCardio('eliptico'),data:'2026-01-03',duracao_minutos:30}
 await salvarCardio(semPeso)
 expect((await tabela('cardio_sessoes').get(semPeso.id))?.calorias_estimadas).toBeUndefined()
 await salvarMedida({...criarRegistro(),data:'2026-01-01',peso:70})
 const apagada={...criarRegistro(),data:'2026-01-02',peso:80};await salvarMedida(apagada);await repositorio('medidas_corporais').apagar(apagada.id)
 await salvarMedida({...criarRegistro(),data:'2026-01-04',peso:90})
 await salvarCardio(semPeso)
 expect((await tabela('cardio_sessoes').get(semPeso.id))?.calorias_estimadas).toBe(175)
})
test('evite duplicar o total do relógio com treino e cardio',async()=>{
 const config=(await tabela('configuracoes').where('chave').equals('principal').first())!
 await salvarAtividade('2026-01-03',5000,100)
 const atividade=(await tabela('atividade_diaria').where('data').equals('2026-01-03').first())!
 const treino={...criarRegistro(),data:atividade.data,inicio:'2026-01-03T10:00:00Z',fim:'2026-01-03T11:00:00Z',observacao:'',calorias:300}
 const cardio={...novoCardio(),data:atividade.data,duracao_minutos:30,calorias_informadas:200}
 expect(gastoDoDia(atividade.data,[treino],[cardio],atividade,{...config,fator_calorias_cardio:80})).toBe(560)
 expect(gastoDoDia(atividade.data,[treino],[cardio],atividade,{...config,modo_calorias_gastas:'total_manual'})).toBe(100)
 expect(gastoDoDia(atividade.data,[treino],[cardio],undefined,{...config,modo_calorias_gastas:'total_manual'})).toBeUndefined()
})
test('preserve metas aplicadas mesmo depois de alterar configurações',async()=>{
 await iniciarFeriados(2026)
 await salvarAtividade('2026-10-12',4000,200)
 const config=(await tabela('configuracoes').where('chave').equals('principal').first())!
 await tabela('configuracoes').update(config.id,{meta_passos_fds_feriado:9000})
 await salvarAtividade('2026-10-12',5000,300)
 const registros=await tabela('atividade_diaria').toArray()
 expect(registros).toHaveLength(1)
 expect(registros[0].meta_passos_aplicada).toBe(4000)
 expect(registros[0].passos).toBe(5000)
 expect(registros[0].tipo_dia).toBe('fds_feriado')
})
test('inclua feriados sem duplicar nem restaurar datas removidas',async()=>{
 expect(feriadosNacionais(2026)).toContainEqual({data:'2026-04-03',nome:'Paixão de Cristo'})
 await iniciarFeriados(2026);await iniciarFeriados(2026)
 expect(await tabela('feriados').count()).toBe(10)
 const f=(await tabela('feriados').where('data').equals('2026-10-12').first())!
 expect(tipoDia('2026-10-12',await tabela('feriados').toArray())).toBe('fds_feriado')
 await repositorio('feriados').apagar(f.id);await iniciarFeriados(2026)
 expect(tipoDia('2026-10-12',await tabela('feriados').toArray())).toBe('util')
 expect(tipoDia('2026-10-11',[])).toBe('fds_feriado')
})
test('compare recordes só com sessões anteriores do mesmo tipo',()=>{
 const a={...novoCardio('corrida'),data:'2026-01-01',duracao_minutos:30,distancia_km:5}
 const b={...novoCardio('corrida'),data:'2026-01-02',duracao_minutos:35,distancia_km:7}
 expect(recordesCardio(a,[])).toEqual([])
 expect(recordesCardio(b,[a])).toEqual(['Maior duração','Maior distância','Melhor ritmo'])
 expect(recordesCardio(b,[{...a,tipo:'esteira'}])).toEqual([])
 expect(recordesCardio(b,[{...a,apagado_em:'agora'}])).toEqual([])
})
test('rejeite duração inválida e vínculo com treino de outra data',async()=>{
 await expect(salvarCardio(novoCardio())).rejects.toThrow('duração')
 const treino={...criarRegistro(),data:'2026-01-01',inicio:'2026-01-01T10:00:00Z',observacao:''}
 await tabela('treinos').add(treino)
 await expect(salvarCardio({...novoCardio(),data:'2026-01-02',duracao_minutos:20,treino_id:treino.id})).rejects.toThrow('mesma data')
 await expect(salvarAtividade('2026-01-02',-1,0)).rejects.toThrow('Confira')
})
test('abra ficha de cardio sem criar séries de força',async()=>{
 await iniciarBiblioteca()
 const ex=(await tabela('exercicios').where('nome').equals('Esteira').first())!
 const ficha={...criarRegistro(),nome:'Cardio',ordem:0}
 await salvarFicha(ficha,[{...criarRegistro(),ficha_id:ficha.id,exercicio_id:ex.id,ordem:0,series_planejadas:3,descanso_segundos:90}])
 const id=await iniciarTreino(ficha.id)
 expect(await tabela('series_treino').where('treino_id').equals(id).count()).toBe(0)
 expect((await tabela('treino_exercicios').where('treino_id').equals(id).first())?.tipo).toBe('cardio')
})


test('inclua cardio da ficha ao retomar sem duplicar nem alterar séries já feitas',async()=>{
 await iniciarBiblioteca()
 const exercicios=await tabela('exercicios').toArray(),forca=exercicios.find(e=>e.tipo==='forca')!,cardio=exercicios.find(e=>e.nome==='Esteira')!
 const ficha={...criarRegistro(),nome:'Retomar',ordem:0}
 const item={...criarRegistro(),ficha_id:ficha.id,exercicio_id:forca.id,ordem:0,series_planejadas:3,descanso_segundos:90}
 await salvarFicha(ficha,[item])
 const id=await iniciarTreino(ficha.id),serie=(await tabela('series_treino').where('treino_id').equals(id).first())!
 await concluirSerie({...serie,peso_digitado:5,repeticoes:12})
 const antes=await tabela('series_treino').where('treino_id').equals(id).toArray()
 await salvarFicha(ficha,[item,{...criarRegistro(),ficha_id:ficha.id,exercicio_id:cardio.id,ordem:1,series_planejadas:3,descanso_segundos:90}])
 expect(await iniciarTreino(ficha.id)).toBe(id)
 await Promise.all([completarCardioDaFicha(id),completarCardioDaFicha(id)])
 const planos=await tabela('treino_exercicios').where('treino_id').equals(id).toArray()
 expect(planos.filter(i=>i.tipo==='cardio')).toHaveLength(1)
 expect(await tabela('series_treino').where('treino_id').equals(id).toArray()).toEqual(antes)
 await repositorio('treino_exercicios').apagar(planos.find(i=>i.tipo==='cardio')!.id)
 await completarCardioDaFicha(id)
 expect((await tabela('treino_exercicios').where('treino_id').equals(id).filter(i=>!i.apagado_em).toArray()).filter(i=>i.tipo==='cardio')).toHaveLength(0)
})



test('retire cardio não registrado removido da ficha e preserve adições só do dia',async()=>{
 await iniciarBiblioteca()
 const exercicios=await tabela('exercicios').toArray(),forca=exercicios.find(e=>e.tipo==='forca')!,escada=exercicios.find(e=>e.nome==='Escada')!,esteira=exercicios.find(e=>e.nome==='Esteira')!,bike=exercicios.find(e=>e.nome==='Bicicleta ergométrica')!
 const ficha={...criarRegistro(),nome:'Atualizar cardio',ordem:0}
 const item=(exercicio_id:string,ordem:number)=>({...criarRegistro(),ficha_id:ficha.id,exercicio_id,ordem,series_planejadas:3,descanso_segundos:90})
 const f=item(forca.id,0),c=item(escada.id,1),e=item(esteira.id,2)
 await salvarFicha(ficha,[f,c])
 const id=await iniciarTreino(ficha.id),treino=(await tabela('treinos').get(id))!
 await adicionarExercicio(treino,bike)
 const antiga=(await tabela('treino_exercicios').where('treino_id').equals(id).filter(i=>i.exercicio_id===escada.id).first())!
 await tabela('treino_exercicios').update(antiga.id,{origem_ficha:undefined})
 await salvarFicha(ficha,[f,e])
 await iniciarTreino(ficha.id)
 const ativos=await tabela('treino_exercicios').where('treino_id').equals(id).filter(i=>!i.apagado_em).toArray()
 expect(ativos.map(i=>i.exercicio_id)).toContain(esteira.id)
 expect(ativos.map(i=>i.exercicio_id)).toContain(bike.id)
 expect(ativos.map(i=>i.exercicio_id)).not.toContain(escada.id)
 expect(await tabela('series_treino').where('treino_id').equals(id).count()).toBe(3)
 await salvarFicha(ficha,[f,c,e]);await completarCardioDaFicha(id)
 expect(await tabela('treino_exercicios').where('treino_id').equals(id).filter(i=>i.exercicio_id===escada.id&&!i.apagado_em).count()).toBe(1)
})

test('preserve cardio já registrado quando o planejamento da ficha mudar',async()=>{
 await iniciarBiblioteca()
 const exercicios=await tabela('exercicios').toArray(),forca=exercicios.find(e=>e.tipo==='forca')!,escada=exercicios.find(e=>e.nome==='Escada')!
 const ficha={...criarRegistro(),nome:'Preservar cardio',ordem:0}
 const f={...criarRegistro(),ficha_id:ficha.id,exercicio_id:forca.id,ordem:0,series_planejadas:3,descanso_segundos:90}
 await salvarFicha(ficha,[f,{...criarRegistro(),ficha_id:ficha.id,exercicio_id:escada.id,ordem:1,series_planejadas:3,descanso_segundos:90}])
 const id=await iniciarTreino(ficha.id),treino=(await tabela('treinos').get(id))!
 const s={...novoCardio('escada',id,treino.data),exercicio_id:escada.id,duracao_minutos:15,calorias_informadas:100}
 await salvarCardio(s)
 await salvarFicha(ficha,[f]);await completarCardioDaFicha(id)
 expect((await tabela('cardio_sessoes').get(s.id))?.calorias_informadas).toBe(100)
 expect(await tabela('treino_exercicios').where('treino_id').equals(id).filter(i=>i.exercicio_id===escada.id&&!i.apagado_em).count()).toBe(1)
})
