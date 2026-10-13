import { useState } from 'react'
import { ChartNoAxesCombined, ChevronDown } from 'lucide-react'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, formatarDataMedida, type CampoMedida } from '../dados/medidas'
import { EscolherOpcao } from './EscolherOpcao'
import { GraficoCarga } from './GraficoCarga'

export function ResumoMedidas({ registros }: { registros: MedidaCorporal[] }) {
  const [campoGrafico, definirCampoGrafico] = useState<CampoMedida>('peso')
  const [escolher, definirEscolher] = useState(false)
  const ultimo = (campo: CampoMedida) => registros.filter(m => m[campo] !== undefined).at(-1)
  const peso = ultimo('peso')
  const infoGrafico = camposMedidas.find(([campo]) => campo === campoGrafico)!
  return <>
    <section className="peso-resumo-medidas"><div><span>Último peso</span><strong>{peso?.peso?.toLocaleString('pt-BR') ?? '—'}{peso && <small> kg</small>}</strong></div><p>{peso ? formatarDataMedida(peso.data) : 'Ainda não informado'}</p></section>
    <section className="resumo-todas-medidas"><h2>Suas medidas</h2><p className="nota-resumo">Último valor registrado de cada medida.</p><div className="grade-resumo-medidas">{camposMedidas.filter(([campo]) => campo !== 'peso').map(([campo, nome, unidade]) => {
      const registro = ultimo(campo)
      return <div key={campo}><span>{nome}</span><strong>{registro?.[campo]?.toLocaleString('pt-BR') ?? '—'}{registro && <small> {unidade}</small>}</strong><p>{registro ? formatarDataMedida(registro.data) : 'Não informada'}</p></div>
    })}</div></section>
    <details className="grafico-medidas-recolhivel"><summary><ChartNoAxesCombined size={20} /><span>Gráfico de evolução<small>Escolha qualquer medida</small></span><ChevronDown size={18} /></summary><div className="conteudo-grafico-medidas"><button className="data-medida" onClick={() => definirEscolher(true)}><span>Medida</span><strong>{infoGrafico[1]}</strong><ChevronDown size={16} /></button><GraficoCarga dados={registros.filter(m => m[campoGrafico] !== undefined).map(m => ({ data: formatarDataMedida(m.data), carga: m[campoGrafico]!, volume: 0 }))} campo="carga" unidade={infoGrafico[2]} rotulo={infoGrafico[1]} vazio="Registre esta medida para ver o gráfico." /></div></details>
    {escolher && <EscolherOpcao titulo="Medida do gráfico" opcoes={camposMedidas.map(([,nome]) => nome)} inicial={camposMedidas.findIndex(([campo]) => campo === campoGrafico)} fechar={() => definirEscolher(false)} confirmar={indice => definirCampoGrafico(camposMedidas[indice][0])} />}
  </>
}
