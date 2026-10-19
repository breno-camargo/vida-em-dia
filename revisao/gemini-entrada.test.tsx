// Renderização estática: verifica a tela escolhida, sem alegar medir flash no Safari.
import { expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const conta = vi.hoisted(() => ({ usuario:null as null | {id:string}, carregando:true, visitante:false, recuperando:false, vinculado:false, ocupado:false, mensagem:'', erro:'', pendentes:0 }))
vi.mock('../src/sincronizacao/cliente',() => ({supabase:{}}))
vi.mock('../src/sincronizacao/estado',() => ({
  useConta:() => conta, iniciarConta:vi.fn(), continuarSemConta:vi.fn(),
  confirmarVinculo:vi.fn(), definirRecuperacao:vi.fn(), sairConta:vi.fn(), sincronizar:vi.fn(),
}))
vi.mock('../src/hooks/useAmbiente',() => ({useAmbiente:() => ({online:true,instalado:true,persistente:null})}))
vi.mock('../src/componentes/AvisosPwa',() => ({AvisosPwa:() => null}))
vi.mock('../src/telas/Hoje',() => ({Hoje:() => null}))
vi.mock('../src/telas/Treino',() => ({Treino:() => null}))
import App from '../src/App'

test('GEM-08: abertura monta apresentação de entrada durante carga, sem mostrar formulário de senha',() => {
  const inicial = renderToStaticMarkup(<App />)
  expect(inicial).toContain('Bom ter você aqui.')
  expect(inicial).toContain('Abrindo sua sessão…')
  expect(inicial).not.toContain('type="password"')
  conta.usuario = {id:'usuario-sintetico'}; conta.carregando = false
  const recuperada = renderToStaticMarkup(<App />)
  expect(recuperada).toContain('Olá, vamos cuidar de você?')
  expect(recuperada).not.toContain('Abrindo sua sessão…')
})
