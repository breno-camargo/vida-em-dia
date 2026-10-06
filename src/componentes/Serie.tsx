import { useState } from 'react'
import type { SerieTreino } from '../dados/modelos'
import { cargaTotal } from '../utilitarios/treino'
import { liberarAudio } from '../utilitarios/alerta'
function Numero({ rotulo, valor, alterar, passo = 1, decimal = false }: { rotulo: string; valor: number; alterar: (valor: number) => void; passo?: number; decimal?: boolean }) {
  return <label>{rotulo}<div className="ajuste-numero"><button type="button" aria-label={`Diminuir ${rotulo}`} onClick={() => alterar(Math.max(0, valor - passo))}>−</button><input type="number" min="0" step={passo} inputMode={decimal ? 'decimal' : 'numeric'} value={valor} onChange={e => alterar(Number(e.target.value))} /><button type="button" aria-label={`Aumentar ${rotulo}`} onClick={() => alterar(valor + passo)}>+</button></div></label>
}
export function Serie({ serie, destaque, anterior, salvar, concluir, desfazer }: {
  serie: SerieTreino; destaque: boolean; anterior?: SerieTreino
  salvar: (serie: SerieTreino) => Promise<void>; concluir: (serie: SerieTreino) => Promise<void>; desfazer: () => Promise<void>
}) {
  const [dados, definir] = useState(serie)
  const [editar, definirEditar] = useState(false)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const realizar = async (acao: () => Promise<void>) => {
    definirOcupado(true); definirErro('')
    try { await acao(); definirEditar(false) } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar a série.') }
    finally { definirOcupado(false) }
  }
  const alterar = (campo: Partial<SerieTreino>) => {
    const novos = { ...dados, ...campo }; definir(novos)
    if (!serie.concluida_em) void salvar(novos).catch(() => definirErro('Não foi possível guardar a alteração. Tente salvar novamente.'))
  }
  if (serie.concluida_em && !editar) return <section className="serie concluida"><h3>Série {serie.numero_serie} · {serie.tipo === 'aquecimento' ? 'Aquecimento' : serie.tipo === 'dropset' ? 'Drop set' : serie.tipo === 'falha' ? 'Até a falha' : 'Normal'}</h3><p>{serie.repeticoes} reps × {serie.peso_total} kg{serie.tipo === 'dropset' ? ` + ${serie.reducoes?.length ?? 0} reduções` : ''}</p><div className="acoes"><button onClick={() => definirEditar(true)}>Editar</button><button disabled={ocupado} onClick={() => void realizar(desfazer)}>Desfazer conclusão</button></div>{erro && <p role="alert">{erro}</p>}</section>
  return <section className={`serie formulario ${destaque ? 'proxima-serie' : ''}`}><h3>Série {serie.numero_serie}{destaque ? ' · Próxima' : ''}</h3>
    <label>Tipo<select value={dados.tipo} onChange={e => alterar({ tipo: e.target.value as SerieTreino['tipo'] })}><option value="normal">Normal</option><option value="aquecimento">Aquecimento</option><option value="falha">Até a falha</option><option value="dropset">Drop set</option></select></label>
    <label>Carga<select value={dados.modo_carga ?? 'total'} onChange={e => alterar({ modo_carga: e.target.value as SerieTreino['modo_carga'] })}><option value="total">Total</option><option value="por_lado">Por lado</option></select></label>
    <Numero rotulo={dados.modo_carga === 'por_lado' ? 'Peso de um lado (kg)' : 'Peso total (kg)'} valor={dados.peso_digitado} passo={0.5} decimal alterar={peso_digitado => alterar({ peso_digitado })} />
    {dados.modo_carga === 'por_lado' && <label>Barra (kg, use 0 para não somar)<input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={dados.peso_barra ?? 20} onChange={e => alterar({ peso_barra: Number(e.target.value) })} /></label>}
    <small>Carga total: {cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra)} kg</small>
    <Numero rotulo="Repetições" valor={dados.repeticoes} alterar={repeticoes => alterar({ repeticoes })} />
    {dados.tipo === 'dropset' && <div>{(dados.reducoes ?? []).map((reducao, i) => <div className="reducao" key={i}><span>Redução {i + 1}</span><Numero decimal passo={0.5} rotulo="Carga digitada (kg)" valor={reducao.peso_digitado} alterar={peso_digitado => alterar({ reducoes: dados.reducoes!.map((r, j) => i === j ? { ...r, peso_digitado } : r) })} /><Numero rotulo="Repetições da redução" valor={reducao.repeticoes} alterar={repeticoes => alterar({ reducoes: dados.reducoes!.map((r, j) => i === j ? { ...r, repeticoes } : r) })} /><button type="button" className="botao-secundario" onClick={() => alterar({ reducoes: dados.reducoes!.filter((_, j) => j !== i) })}>Retirar redução</button></div>)}<button type="button" className="botao-secundario" onClick={() => alterar({ reducoes: [...(dados.reducoes ?? []), { peso_digitado: Math.max(0, dados.peso_digitado * 0.75), repeticoes: dados.repeticoes }] })}>Adicionar redução sem descanso</button></div>}
    <details><summary>Esforço (opcional)</summary><label>RPE · 1 a 10<input type="number" inputMode="decimal" min="1" max="10" step="0.5" value={dados.rpe ?? ''} onChange={e => alterar({ rpe: e.target.value === '' ? undefined : Number(e.target.value) })} /></label></details>
    {anterior && <button className="botao-secundario" disabled={ocupado} onClick={() => { const copia = { ...dados, peso_digitado: anterior.peso_digitado, repeticoes: anterior.repeticoes, modo_carga: anterior.modo_carga, peso_barra: anterior.peso_barra }; definir(copia); void realizar(() => salvar(copia)) }}>Copiar série anterior</button>}
    {erro && <p className="erro" role="alert">{erro}</p>}
    <button className="botao-principal largura-total" disabled={ocupado} onClick={() => { liberarAudio(); void realizar(() => serie.concluida_em ? salvar(dados) : concluir(dados)) }}>{ocupado ? 'Salvando…' : serie.concluida_em ? 'Salvar correção' : 'Concluir'}</button>
    {!serie.concluida_em && <button className="botao-secundario" disabled={ocupado} onClick={() => void realizar(() => salvar(dados))}>Salvar sem concluir</button>}
  </section>
}
