import { guiaExercicio } from '../dados/guiasExercicios'

export function GuiaExecucao({ nome }: { nome: string }) {
  const guia = guiaExercicio(nome)
  return <section className="guia-execucao" aria-label="Guia de execução">
    <h3>Como fazer</h3>
    {guia ? <>
      <div><h4>Preparação</h4><p>{guia.preparacao}</p></div>
      <ol className="passos-exercicio">{guia.passos.map(passo => <li key={passo}>{passo}</li>)}</ol>
      <div className="guia-evite"><h4>Evite</h4><ul>{guia.evite.map(erro => <li key={erro}>{erro}</li>)}</ul></div>
      <p className="nota-guia">Orientação geral · revisão profissional pendente. Respeite seu nível e mantenha o movimento controlado; se sentir dor, interrompa e procure orientação.</p>
    </> : <p>Ainda não temos um guia para esta variação. Peça orientação sobre a execução e salve suas dicas em Minhas notas.</p>}
  </section>
}
