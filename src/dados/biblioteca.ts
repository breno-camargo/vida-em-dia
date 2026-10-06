import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'

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

export async function iniciarBiblioteca() {
  await banco.transaction('rw', tabela('exercicios'), tabela('configuracoes'), async () => {
    const config = await tabela('configuracoes').where('chave').equals('principal').first()
    if (!config || config.biblioteca_inicializada) return
    for (const [grupo, nomes] of Object.entries(grupos)) {
      for (const nome of nomes) {
        await tabela('exercicios').add({ ...criarRegistro(config.user_id), nome,
          tipo: grupo === 'Cardio' ? 'cardio' : 'forca', grupo_muscular: grupo,
          equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total', peso_barra: 20,
          nota_fixa: '', como_fazer: '', musculos: grupo, origem: 'manual',
        })
      }
    }
    await tabela('configuracoes').put({ ...config, biblioteca_inicializada: true, atualizado_em: new Date().toISOString() })
  })
}
