import { exerciciosPesoCorporal } from './pesoCorporal'
import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import { aliasesCatalogo, catalogoAmpliado } from './catalogoAmpliado'

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
const aliases = new Map(Object.entries(aliasesCatalogo).map(([a, b]) => [normalizar(a), normalizar(b)]))
const chaveNome = (nome: string) => aliases.get(normalizar(nome)) ?? normalizar(nome)

async function idCatalogo(nome: string) {
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`vida-em-dia:catalogo:1:${chaveNome(nome)}`))
 const bytes = new Uint8Array(digest).slice(0, 16)
 bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128
 const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
 return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function ampliarBiblioteca() {
  // IDs estáveis entre aparelhos evitam duplicações na sincronização do catálogo.
  const catalogo = await Promise.all(Object.entries(catalogoAmpliado).flatMap(([grupo, texto]) => texto.split('|').map(async nome => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`vida-em-dia:catalogo:1:${chaveNome(nome)}`))
    const bytes = new Uint8Array(digest).slice(0, 16)
    bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    return { nome, grupo, id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` }
  })))
  return banco.transaction('rw', tabela('exercicios'), tabela('configuracoes'), async () => {
    const config = await tabela('configuracoes').where('chave').equals('principal').first()
    if (!config) throw new Error('Aguarde a inicialização do app.')
    const existentes = await tabela('exercicios').toArray()
    const nomes = new Set(existentes.map(e => chaveNome(e.nome)))
    const ids = new Set(existentes.map(e => e.id))
    let adicionados = 0
    for (const { nome, grupo, id } of catalogo) {
      if (nomes.has(chaveNome(nome)) || ids.has(id)) continue
      const equipamento = /halter/i.test(nome) ? 'Halteres' : /kettlebell/i.test(nome) ? 'Kettlebell' : /smith/i.test(nome) ? 'Smith' : /polia|cabo|pull-through/i.test(nome) ? 'Polia' : /elástico|mini band/i.test(nome) ? 'Elástico' : /barra|clean|arranco|snatch/i.test(nome) ? 'Barra' : /máquina|graviton|leg press|hack/i.test(nome) ? 'Máquina' : ''
      const corporal = grupo === 'Mobilidade' ? !equipamento : !equipamento && /^(Abdominal|Prancha|Flexão de braços|Barra fixa|Superman|Perdigueiro|Montanhista|Escalador|Mergulho|Paralelas|Muscle-up|Agachamento com peso corporal|Recuo|Avanço$|Cadeira chinesa|Burpee|Salto|Polichinelo|Skipping|Calcanhar)/i.test(nome)
      await tabela('exercicios').add({ ...criarRegistro(config.user_id), id, nome, tipo: grupo === 'Cardio' ? 'cardio' : 'forca', grupo_muscular: grupo, equipamento,
        descanso_padrao_segundos: 90, modo_carga: corporal ? 'peso_corporal' : 'total', peso_barra: 0,
        nota_fixa: '', como_fazer: '', musculos: grupo, origem: 'manual' })
      nomes.add(chaveNome(nome)); ids.add(id); adicionados++
    }
    return adicionados
  })
}

const grupos: Record<string, string[]> = {
  Peito: ['Supino reto com barra', 'Supino inclinado com halteres', 'Supino reto com halteres', 'Supino na máquina', 'Crucifixo com halteres', 'Crucifixo na máquina', 'Crossover na polia', 'Flexão de braços'],
  Costas: ['Puxada frontal', 'Puxada neutra', 'Remada curvada', 'Remada baixa', 'Remada unilateral com halter', 'Remada na máquina', 'Barra fixa', 'Pullover na polia'],
  Ombros: ['Desenvolvimento com halteres', 'Desenvolvimento com barra', 'Desenvolvimento na máquina', 'Elevação lateral', 'Elevação frontal', 'Crucifixo inverso', 'Face pull', 'Encolhimento com halteres'],
  Bíceps: ['Rosca direta com barra', 'Rosca alternada', 'Rosca martelo', 'Rosca Scott', 'Rosca concentrada', 'Rosca na polia', 'Rosca inclinada', 'Rosca inversa'],
  Tríceps: ['Tríceps na polia com corda', 'Tríceps na polia com barra', 'Tríceps francês', 'Tríceps testa', 'Tríceps coice', 'Mergulho na máquina', 'Supino fechado', 'Extensão unilateral na polia'],
  Pernas: ['Agachamento livre', 'Agachamento no Smith', 'Leg press', 'Cadeira extensora', 'Mesa flexora', 'Cadeira flexora', 'Stiff', 'Levantamento terra'],
  Glúteos: ['Elevação pélvica', 'Passada com halteres', 'Agachamento búlgaro', 'Cadeira abdutora', 'Cadeira adutora', 'Glúteo na polia'],
  Panturrilhas: ['Panturrilha em pé', 'Panturrilha sentado'],
  Abdômen: ['Abdominal no solo', 'Abdominal na máquina', 'Elevação de pernas', 'Prancha abdominal'],
  Cardio: ['Esteira', 'Bicicleta ergométrica', 'Elíptico', 'Escada'],
}
export const nomesBibliotecaInicial = Object.values(grupos).flat()

export async function iniciarBiblioteca() {
  // Calcular antes da transação evita que o IndexedDB a encerre durante o hash.
  const ids = new Map(await Promise.all(nomesBibliotecaInicial.map(async nome => [nome, await idCatalogo(nome)] as const)))
  await banco.transaction('rw', tabela('exercicios'), tabela('configuracoes'), async () => {
    const config = await tabela('configuracoes').where('chave').equals('principal').first()
    if (!config || config.biblioteca_inicializada) return
    for (const [grupo, nomes] of Object.entries(grupos)) {
      for (const nome of nomes) {
        const id = ids.get(nome)!
        // Preservar cadastros existentes, inclusive renomeados ou removidos.
        if (await tabela('exercicios').get(id) || await tabela('exercicios').where('nome').equals(nome).count()) continue
        await tabela('exercicios').add({ ...criarRegistro(config.user_id), id, nome,
          tipo: grupo === 'Cardio' ? 'cardio' : 'forca', grupo_muscular: grupo,
          equipamento: '', descanso_padrao_segundos: 90, modo_carga: exerciciosPesoCorporal.has(nome) ? 'peso_corporal' : 'total', peso_barra: exerciciosPesoCorporal.has(nome) ? 0 : 20,
          nota_fixa: '', como_fazer: '', musculos: grupo, origem: 'manual',
        })
      }
    }
    await tabela('configuracoes').put({ ...config, biblioteca_inicializada: true, atualizado_em: new Date().toISOString() })
  })
}

