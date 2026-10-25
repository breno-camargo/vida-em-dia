import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Rolagem } from './Rolagem'

test('carga alta mantém valor e tamanho acessível da lista sem montar os 2001 itens', () => {
  const html = renderToStaticMarkup(<Rolagem valores={Array.from({ length: 2001 }, (_, i) => i)} inicial={1500} rotulo="KG" escolher={() => {}} />)
  expect(html.match(/role="option"/g)).toHaveLength(61)
  expect(html).toContain('aria-setsize="2001"')
  expect(html).toContain('aria-selected="true" aria-posinset="1501"')
  expect(html).toContain('>1500</button>')
  expect(html).toContain('height:70560px')
  expect(html).toContain('height:22560px')
})

test('lista curta preserva todas as opções e a formatação', () => {
  const html = renderToStaticMarkup(<Rolagem valores={[0, 0.25, 0.5, 0.75]} inicial={0.5} rotulo="DECIMAIS" escolher={() => {}} formatar={n => n.toFixed(2)} />)
  expect(html.match(/role="option"/g)).toHaveLength(4)
  expect(html).toContain('>0.50</button>')
  expect(html).toContain('aria-selected="true" aria-posinset="3"')
})
