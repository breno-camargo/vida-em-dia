import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SelecionarNumero } from './SelecionarNumero'

describe('SelecionarNumero (renderização e regressão)', () => {
  test('consumidor antigo sem props novas preserva o comportamento e visual anterior', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Passos do dia"
        unidade="passos"
        valor={5000}
        maximo={200000}
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    // Subtítulo clássico preservado
    expect(html).toContain('Deslize e confirme para aplicar.')
    // Não renderiza alternador de digitação nem atalhos
    expect(html).not.toContain('alternador-seletor')
    expect(html).not.toContain('atalhos-numero')
    expect(html).not.toContain('campo-digitar-numero')
    // Exibe valor existente formatado
    expect(html).toContain('5.000 passos')
    // Não renderiza "Não informar" pois opcional é false por padrão
    expect(html).not.toContain('Não informar')
  })

  test('seletor de cardio com permitirDigitar renderiza abas Rolar/Digitar e botões de atalho', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Frequência média"
        unidade="bpm"
        valor={undefined}
        maximo={250}
        passoRapido={10}
        minimo={1}
        permitirDigitar
        opcional
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    // Não renderiza o subtítulo estático
    expect(html).not.toContain('Deslize e confirme para aplicar.')
    // Renderiza alternador com abas e papéis de acessibilidade
    expect(html).toContain('alternador-seletor')
    expect(html).toContain('role="tab"')
    expect(html).toContain('Rolar')
    expect(html).toContain('Digitar')
    // Renderiza atalhos rápidos com o incremento de 10 bpm
    expect(html).toContain('-10 bpm')
    expect(html).toContain('+10 bpm')
    // Renderiza botão "Não informar" pois é opcional
    expect(html).toContain('Não informar')
  })

  test('valor existente é renderizado exatamente onde foi salvo', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Frequência média"
        unidade="bpm"
        valor={135}
        maximo={250}
        passoRapido={10}
        minimo={1}
        permitirDigitar
        opcional
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    expect(html).toContain('135 bpm')
  })

  test('campos decimais renderizam com vírgula e atalhos correspondentes', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Distância"
        unidade="km"
        valor={12.5}
        maximo={1000}
        passoRapido={1}
        minimo={0}
        decimal
        permitirDigitar
        opcional
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    expect(html).toContain('12,5 km')
    expect(html).toContain('-1 km')
    expect(html).toContain('+1 km')
  })

  test('campo obrigatório (ex.: duração) não renderiza botão Não informar', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Duração"
        unidade="min"
        valor={30}
        maximo={1440}
        passoRapido={5}
        minimo={0.1}
        decimal
        permitirDigitar
        opcional={false}
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    expect(html).toContain('30 min')
    expect(html).toContain('-5 min')
    expect(html).toContain('+5 min')
    expect(html).not.toContain('Não informar')
  })

  test('todos os botões possuem type="button" para evitar submit involuntário do formulário pai', () => {
    const html = renderToStaticMarkup(
      <SelecionarNumero
        titulo="Frequência média"
        unidade="bpm"
        valor={120}
        maximo={250}
        passoRapido={10}
        minimo={1}
        permitirDigitar
        opcional
        fechar={() => {}}
        confirmar={() => {}}
      />
    )
    // Encontra todas as tags <button no HTML
    const botoes = html.match(/<button[^>]*>/g) ?? []
    expect(botoes.length).toBeGreaterThan(0)
    for (const b of botoes) {
      expect(b).toContain('type="button"')
    }
  })

})
