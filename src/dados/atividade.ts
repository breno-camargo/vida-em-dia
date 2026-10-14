import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { Feriado } from './modelos'
import { dataMedida } from './medidas'
import { validarDataAtividade } from './cardio'
export function inicioSemana(data: string) { const d = new Date(`${data}T12:00:00`); d.setDate(d.getDate() - (d.getDay()+6)%7); return dataMedida(d) }
export function tipoDia(data: string, feriados: Feriado[]) { const dia = new Date(`${data}T12:00:00`).getDay(); return dia === 0 || dia === 6 || feriados.some(f => !f.apagado_em && f.data === data) ? 'fds_feriado' as const : 'util' as const }
export function feriadosNacionais(ano: number) {
  const fixos = [['01-01','Confraternização Universal'],['04-21','Tiradentes'],['05-01','Dia do Trabalho'],['09-07','Independência do Brasil'],['10-12','Nossa Senhora Aparecida'],['11-02','Finados'],['11-15','Proclamação da República'],['11-20','Consciência Negra'],['12-25','Natal']]
  // Computus gregoriano para a sexta-feira anterior à Páscoa.
  const a=ano%19,b=Math.floor(ano/100),c=ano%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451)
  const mes=Math.floor((h+l-7*m+114)/31),dia=(h+l-7*m+114)%31+1
  const sexta=new Date(ano,mes-1,dia-2,12)
  return [...fixos.map(([data,nome]) => ({ data: `${ano}-${data}`, nome })), { data:dataMedida(sexta),nome:'Paixão de Cristo' }]
}
export async function iniciarFeriados(ano = new Date().getFullYear()) {
  await banco.transaction('rw', tabela('configuracoes'), tabela('feriados'), async () => {
    const config = await tabela('configuracoes').where('chave').equals('principal').first()
    if (!config || config.anos_feriados_inicializados?.includes(ano)) return
    for (const f of feriadosNacionais(ano)) { if (!(await tabela('feriados').where('data').equals(f.data).count())) await tabela('feriados').add({ ...criarRegistro(config.user_id), ...f }) }
    await tabela('configuracoes').update(config.id, { anos_feriados_inicializados:[...(config.anos_feriados_inicializados ?? []),ano], atualizado_em:new Date().toISOString() })
  })
}
export async function salvarAtividade(data: string, passos: number, calorias_gastas: number) {
  validarDataAtividade(data)
  if (!Number.isInteger(passos) || passos < 0 || passos > 200000 || !Number.isFinite(calorias_gastas) || calorias_gastas < 0 || calorias_gastas > 20000) throw new Error('Confira os passos e as calorias do dia.')
  await banco.transaction('rw', tabela('configuracoes'), tabela('atividade_diaria'), tabela('feriados'), async () => {
    const config = await tabela('configuracoes').where('chave').equals('principal').first(); if (!config) throw new Error('Reabra o app para carregar as metas.')
    const existente = await tabela('atividade_diaria').where('data').equals(data).filter(a => !a.apagado_em).first()
    const tipo = tipoDia(data, await tabela('feriados').toArray())
    await tabela('atividade_diaria').put({ ...(existente ?? criarRegistro(config.user_id)), data, passos, calorias_gastas, tipo_dia:existente?.tipo_dia ?? tipo, meta_passos_aplicada:existente?.meta_passos_aplicada ?? (tipo === 'util' ? config.meta_passos_util : config.meta_passos_fds_feriado), meta_calorias_gastas_aplicada:existente?.meta_calorias_gastas_aplicada ?? (tipo === 'util' ? config.meta_calorias_gastas_util : config.meta_calorias_gastas_fds_feriado), atualizado_em:new Date().toISOString() })
  })
}
export async function marcarDescanso(data: string, nome = 'Dia de descanso') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || dataMedida(new Date(`${data}T12:00:00`)) !== data) throw new Error('Escolha uma data válida.')
  await banco.transaction('rw', tabela('feriados'), async () => { const existente = await tabela('feriados').where('data').equals(data).filter(f => !f.apagado_em).first(); if (existente) return; await tabela('feriados').add({ ...criarRegistro(), data,nome:nome.trim() || 'Dia de descanso' }) })
}
