import { useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
export function EscolherOpcao({ titulo, opcoes, inicial, fechar, confirmar }: { titulo: string; opcoes: string[]; inicial: number; fechar: () => void; confirmar: (indice: number) => Promise<void> | void }) {
  const [indice, definir] = useState(inicial)
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const [valores] = useState(() => opcoes.map((_, i) => i))
  return <Painel titulo={titulo} fechar={fechar}><Rolagem valores={valores} inicial={inicial} rotulo={titulo} escolher={definir} formatar={valor => opcoes[valor]} />{erro && <p className="erro" role="alert">{erro}</p>}<button className="botao-principal largura-total" disabled={ocupado} onClick={async () => { definirOcupado(true); try { await confirmar(indice); fechar() } catch (e) { definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { definirOcupado(false) } }}>Confirmar</button></Painel>
}
