/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { expect, test } from 'vitest'
import { desenharCardAprovado, type CenarioCard } from './renderCardAprovado'

function contexto() {
  const chamadas: unknown[] = []
  const alvo: Record<string, unknown> = { font: '', fillStyle: '', globalAlpha: 1, textAlign: 'start', letterSpacing: '0px' }
  const ctx = new Proxy(alvo, { get(obj, chave: string) {
    if (chave in obj) return obj[chave]
    if (chave === 'measureText') return (valor: string) => {
      const tamanho = Number(/([\d.]+)px/.exec(String(obj.font))?.[1] ?? 12)
      return { width: valor.length * tamanho * .5, actualBoundingBoxAscent: tamanho * .75, actualBoundingBoxDescent: tamanho * .2 }
    }
    if (chave === 'createLinearGradient') return (...args: unknown[]) => {
      chamadas.push(['createLinearGradient', args])
      return { addColorStop(...stop: unknown[]) { chamadas.push(['addColorStop', stop]) } }
    }
    return (...args: unknown[]) => chamadas.push([chave, args, { ...obj }])
  } }) as unknown as CanvasRenderingContext2D
  return { ctx, chamadas }
}

test('mesmos comandos de desenho do protótipo aprovado nos quatro cenários e três modelos', () => {
  const html = readFileSync('revisao/prototipo-cards/index.html', 'utf8')
  const script = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1]
  if (!script) throw new Error('Protótipo sem script')
  const vm = createContext({ document: { getElementById: () => ({ addEventListener() {} }) }, window: {} })
  runInContext(script.replace(/^renderAll\(\);/gm, ''), vm)
  for (const nome of ['sessao-curta', 'musculacao', 'cardio', 'poucos-dados']) {
    const s = runInContext(`SCENARIOS['${nome}']`, vm) as CenarioCard
    for (const foto of [null, { naturalWidth: 1080, naturalHeight: 1920 }]) {
    for (const cor of ['clara', 'escura'] as const) {
    for (const [modelo, funcao] of [['adesivo', 'drawTipografico'], ['foto', 'drawFoto'], ['minimalista', 'drawEditorial']] as const) {
      const original = contexto(), integrado = contexto()
      vm.ctx = original.ctx; vm.s = s
      vm.imagemTeste = foto
      runInContext(`userPhotoImg = imagemTeste; textMode = '${cor === 'clara' ? 'light' : 'dark'}'`, vm)
      runInContext(`${funcao}(ctx,s,1080,1920${modelo === 'adesivo' ? ',{transparent:true,showPhoto:false,checkerboard:false}' : ''})`, vm)
      desenharCardAprovado(integrado.ctx, s, modelo, cor, foto as HTMLImageElement | null)
      expect(JSON.stringify(integrado.chamadas), `${nome}/${modelo}`).toBe(JSON.stringify(original.chamadas))
    }
    }
    }
  }
})
