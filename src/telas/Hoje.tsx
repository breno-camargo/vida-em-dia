import { ArrowUpRight, Dumbbell, Footprints, Utensils, Droplets, Activity } from 'lucide-react'
import type { Aba } from '../componentes/Navegacao'
export function Hoje({ abrir }: { abrir: (aba: Aba) => void }) {
  return <>
    <section className="destaque"><span className="etiqueta">SEU RITMO. SUA EVOLUÇÃO.</span>
      <h2>Um dia de cada vez.</h2><p>Seu cuidado começa aqui.<br />Vamos construir uma rotina que faz sentido para você.</p>
      <button className="botao-principal" onClick={() => abrir('Treino')}>Conhecer meu espaço <ArrowUpRight size={19} /></button>
      <Activity className="decoracao" size={120} aria-hidden="true" />
    </section>
    <div className="titulo-secao"><h2>Seu dia, em equilíbrio</h2><span>Hoje</span></div>
    <div className="grade-cartoes">
      <button className="cartao" onClick={() => abrir('Treino')}><Dumbbell className="cor-principal" /><span>Treino e cardio</span><strong>Vamos começar</strong><small>Seu próximo movimento</small></button>
      <div className="cartao"><Footprints className="amarelo" /><span>Passos</span><strong>— <small>passos</small></strong><small>Ainda sem registros</small></div>
      <button className="cartao" onClick={() => abrir('Comida')}><Utensils className="laranja" /><span>Alimentação</span><strong>— <small>kcal</small></strong><small>Seu diário em breve</small></button>
      <div className="cartao"><Droplets className="azul" /><span>Água</span><strong>— <small>ml</small></strong><small>Um hábito de cada vez</small></div>
    </div>
    <section className="nota"><span className="ponto" /><div><h3>Um espaço só seu</h3><p>Os dados ficam primeiro neste aparelho. Sincronização e backup chegam nas próximas etapas.</p></div></section>
    <button className="botao-secundario" disabled>Sincronizar · disponível na etapa 8</button>
  </>
}

