import { AguaHoje } from '../componentes/AguaHoje'
import { LembreteBackup } from '../componentes/LembreteBackup'
import { BotaoSincronizar } from '../componentes/ContaConfiguracoes'
import { AtividadeHoje } from '../componentes/AtividadeHoje'
import { LembreteMedidas } from '../componentes/LembreteMedidas'
import { ArrowUpRight, Dumbbell, Utensils, Activity } from 'lucide-react'
import type { Aba } from '../componentes/Navegacao'
export function Hoje({ abrir, registrarMedida, abrirBackup, abrirConta, configurarAgua }: { configurarAgua: () => void; abrirConta: () => void; abrirBackup: () => void; abrir: (aba: Aba) => void; registrarMedida: () => void }) {
  return <><LembreteBackup abrir={abrirBackup} /><LembreteMedidas abrir={registrarMedida} />
    <section className="destaque"><span className="etiqueta">SEU RITMO. SUA EVOLUÇÃO.</span>
      <h2>Um dia de cada vez.</h2><p>Seu cuidado começa aqui.<br />Vamos construir uma rotina que faz sentido para você.</p>
      <button className="botao-principal" onClick={() => abrir('Treino')}>Conhecer meu espaço <ArrowUpRight size={19} /></button>
      <Activity className="decoracao" size={120} aria-hidden="true" />
    </section>
    <div className="titulo-secao"><h2>Seu dia, em equilíbrio</h2><span>Hoje</span></div>
    <div className="grade-cartoes grade-equilibrio">
      <button className="cartao" onClick={() => abrir('Treino')}><Dumbbell className="verde" /><span>Treino e cardio</span><strong className="convite-treino">Vamos começar</strong><small>Seu próximo movimento</small></button>
      <button className="cartao" onClick={() => abrir('Comida')}><Utensils className="laranja" /><span>Alimentação</span><strong>— <small>kcal</small></strong><small>Seu diário em breve</small></button>
      <AguaHoje configurar={configurarAgua} />
    </div>
    <AtividadeHoje />
    <section className="nota"><span className="ponto" /><div><h3>Um espaço só seu</h3><p>Os dados ficam primeiro neste aparelho. Conecte sua conta para sincronizar e guarde também um backup com fotos.</p></div></section>
    <BotaoSincronizar abrirConta={abrirConta} />
  </>
}




