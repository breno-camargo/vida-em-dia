import type { TipoCardio } from './tiposCardio'
export interface Registro {
  eliminado_em?: string
  id: string
  user_id: string | null
  criado_em: string
  atualizado_em: string
  apagado_em: string | null
}
export type TipoDia = 'util' | 'fds_feriado'
export interface Exercicio extends Registro {
  nome: string; tipo: 'forca' | 'cardio'; grupo_muscular: string; equipamento: string
  descanso_padrao_segundos: number; modo_carga: 'total' | 'por_lado' | 'peso_corporal'; peso_barra: number
  nota_fixa: string; como_fazer: string; musculos: string; video_url?: string
  origem: 'manual' | 'banco_aberto'; referencia_externa?: string
  alvo_reps?: number
}
export interface Ficha extends Registro { nome: string; ordem: number }
export interface FichaExercicio extends Registro {
  ficha_id: string; exercicio_id: string; ordem: number; series_planejadas: number; descanso_segundos?: number
}
export interface Treino extends Registro {
  ficha_id?: string; data: string; inicio: string; fim?: string
  duracao_minutos?: number; calorias?: number; observacao: string
  titulo?: string; descanso_fim?: string | null; peso_corporal?: number
}
export interface TreinoExercicio extends Registro {
  treino_id: string; exercicio_id: string; nome: string; ordem: number; descanso_segundos: number; tipo?: 'forca' | 'cardio'; origem_ficha?: boolean; retirado_da_ficha?: boolean
}
export interface SerieTreino extends Registro {
  treino_id: string; exercicio_id: string; numero_serie: number
  tipo: 'aquecimento' | 'normal' | 'falha' | 'dropset'
  peso_digitado: number; peso_total: number; repeticoes: number; rpe?: number
  concluida_em?: string; recorde: boolean
  modo_carga?: 'total' | 'por_lado' | 'peso_corporal'; peso_barra?: number
  reducoes?: { peso_digitado: number; repeticoes: number }[]
}
export interface CardioSessao extends Registro {
  cadencia_rpm?: number; potencia_watts?: number; comprimentos_piscina?: number; piscina_metros?: number
  treino_id?: string; exercicio_id?: string; data: string
  tipo: TipoCardio
  duracao_minutos: number; distancia_km?: number; velocidade_media_kmh?: number
  inclinacao_pct?: number; passos?: number; calorias_informadas?: number
  calorias_estimadas?: number; fc_media?: number; fc_max?: number; observacao: string
}
export interface MedidaCorporal extends Registro {
  data: string; peso?: number; biceps_d?: number; biceps_e?: number; cintura?: number
  busto?: number; abdomen?: number; quadril?: number; coxa_d?: number; coxa_e?: number
  panturrilha_d?: number; panturrilha_e?: number
}
export interface AtividadeDiaria extends Registro {
  data: string; passos: number; calorias_gastas: number; tipo_dia: TipoDia
  meta_passos_aplicada: number; meta_calorias_gastas_aplicada: number
}
export interface Feriado extends Registro { data: string; nome: string }
export interface Nutrientes { kcal: number; proteina_g?: number; carbo_g?: number; gordura_g?: number; fibra_g?: number; sodio_mg?: number; acucares_g?: number }
export interface RefeicaoDia extends Registro, Nutrientes {
  data: string; refeicao: string; horario: string; descricao: string
  precisao: 'estimado' | 'exato'; foto_id?: string; alimento_id?: string
  alimento_nome?: string; quantidade_g?: number
}
export interface AlimentoFavorito extends Registro, Nutrientes {
  tipo_alimento?: string
  nome: string; marca?: string; porcao: string; vezes_usado: number; base_quantidade_g?: number; fonte?: 'pessoal'
}
export interface ComboRefeicao extends Registro { nome: string; itens: (Nutrientes & { descricao: string })[] }
export interface AguaDia extends Registro { data: string; ml: number; garrafas_ml?: number[] }
export interface ConsumoDiarioMeta extends Registro {
  origem_meta?: 'manual' | 'manutencao' | 'nenhuma'
  data: string; tipo_dia: TipoDia; meta_kcal_aplicada: number; meta_proteina_aplicada?: number
}
export interface Foto extends Registro {
  tipo: 'maquina' | 'refeicao' | 'progresso'; data: string
  angulo: 'frente' | 'lado' | 'costas' | null; caminho_storage?: string
  imagem_local?: Blob; miniatura_local?: Blob; tamanho_bytes: number; medida_id?: string; exercicio_id?: string
}
export interface Configuracao extends Registro {
  garrafa_atualizada_em?: string
  meta_agua_atualizada_em?: string
  chave: 'principal'; tema: 'escuro' | 'claro'; unidade: 'kg'; altura_cm?: number; meta_peso?: number
  meta_passos_util: number; meta_passos_fds_feriado: number
  meta_calorias_gastas_util: number; meta_calorias_gastas_fds_feriado: number
  meta_kcal_util: number; meta_kcal_fds_feriado: number; meta_proteina?: number
  garrafa_ml?: number; meta_agua_ml: number; meta_treinos_semana: number; meta_cardio_min_semana?: number
  fator_calorias_cardio: number; modo_calorias_gastas: 'soma' | 'total_manual'
  prompt_ia_modelo: string; dia_lembrete_medidas: number; dias_lembrete_backup: number
  ultimo_backup?: string; ultima_sincronizacao?: string; sync_automatico: boolean
  metas_calorias_separadas?: boolean
  descanso_por_data?: Record<string, boolean>
  anos_feriados_inicializados?: number[]
  biblioteca_inicializada?: boolean
  alimentos_comuns_ocultos?: string[]
  data_nascimento?: string
  nivel_atividade_energia_definido?: boolean
  sexo_calculo_energia?: 'masculino' | 'feminino'
  nivel_atividade_energia?: 'sedentaria' | 'leve' | 'moderada' | 'intensa'
}
export interface Tabelas {
  exercicios: Exercicio; fichas: Ficha; ficha_exercicios: FichaExercicio
  treinos: Treino; series_treino: SerieTreino; cardio_sessoes: CardioSessao
  treino_exercicios: TreinoExercicio
  medidas_corporais: MedidaCorporal; atividade_diaria: AtividadeDiaria; feriados: Feriado
  refeicoes_dia: RefeicaoDia; alimentos_favoritos: AlimentoFavorito; combos_refeicao: ComboRefeicao
  agua_dia: AguaDia; consumo_diario_meta: ConsumoDiarioMeta; fotos: Foto; configuracoes: Configuracao
}






