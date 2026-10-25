import { useMemo, useState } from 'react'
import type { Exercicio } from '../dados/modelos'
import { exerciciosUnicos } from '../dados/duplicatasExercicios'

export const normalizarExercicio = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
export function buscarExercicios(exercicios: Exercicio[], busca: string) {
  const termos = normalizarExercicio(busca).split(/\s+/).filter(Boolean)
  return exercicios.filter(ex => termos.every(t => normalizarExercicio(`${ex.nome} ${ex.grupo_muscular} ${ex.equipamento}`).includes(t)))
}
export function useFiltroExercicios(exercicios: Exercicio[], busca: string) {
  const unicos = useMemo(() => exerciciosUnicos(exercicios), [exercicios])
  const [tipo, definirTipo] = useState<'todos' | 'musculo' | 'cardio'>('todos')
  const [grupo, definirGrupo] = useState('')
  const chave = `${tipo}:${grupo}:${busca}`
  const [pagina, definirPagina] = useState({ chave: '', limite: 40 })
  const limite = pagina.chave === chave ? pagina.limite : 40
  const grupos = useMemo(() => [...new Set(unicos.filter(e => e.tipo !== 'cardio').map(e => e.grupo_muscular || 'Outros'))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [unicos])
  const filtrados = useMemo(() => buscarExercicios(unicos, busca).filter(e => tipo === 'cardio' ? e.tipo === 'cardio' : tipo === 'musculo' ? e.tipo !== 'cardio' && (!grupo || (e.grupo_muscular || 'Outros') === grupo) : true).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [unicos, busca, tipo, grupo])
  const filtros = <div className="filtros-catalogo"><div className="abas-catalogo" aria-label="Filtrar exercícios">{([['todos', 'Todos'], ['musculo', 'Por músculo'], ['cardio', 'Cardio']] as const).map(([valor, texto]) => <button type="button" key={valor} aria-pressed={tipo === valor} onClick={() => definirTipo(valor)}>{texto}</button>)}</div>{tipo === 'musculo' && <div className="musculos-catalogo" aria-label="Grupos musculares"><button type="button" aria-pressed={!grupo} onClick={() => definirGrupo('')}>Todos os grupos</button>{grupos.map(g => <button type="button" key={g} aria-pressed={grupo === g} onClick={() => definirGrupo(g)}>{g}</button>)}</div>}</div>
  const mais = filtrados.length > limite ? <div className="mais-exercicios"><p className="nota-resumo">Exibindo {limite} de {filtrados.length} exercícios. Os demais estão nas próximas páginas.</p><button type="button" className="botao-secundario mais-catalogo" onClick={() => definirPagina({ chave, limite: limite + 40 })}>Carregar mais {Math.min(40, filtrados.length - limite)} exercícios</button><button type="button" className="botao-secundario" onClick={() => definirPagina({ chave, limite: filtrados.length })}>Exibir todos os {filtrados.length} exercícios</button></div> : null
  return { filtrados, visiveis: filtrados.slice(0, limite), filtros, mais }
}
