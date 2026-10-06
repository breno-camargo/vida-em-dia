import { useState } from 'react'
import { Painel } from './Painel'
import type { Exercicio } from '../dados/modelos'
import { repositorio } from '../dados/repositorio'
export function EditorExercicio({ exercicio, fechar }: { exercicio: Exercicio; fechar: () => void }) {
  const [dados, definir] = useState(exercicio)
  const [erro, definirErro] = useState('')
  const [salvando, definirSalvando] = useState(false)
  const campo = (nome: keyof Exercicio, valor: string | number) => definir({ ...dados, [nome]: valor })
  return <Painel titulo="Editar exercício" fechar={fechar}><form className="formulario" onSubmit={async evento => {
    evento.preventDefault(); definirSalvando(true); definirErro('')
    try {
      if (!dados.nome.trim()) throw new Error('Informe o nome do exercício.')
      if (dados.video_url && !/^https?:\/\//i.test(dados.video_url)) throw new Error('O link deve começar com https:// ou http://.')
      await repositorio('exercicios').salvar({ ...dados, nome: dados.nome.trim() }); fechar()
    } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar. Confira o espaço do aparelho.') }
    finally { definirSalvando(false) }
  }}>
    <label>Nome<input required value={dados.nome} onChange={e => campo('nome', e.target.value)} /></label>
    <label>Tipo<select value={dados.tipo} onChange={e => campo('tipo', e.target.value)}><option value="forca">Força</option><option value="cardio">Cardio</option></select></label>
    <label>Grupo muscular<input value={dados.grupo_muscular} onChange={e => campo('grupo_muscular', e.target.value)} /></label>
    <label>Equipamento<input value={dados.equipamento} onChange={e => campo('equipamento', e.target.value)} /></label>
    <div className="dupla"><label>Descanso (s)<input type="number" inputMode="numeric" min="0" max="1800" required value={dados.descanso_padrao_segundos} onChange={e => campo('descanso_padrao_segundos', Number(e.target.value))} /></label>
      <label>Barra (kg)<input type="number" inputMode="decimal" min="0" max="100" step="0.5" required value={dados.peso_barra} onChange={e => campo('peso_barra', Number(e.target.value))} /></label></div>
    <label>Modo de carga<select value={dados.modo_carga} onChange={e => campo('modo_carga', e.target.value)}><option value="total">Total</option><option value="por_lado">Por lado</option></select></label>
    <label>Nota fixa<textarea value={dados.nota_fixa} onChange={e => campo('nota_fixa', e.target.value)} placeholder="Banco na posição 3, pegada média…" /></label>
    <label>Como fazer<textarea rows={5} value={dados.como_fazer} onChange={e => campo('como_fazer', e.target.value)} placeholder="Posição, movimento, respiração e erros comuns" /></label>
    <label>Músculos trabalhados<textarea value={dados.musculos} onChange={e => campo('musculos', e.target.value)} /></label>
    <label>Vídeo preferido<input type="url" value={dados.video_url ?? ''} onChange={e => campo('video_url', e.target.value)} placeholder="https://…" /></label>
    {erro && <p role="alert" className="erro">{erro}</p>}
    <button className="botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar exercício'}</button>
  </form></Painel>
}
