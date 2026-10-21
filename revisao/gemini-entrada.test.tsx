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

test('A10 regressão: restauração mostra estado neutro antes de decidir a tela',() => {
  const inicial = renderToStaticMarkup(<App />)
  expect(inicial).not.toContain('Bom ter você aqui.')
  expect(inicial).toContain('Abrindo seu espaço…')
  expect(inicial).not.toContain('Continuar sem conta')
  expect(inicial).not.toContain('type="password"')
  conta.usuario = {id:'usuario-sintetico'}; conta.carregando = false
  const semVinculo = renderToStaticMarkup(<App />)
  // Bootstrap só monta App depois de abrir a identidade, mesmo sem conexão remota.
  expect(semVinculo).toContain('Olá, vamos cuidar de você?')
  conta.vinculado = true
  const recuperada = renderToStaticMarkup(<App />)
  expect(recuperada).toContain('Olá, vamos cuidar de você?')
  expect(recuperada).not.toContain('Abrindo sua sessão…')
  conta.usuario = null
  const semSessao = renderToStaticMarkup(<App />)
  expect(semSessao).toContain('Bom ter você aqui.')
  expect(semSessao).toContain('type="password"')
  conta.visitante = true; conta.carregando = true
  const visitante = renderToStaticMarkup(<App />)
  expect(visitante).toContain('Olá, vamos cuidar de você?')
  expect(visitante).not.toContain('Abrindo seu espaço…')
  conta.visitante = false; conta.carregando = true; conta.vinculado = false
})
