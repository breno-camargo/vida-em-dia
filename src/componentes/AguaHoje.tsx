import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplets, Undo2 } from 'lucide-react'
import { tabela } from '../dados/banco'
import { registrarGarrafa } from '../dados/agua'
import { dataMedida } from '../dados/medidas'
export function AguaHoje({ configurar, compacto = false }: { configurar: () => void; compacto?: boolean }) {
  const [data, definirData] = useState(() => dataMedida(new Date()))
  useEffect(() => { const t = setInterval(() => definirData(dataMedida(new Date())), 1000); return () => clearInterval(t) }, [])
  const dados = useLiveQuery(async () => ({ config: await tabela('configuracoes').where('chave').equals('principal').first(), registros: await tabela('agua_dia').where('data').equals(data).filter(r => !r.apagado_em).toArray() }), [data])
  const [ocupado, definirOcupado] = useState(false), [erro, definirErro] = useState('')
  const registro = dados?.registros[0], ml = registro?.ml ?? 0, capacidade = dados?.config?.garrafa_ml, meta = dados?.config?.meta_agua_ml ?? 2000
  const alterar = async (desfazer = false) => { if (ocupado) return; definirOcupado(true); definirErro(''); try { await registrarGarrafa(data, desfazer) } catch (e) { definirErro(e instanceof Error ? e.message : 'Não foi possível registrar.') } finally { definirOcupado(false) } }
  if (compacto) return <section className="agua-no-treino" aria-label="Água durante o treino">
    <div className="agua-treino-resumo"><Droplets size={18} aria-hidden="true" /><span><strong>Água</strong><small aria-live="polite">{ml.toLocaleString('pt-BR')} / {meta.toLocaleString('pt-BR')} ml</small></span></div>
    <button type="button" className="botao-secundario" aria-label={capacidade ? `+1 garrafa · ${capacidade.toLocaleString('pt-BR')} ml` : 'Configurar garrafa'} disabled={ocupado || !dados} onClick={() => capacidade ? void alterar() : configurar()}>{capacidade ? `+ ${capacidade.toLocaleString('pt-BR')} ml` : 'Configurar garrafa'}</button>
    <button type="button" className="botao-secundario agua-treino-desfazer" aria-label="Desfazer última garrafa" title="Desfazer última garrafa" disabled={ocupado || !registro?.garrafas_ml?.length} onClick={() => void alterar(true)}><Undo2 size={17} aria-hidden="true" /></button>
    {erro && <p className="erro" role="alert">{erro}</p>}
  </section>
  return <div className="cartao agua-hoje"><Droplets className="azul" /><span>Água</span><strong>{ml.toLocaleString('pt-BR')} <small>ml</small></strong><small className="resumo-agua"><span>{registro?.garrafas_ml?.length ?? 0} garrafas</span><span>Meta {meta.toLocaleString('pt-BR')} ml</span></small><progress aria-label="Meta diária de água" value={Math.min(ml, meta)} max={Math.max(1, meta)} /><button className="botao-secundario" disabled={ocupado || !dados} onClick={() => capacidade ? void alterar() : configurar()}>{capacidade ? '+1 garrafa' : 'Minha garrafa'}</button><button className="link-conta desfazer-agua" style={{ visibility: registro?.garrafas_ml?.length ? 'visible' : 'hidden' }} disabled={ocupado || !registro?.garrafas_ml?.length} onClick={() => void alterar(true)}>Desfazer última</button>{erro && <small role="alert">{erro}</small>}</div>
}
