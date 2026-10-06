import { useId, useState } from 'react'
import { Painel } from './Painel'
import { SelecionarDescanso } from './SelecionarDescanso'
import { Rolagem } from './Rolagem'
import { SelecionarSeries } from './SelecionarSeries'
import type { Exercicio } from '../dados/modelos'
import { repositorio } from '../dados/repositorio'
const pesosBarra = Array.from({ length: 201 }, (_, i) => i / 2)
const grupos = ['Abdômen', 'Bíceps', 'Cardio', 'Costas', 'Glúteos', 'Ombros', 'Panturrilhas', 'Peito', 'Pernas', 'Tríceps']
export function EditorExercicio({ exercicio, fechar }: { exercicio: Exercicio; fechar: () => void }) {
  const formularioId = useId()
  const [dados, definir] = useState(exercicio)
  const [erro, definirErro] = useState('')
  const [salvando, definirSalvando] = useState(false)
  const [barraAberta, definirBarraAberta] = useState(false)
  const [barra, definirBarra] = useState(dados.peso_barra)
  const campo = (nome: keyof Exercicio, valor: string | number) => definir(atual => ({ ...atual, [nome]: valor }))
  return <Painel titulo={exercicio.nome ? 'Editar exercício' : 'Novo exercício'} fechar={fechar} acao={<button type="submit" form={formularioId} className="botao-principal salvar-cabecalho" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>}><form id={formularioId} className="formulario editor-exercicio" onSubmit={async evento => {
    evento.preventDefault(); definirSalvando(true); definirErro('')
    try {
      if (!dados.nome.trim()) throw new Error('Informe o nome do exercício.')
      if (dados.video_url && !/^https?:\/\//i.test(dados.video_url)) throw new Error('O link deve começar com https:// ou http://.')
      await repositorio('exercicios').salvar({ ...dados, nome: dados.nome.trim() }); fechar()
    } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar. Confira o espaço do aparelho.') }
    finally { definirSalvando(false) }
  }}>
    <fieldset className="secao-editor"><legend>Exercício</legend>
      <label>Nome<input required value={dados.nome} onChange={e => campo('nome', e.target.value)} placeholder="Nome do exercício" /></label>
      <div><span className="rotulo-editor">Tipo</span><div className="escolhas-editor" role="group" aria-label="Tipo de exercício">{(['forca', 'cardio'] as const).map(tipo => <button type="button" key={tipo} aria-pressed={dados.tipo === tipo} onClick={() => campo('tipo', tipo)}>{tipo === 'forca' ? 'Força' : 'Cardio'}</button>)}</div></div>
      <div><span className="rotulo-editor">Grupo muscular</span><div className="filtro-musculos" role="group" aria-label="Grupo muscular">{[...new Set([...grupos, dados.grupo_muscular])].filter(Boolean).map(grupo => <button type="button" key={grupo} aria-pressed={dados.grupo_muscular === grupo} onClick={() => campo('grupo_muscular', grupo)}>{grupo}</button>)}</div><details className="grupo-personalizado"><summary>Outro grupo</summary><label>Nome do grupo<input value={dados.grupo_muscular} onChange={e => campo('grupo_muscular', e.target.value)} /></label></details></div>
      <label>Equipamento<input value={dados.equipamento} onChange={e => campo('equipamento', e.target.value)} placeholder="Ex.: polia, halteres ou máquina" /></label>
    </fieldset>
    {dados.tipo === 'forca' && <fieldset className="secao-editor"><legend>Planejamento</legend>
      <SelecionarDescanso valor={dados.descanso_padrao_segundos} confirmar={async valor => campo('descanso_padrao_segundos', valor)} />
      <div><span className="rotulo-editor">Alvo de repetições para progressão</span><SelecionarSeries valor={dados.alvo_reps ?? 12} confirmar={valor => campo('alvo_reps', valor)} rotulo="Repetições" /></div>
      <div><span className="rotulo-editor">Modo de carga</span><div className="escolhas-editor" role="group" aria-label="Modo de carga">{(['total', 'por_lado'] as const).map(modo => <button type="button" key={modo} aria-pressed={dados.modo_carga === modo} onClick={() => campo('modo_carga', modo)}>{modo === 'total' ? 'Total' : 'Por lado'}</button>)}</div></div>
      <button type="button" className="botao-descanso" onClick={() => { definirBarra(dados.peso_barra); definirBarraAberta(true) }}>Peso da barra<strong>{dados.peso_barra.toLocaleString('pt-BR')} kg</strong><span>Alterar</span></button>
      <small className="explicacao-editor">Por lado: o app soma os dois lados e o peso da barra. Em carga total, a barra já está incluída.</small>
    </fieldset>}
    <fieldset className="secao-editor"><legend>Notas e execução</legend>
      <label>Nota fixa<textarea value={dados.nota_fixa} onChange={e => campo('nota_fixa', e.target.value)} placeholder="Banco na posição 3, pegada média…" /></label>
      <label>Como fazer<textarea rows={5} value={dados.como_fazer} onChange={e => campo('como_fazer', e.target.value)} placeholder="Posição, movimento, respiração e erros comuns" /></label>
      <label>Músculos trabalhados<textarea value={dados.musculos} onChange={e => campo('musculos', e.target.value)} /></label>
      <label>Vídeo preferido<input type="url" value={dados.video_url ?? ''} onChange={e => campo('video_url', e.target.value)} placeholder="https://…" /></label>
    </fieldset>
    {erro && <p role="alert" className="erro">{erro}</p>}
  </form>
  {barraAberta && <Painel titulo="Peso da barra" fechar={() => definirBarraAberta(false)}><p className="subtitulo-seletor">Deslize para escolher o peso em quilos</p><Rolagem valores={pesosBarra} inicial={dados.peso_barra} rotulo="KG" escolher={definirBarra} formatar={valor => valor.toLocaleString('pt-BR')} /><button type="button" className="botao-principal largura-total" onClick={() => { campo('peso_barra', barra); definirBarraAberta(false) }}>Confirmar · {barra.toLocaleString('pt-BR')} kg</button></Painel>}
  </Painel>
}
