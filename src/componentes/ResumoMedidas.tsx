import { useState } from 'react'
import { ChartNoAxesCombined, ChevronDown } from 'lucide-react'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, formatarValorMedida, paresMedidas, formatarDataMedida, type CampoMedida } from '../dados/medidas'
import { EscolherOpcao } from './EscolherOpcao'
import { GraficoCarga } from './GraficoCarga'

export type VisaoMedidas = 'resumo' | 'evolucao' | 'historico'
export function ResumoMedidas({ registros, visao, navegar }: { registros: MedidaCorporal[]; visao: VisaoMedidas; navegar: (visao: VisaoMedidas) => void }) {
  const [campoGrafico, definirCampoGrafico] = useState<CampoMedida>('peso')
  const [escolher, definirEscolher] = useState(false)
  const ultimo = (campo: CampoMedida) => registros.filter(m => m[campo] !== undefined).at(-1)
  const peso = ultimo('peso')
  const infoGrafico = camposMedidas.find(([campo]) => campo === campoGrafico)!
  return <>
    <section className="peso-resumo-medidas"><div><span>Último peso</span><strong>{peso?.peso === undefined ? '—' : formatarValorMedida('peso', peso.peso)}{peso && <small> kg</small>}</strong></div><p>{peso ? formatarDataMedida(peso.data) : 'Ainda não informado'}</p></section>
    <div className="abas-medidas" aria-label="Visualização das medidas">{([['resumo', 'Resumo'], ['evolucao', 'Evolução'], ['historico', 'Histórico']] as const).map(([valor, nome]) => <button type="button" key={valor} aria-pressed={visao === valor} onClick={() => navegar(valor)}>{nome}</button>)}</div>
    {visao === 'resumo' && <section className="resumo-todas-medidas"><h2>Suas medidas</h2><p className="nota-resumo">Último valor informado, com a data de cada registro.</p><div className="grade-resumo-medidas">{camposMedidas.filter(([campo]) => ['busto', 'cintura', 'abdomen', 'quadril'].includes(campo)).map(([campo, nome, unidade]) => {
      const registro = ultimo(campo)
      return <div key={campo}><span>{nome}</span><strong>{registro?.[campo] === undefined ? '—' : formatarValorMedida(campo, registro[campo]!)}{registro && <small> {unidade}</small>}</strong><p>{registro ? formatarDataMedida(registro.data) : 'Não informada'}</p></div>
    })}</div><div className="pares-resumo-medidas">{paresMedidas.map(([nome, direito, esquerdo]) => {
      const d = ultimo(direito), e = ultimo(esquerdo)
      const mesmaData = d && e && d.data === e.data
      return <section className="par-resumo-medida" key={nome}><header><h3>{nome}</h3>{mesmaData && <span>{formatarDataMedida(d.data)}</span>}</header><dl>{([[direito, 'Direito', d], [esquerdo, 'Esquerdo', e]] as const).map(([campo, lado, registro]) => <div key={campo}><dt>{lado}</dt><dd>{registro?.[campo] === undefined ? '—' : formatarValorMedida(campo, registro[campo]!)}{registro && <small> cm</small>}</dd>{!mesmaData && <p>{registro ? formatarDataMedida(registro.data) : 'Não informada'}</p>}</div>)}</dl></section>
    })}</div></section>}
    {visao === 'evolucao' && <section className="evolucao-medidas"><header><ChartNoAxesCombined size={20} aria-hidden="true" /><div><h2>Evolução das medidas</h2><p>Escolha o que você quer acompanhar.</p></div></header><button type="button" className="data-medida" onClick={() => definirEscolher(true)}><span>Medida</span><strong>{infoGrafico[1]}</strong><ChevronDown size={16} aria-hidden="true" /></button><GraficoCarga dados={registros.filter(m => m[campoGrafico] !== undefined).map(m => ({ data: formatarDataMedida(m.data), carga: m[campoGrafico]!, volume: 0 }))} campo="carga" formatar={v => formatarValorMedida(campoGrafico, v)} unidade={infoGrafico[2]} rotulo={infoGrafico[1]} vazio="Registre esta medida para ver o gráfico." /></section>}
    {escolher && <EscolherOpcao titulo="Medida do gráfico" opcoes={camposMedidas.map(([,nome]) => nome)} inicial={camposMedidas.findIndex(([campo]) => campo === campoGrafico)} fechar={() => definirEscolher(false)} confirmar={indice => definirCampoGrafico(camposMedidas[indice][0])} />}
  </>
}
