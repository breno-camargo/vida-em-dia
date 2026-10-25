// Paridade obrigatória com vida_em_dia_retencao_dias() na migração SQL.
export const RETENCAO_REMOVIDOS_DIAS = 30
export interface Tombstone { id:string; user_id:string|null; apagado_em:string; eliminado_em:string }
export function eliminado(r:Record<string,unknown>|undefined): r is Tombstone & Record<string,unknown> { return typeof r?.eliminado_em==='string' }
export function tombstone(r:{id:string;user_id:string|null;apagado_em?:unknown}, quando=new Date().toISOString()):Tombstone {
 return {id:r.id,user_id:r.user_id,apagado_em:typeof r.apagado_em==='string'?r.apagado_em:quando,eliminado_em:quando}
}
