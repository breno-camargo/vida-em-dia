import { iniciarFeriados } from './dados/atividade'
import { continuarSemConta, iniciarConta, useConta } from './sincronizacao/estado'
import { supabase } from './sincronizacao/cliente'
import { ContaConfiguracoes } from './componentes/ContaConfiguracoes'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Settings, X, Utensils, Ruler, ChartNoAxesCombined, Leaf } from 'lucide-react'
import { Navegacao, type Aba } from './componentes/Navegacao'
import { EstadoVazio } from './componentes/EstadoVazio'
import { AvisosPwa } from './componentes/AvisosPwa'
import { Hoje } from './telas/Hoje'
import { Configuracoes } from './telas/Configuracoes'
import { useAmbiente } from './hooks/useAmbiente'
import { iniciarBanco } from './dados/configuracoes'
import { iniciarBiblioteca } from './dados/biblioteca'
import { Treino } from './telas/Treino'
const Medidas = lazy(() => import('./telas/Medidas'))
const Evolucao = lazy(() => import('./telas/Evolucao'))

const proximas = {
  Comida: { icone: Utensils, titulo: 'Mais simples, mais constante', texto: 'Um diário rápido para acompanhar suas refeições, sem complicar a rotina.', etapa: 9 },
  Medidas: { icone: Ruler, titulo: 'Cada mudança conta', texto: 'Acompanhe peso e medidas e descubra sua evolução ao longo do tempo.', etapa: 5 },
  Evolução: { icone: ChartNoAxesCombined, titulo: 'Veja o caminho que percorreu', texto: 'Seus primeiros gráficos de treino estarão aqui. Cada registro conta uma parte da sua história.', etapa: 4 },
}
export default function App() {
  const [aba, definirAba] = useState<Aba>('Hoje')
  const [menu, definirMenu] = useState(false)
  const [registrarMedida, definirRegistrarMedida] = useState(false)
  const [entradaTreino, definirEntradaTreino] = useState(0)
  const [erro, definirErro] = useState('')
  const ambiente = useAmbiente()
  const conta = useConta()
  const entrada = !!supabase && !conta.visitante && (!conta.usuario || conta.recuperando)
  useEffect(() => { void iniciarBanco().then(iniciarBiblioteca).then(() => iniciarFeriados()).then(iniciarConta).catch(() => definirErro('Não foi possível abrir o armazenamento local. Reabra o app e confira o espaço disponível no aparelho.')) }, [])
  const selecionar = (nova: Aba) => { definirRegistrarMedida(false); if (nova === 'Treino') definirEntradaTreino(v => v + 1); definirAba(nova); definirMenu(false); window.scrollTo({ top: 0 }) }
  if (entrada) return <div className="app entrada-conta">
    <header className="marca-entrada"><span><Leaf size={25} strokeWidth={1.7} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></header>
    <main id="conteudo" className="conteudo-entrada">
      <div className="apresentacao-entrada"><h1>{conta.recuperando ? 'Vamos recuperar seu acesso.' : 'Bom ter você aqui.'}</h1><p>{conta.recuperando ? 'Receba um código e crie uma nova senha.' : 'Seu treino, sua rotina e sua evolução, juntos.'}</p></div>
      {erro && <p role="alert" className="erro">{erro}</p>}
      <ContaConfiguracoes entrada />
      <div className="alternativa-entrada"><span>ou</span><button className="link-conta" onClick={continuarSemConta}>Continuar sem conta</button><p>Você pode entrar depois. Seus registros ficam neste aparelho.</p></div>
    </main>
    <AvisosPwa />
  </div>
  return <div className={`app ${ambiente.instalado ? 'instalado' : 'nao-instalado'}`}>
    <header className="cabecalho"><div className="marca"><span><Leaf size={22} /></span><div>Vida em Dia<small>UM ESPAÇO PARA VOCÊ</small></div></div>
      <button className="botao-icone" aria-label={menu ? 'Fechar configurações' : 'Abrir configurações'} aria-expanded={menu} onClick={() => definirMenu(!menu)}>{menu ? <X /> : <Settings size={22} />}</button>
    </header>
    <main id="conteudo"><div className="linha-data"><span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="estado-rede"><i className={ambiente.online ? 'online' : ''} />{ambiente.online ? 'Online' : 'Offline'}</span></div>
      <h1>{menu ? 'Configurações' : aba === 'Hoje' ? 'Olá, vamos cuidar de você?' : aba}</h1>
      {erro && <div role="alert" className="erro">{erro}</div>}
      {menu ? <Configuracoes {...ambiente} /> : aba === 'Hoje' ? <Hoje abrirBackup={() => definirMenu(true)} abrir={selecionar} registrarMedida={() => { selecionar('Medidas'); definirRegistrarMedida(true) }} /> : aba === 'Treino' ? <Treino key={entradaTreino} online={ambiente.online} /> : aba === 'Evolução' ? <Suspense fallback={<p role="status">Carregando evolução…</p>}><Evolucao /></Suspense> : aba === 'Medidas' ? <Suspense fallback={<p role="status">Carregando medidas…</p>}><Medidas registrarInicial={registrarMedida} /></Suspense> : <EstadoVazio {...proximas[aba]} />}
    </main>
    <AvisosPwa /><Navegacao atual={aba} selecionar={selecionar} />
  </div>
}






