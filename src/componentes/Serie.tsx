import { useState } from 'react'
import { Ellipsis } from 'lucide-react'
import type { SerieTreino } from '../dados/modelos'
import { cargaTotal } from '../utilitarios/treino'
import { liberarAudio } from '../utilitarios/alerta'
import { Painel } from './Painel'
import { SelecionarValores } from './SelecionarValores'
export function Serie({ serie, destaque, anterior, salvar, concluir, desfazer, aplicarProximas, remover }: {
  serie: SerieTreino; destaque: boolean; anterior?: SerieTreino
  salvar: (serie: SerieTreino) => Promise<void>; concluir: (serie: SerieTreino) => Promise<void>; desfazer: () => Promise<void>
  aplicarProximas: (serie: SerieTreino) => Promise<void>; remover: () => Promise<void>
}) {
  const [dados, definir] = useState(serie)
  const [versao, definirVersao] = useState(serie.atualizado_em)
  if (versao !== serie.atualizado_em) { definirVersao(serie.atualizado_em); definir(serie) }
  const semPeso = dados.modo_carga === 'peso_corporal'
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [opcoesAbertas, definirOpcoesAbertas] = useState(false)
  const [tipoAberto, definirTipoAberto] = useState(false)
  const [valoresAbertos, definirValoresAbertos] = useState(false)
  const [reducaoAtiva, definirReducaoAtiva] = useState<number | null>(null)
  const realizar = async (acao: () => Promise<void>) => {
    definirOcupado(true); definirErro('')
    try { await acao() } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar a série.') }
    finally { definirOcupado(false) }
  }
  const alterar = (campo: Partial<SerieTreino>) => {
    const novos = { ...dados, ...campo }; definir(novos)
    void salvar(novos).catch(() => definirErro('Não foi possível guardar a alteração. Tente salvar novamente.'))
  }
  return <section className={`serie serie-compacta ${serie.concluida_em ? 'concluida' : destaque ? 'proxima-serie' : ''}`} aria-label={`Série ${serie.numero_serie}${serie.concluida_em ? ', concluída' : destaque ? ', próxima série' : ''}`}>
    <div className={`linha-serie${semPeso ? ' sem-peso' : ''}`}><button className={`tipo-serie ${dados.tipo}`} aria-label={`Tipo da série ${serie.numero_serie}`} onClick={() => definirTipoAberto(true)}>{dados.tipo === 'aquecimento' ? 'A' : dados.tipo === 'dropset' ? 'D' : dados.tipo === 'falha' ? 'F' : serie.numero_serie}</button><button className="valor-serie" aria-label={`Selecionar repetições da série ${serie.numero_serie}`} onClick={() => definirValoresAbertos(true)}>{dados.repeticoes}</button>{!semPeso && <button className="valor-serie" aria-label={`Selecionar carga da série ${serie.numero_serie}`} onClick={() => definirValoresAbertos(true)}>{dados.peso_digitado.toLocaleString('pt-BR')}</button>}<button className="concluir-compacto" aria-label={serie.concluida_em ? `Desfazer conclusão da série ${serie.numero_serie}` : `Concluir série ${serie.numero_serie}`} disabled={ocupado} onClick={() => { liberarAudio(); void realizar(() => serie.concluida_em ? desfazer() : concluir(dados)) }}>{ocupado ? '…' : serie.concluida_em ? 'Feita' : 'Concluir'}</button><button className="menu-serie" aria-label={`Opções da série ${serie.numero_serie}`} aria-expanded={opcoesAbertas} aria-controls={`opcoes-serie-${serie.id}`} onClick={() => definirOpcoesAbertas(!opcoesAbertas)}><Ellipsis size={18} aria-hidden="true" /></button></div>
    {dados.modo_carga === 'por_lado' && <small className="carga-por-lado">Por lado · total {cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra)} kg</small>}
    <div className="opcoes-serie" id={`opcoes-serie-${serie.id}`} hidden={!opcoesAbertas}><div className="formulario">
    <label>Carga<select value={dados.modo_carga ?? 'total'} onChange={e => alterar({ modo_carga: e.target.value as SerieTreino['modo_carga'], ...(e.target.value === 'peso_corporal' ? { peso_digitado: 0, peso_total: 0, peso_barra: 0, reducoes: [] } : {}) })}><option value="total">Total</option><option value="por_lado">Por lado</option><option value="peso_corporal">Peso corporal</option></select></label>
    {dados.modo_carga === 'por_lado' && <label>Barra (kg, use 0 para não somar)<select value={dados.peso_barra ?? 20} onChange={e => alterar({ peso_barra: Number(e.target.value) })}>{Array.from({ length: 201 }, (_, i) => <option key={i} value={i / 2}>{i / 2} kg</option>)}</select></label>}
    {!semPeso && <small>Carga total: {cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra)} kg</small>}
    {!semPeso && dados.tipo === 'dropset' && <div>{(dados.reducoes ?? []).map((reducao, i) => <div className="reducao" key={i}><span>Redução {i + 1}</span><button type="button" className="botao-descanso" onClick={() => definirReducaoAtiva(i)}>{reducao.repeticoes} reps · {reducao.peso_digitado.toLocaleString('pt-BR')} kg<span>Alterar</span></button><button type="button" className="botao-secundario" onClick={() => alterar({ reducoes: dados.reducoes!.filter((_, j) => j !== i) })}>Retirar redução</button></div>)}<button type="button" className="botao-secundario" onClick={() => alterar({ reducoes: [...(dados.reducoes ?? []), { peso_digitado: Math.max(0, dados.peso_digitado * 0.75), repeticoes: dados.repeticoes }] })}>Adicionar redução sem descanso</button></div>}
    <details><summary>Esforço (opcional)</summary><label>RPE · 1 a 10<select value={dados.rpe ?? ''} onChange={e => alterar({ rpe: e.target.value === '' ? undefined : Number(e.target.value) })}><option value="">Sem RPE</option>{Array.from({ length: 19 }, (_, i) => <option key={i} value={1 + i / 2}>{1 + i / 2}</option>)}</select></label></details>
    {anterior && <button className="botao-secundario" disabled={ocupado} onClick={() => { const copia = { ...dados, peso_digitado: anterior.peso_digitado, repeticoes: anterior.repeticoes, modo_carga: anterior.modo_carga, peso_barra: anterior.peso_barra }; definir(copia); void realizar(() => salvar(copia)) }}>Copiar série anterior</button>}
    {!serie.concluida_em && <button className="botao-secundario" disabled={ocupado} onClick={() => void realizar(() => salvar(dados))}>Salvar sem concluir</button>}
    </div></div>
    {erro && <p className="erro" role="alert">{erro}</p>}
    {valoresAbertos && <SelecionarValores titulo={`Série ${serie.numero_serie}`} semPeso={semPeso} reps={dados.repeticoes} peso={dados.peso_digitado} permitirProximas={!serie.concluida_em} fechar={() => definirValoresAbertos(false)} confirmar={async (repeticoes, peso_digitado, proximas) => {
      const novos = { ...dados, repeticoes, peso_digitado }
      if (proximas) await aplicarProximas(novos); else await salvar(novos)
      definir(novos)
    }} />}
    {reducaoAtiva !== null && dados.reducoes?.[reducaoAtiva] && <SelecionarValores titulo={`Redução ${reducaoAtiva + 1}`} reps={dados.reducoes[reducaoAtiva].repeticoes} peso={dados.reducoes[reducaoAtiva].peso_digitado} fechar={() => definirReducaoAtiva(null)} confirmar={async (repeticoes, peso_digitado) => {
      const novos = { ...dados, reducoes: dados.reducoes!.map((r, i) => i === reducaoAtiva ? { peso_digitado, repeticoes } : r) }
      await salvar(novos); definir(novos)
    }} />}
    {tipoAberto && <Painel titulo="Tipo de série" fechar={() => definirTipoAberto(false)}><div className="lista-tipos">{([
      ['normal', 'Série normal', 'Conta no volume do treino.'], ['aquecimento', 'Aquecimento', 'Descanso menor e fora do volume.'], ['falha', 'Até a falha', 'Marque quando terminar até a falha.'], ['dropset', 'Drop set', 'Reduções sem descanso entre elas.'],
    ] as const).map(([tipo, nome, texto]) => <button key={tipo} className={dados.tipo === tipo ? 'selecionado' : ''} onClick={async () => {
      const novos = { ...dados, tipo }; definirOcupado(true)
      try { await salvar(novos); definir(novos); definirTipoAberto(false) } catch { definirErro('Não foi possível alterar o tipo.') } finally { definirOcupado(false) }
    }} disabled={ocupado}><span className={`tipo-serie ${tipo}`}>{tipo === 'normal' ? serie.numero_serie : tipo === 'aquecimento' ? 'A' : tipo === 'dropset' ? 'D' : 'F'}</span><span><strong>{nome}</strong><small>{texto}</small></span></button>)}<button className="remover-serie" disabled={ocupado} onClick={() => void realizar(async () => { await remover(); definirTipoAberto(false) })}>Remover série</button></div></Painel>}
  </section>
}



