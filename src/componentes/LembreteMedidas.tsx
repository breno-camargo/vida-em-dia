import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Ruler, ArrowRight } from 'lucide-react'
import { tabela } from '../dados/banco'
import { lembreteMedidas } from '../dados/medidas'
export function LembreteMedidas({ abrir }: { abrir: () => void }) {
  const [agora, definirAgora] = useState(() => new Date())
  useEffect(() => { const atualizar = () => definirAgora(new Date()); const timer = setInterval(atualizar, 60000); document.addEventListener('visibilitychange', atualizar); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', atualizar) } }, [])
  const dados = useLiveQuery(async () => ({ config: await tabela('configuracoes').where('chave').equals('principal').first(), medidas: await tabela('medidas_corporais').filter(m => !m.apagado_em).toArray() }))
  if (!dados || !lembreteMedidas(dados.medidas, dados.config?.dia_lembrete_medidas ?? 6, agora)) return null
  return <section className="lembrete-medidas"><Ruler size={22} /><div><h2>Hora de registrar suas medidas</h2><p>Você ainda não registrou nesta semana.</p><button onClick={abrir}>Registrar agora<ArrowRight size={16} /></button></div></section>
}
