import type { LinhaBackup } from './backup'

export function validarDominioBackup(nome: string, r: LinhaBackup) {
  const falhar = (campo: string): never => { throw new Error(`Valor inválido em ${nome}.${campo}.`) }
  const numero = (campo: string, min: number, max = Number.MAX_SAFE_INTEGER, inteiro = false) => {
    const v = r[campo]
    if (v !== undefined && (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (inteiro && !Number.isSafeInteger(v)))) falhar(campo)
  }
  // Campos numéricos do modelo não admitem negativos; regras específicas abaixo.
  for (const [campo, valor] of Object.entries(r)) if (typeof valor === 'number' && (!Number.isFinite(valor) || valor < 0)) falhar(campo)
  for (const campo of ['ordem', 'vezes_usado', 'tamanho_bytes', 'ml', 'passos', 'meta_passos_aplicada', 'meta_passos_util', 'meta_passos_fds_feriado', 'meta_treinos_semana', 'dia_lembrete_medidas', 'dias_lembrete_backup']) numero(campo, 0, Number.MAX_SAFE_INTEGER, true)
  numero('numero_serie', 1, Number.MAX_SAFE_INTEGER, true)
  numero('series_planejadas', 1, 20, true)
  numero('repeticoes', 1, 1000, true)
  numero('alvo_reps', 1, 1000, true)
  numero('peso_digitado', 0, 2000)
  numero('peso_total', 0, 4100) // por lado: 2000 × 2 + barra de até 100
  numero('peso_barra', 0, 100)
  numero('rpe', 1, 10)
  numero('descanso_padrao_segundos', 0, 1800)
  numero('descanso_segundos', 0, 1800)
  for (const campo of ['peso', 'peso_corporal']) numero(campo, Number.MIN_VALUE, 400)
  for (const campo of ['busto', 'cintura', 'abdomen', 'quadril', 'biceps_d', 'biceps_e', 'coxa_d', 'coxa_e', 'panturrilha_d', 'panturrilha_e']) numero(campo, Number.MIN_VALUE, 300)
  numero('garrafa_ml', 50, 5000, true)
  if (nome === 'configuracoes') {
    if (r.data_nascimento !== undefined && (typeof r.data_nascimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.data_nascimento) || new Date(`${r.data_nascimento}T12:00:00`).toLocaleDateString('sv-SE') !== r.data_nascimento)) falhar('data_nascimento')
    if (r.sexo_calculo_energia !== undefined && (typeof r.sexo_calculo_energia !== 'string' || !['masculino', 'feminino'].includes(r.sexo_calculo_energia))) falhar('sexo_calculo_energia')
    if (r.nivel_atividade_energia !== undefined && (typeof r.nivel_atividade_energia !== 'string' || !['sedentaria', 'leve', 'moderada', 'intensa'].includes(r.nivel_atividade_energia))) falhar('nivel_atividade_energia')
  }
  if (nome === 'configuracoes' && r.alimentos_comuns_ocultos !== undefined && (!Array.isArray(r.alimentos_comuns_ocultos) || r.alimentos_comuns_ocultos.some(v => typeof v !== 'string' || !v || v.length > 200))) falhar('alimentos_comuns_ocultos')
  if (nome === 'alimentos_favoritos' || nome === 'refeicoes_dia' || nome === 'combos_refeicao') {
    for (const campo of ['kcal', 'proteina_g', 'carbo_g', 'gordura_g', 'fibra_g', 'sodio_mg', 'acucares_g']) numero(campo, 0)
  }
  if (nome === 'alimentos_favoritos' && r.base_quantidade_g !== undefined) numero('base_quantidade_g', Number.MIN_VALUE, 5000)
  if (r.alimento_nome !== undefined && typeof r.alimento_nome !== 'string') falhar('alimento_nome')
  if (nome === 'alimentos_favoritos' && r.marca !== undefined && typeof r.marca !== 'string') falhar('marca')
  if (nome === 'alimentos_favoritos' && r.fonte !== undefined && r.fonte !== 'pessoal') falhar('fonte')
  if (nome === 'refeicoes_dia' && r.quantidade_g !== undefined) numero('quantidade_g', Number.MIN_VALUE, 20000)
  if (nome === 'agua_dia' && r.garrafas_ml !== undefined) {
    if (!Array.isArray(r.garrafas_ml) || r.garrafas_ml.some(v => !Number.isSafeInteger(v) || v < 50 || v > 5000) || r.garrafas_ml.reduce((a: number, v: number) => a + v, 0) > Number(r.ml)) falhar('garrafas_ml')
  }
  if (nome === 'cardio_sessoes') {
    validarDetalhesCardio(r)
    numero('duracao_minutos', Number.MIN_VALUE, 1440)
    numero('distancia_km', 0, 1000)
    numero('velocidade_media_kmh', Number.MIN_VALUE, 150)
    numero('inclinacao_pct', 0, 50)
    numero('passos', 0, 200000, true)
    numero('calorias_informadas', 0, 20000)
    numero('fc_media', 1, 250, true)
    numero('fc_max', 1, 250, true)
    if (typeof r.fc_media === 'number' && typeof r.fc_max === 'number' && r.fc_media > r.fc_max) falhar('fc_media')
  }
  if (nome === 'atividade_diaria') { numero('passos', 0, 200000, true); numero('calorias_gastas', 0, 20000) }
  if (r.reducoes !== undefined) {
    if (!Array.isArray(r.reducoes)) falhar('reducoes')
    for (const reducao of r.reducoes as unknown[]) {
      if (!reducao || typeof reducao !== 'object' || Array.isArray(reducao)) falhar('reducoes')
      const d = reducao as Record<string, unknown>
      if (typeof d.peso_digitado !== 'number' || !Number.isFinite(d.peso_digitado) || d.peso_digitado < 0 || d.peso_digitado > 2000 || typeof d.repeticoes !== 'number' || !Number.isInteger(d.repeticoes) || d.repeticoes < 1 || d.repeticoes > 1000) falhar('reducoes')
    }
  }
  if (nome === 'combos_refeicao') {
    if (!Array.isArray(r.itens)) falhar('itens')
    for (const item of r.itens as unknown[]) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) falhar('itens')
      const i = item as Record<string, unknown>
      if (typeof i.descricao !== 'string' || typeof i.kcal !== 'number') falhar('itens')
      for (const campo of ['kcal', 'proteina_g', 'carbo_g', 'gordura_g', 'fibra_g', 'sodio_mg', 'acucares_g']) if (i[campo] !== undefined && (typeof i[campo] !== 'number' || !Number.isFinite(i[campo]) || Number(i[campo]) < 0)) falhar(`itens.${campo}`)
    }
  }
  if (nome === 'exercicios' && !['manual', 'banco_aberto'].includes(String(r.origem))) falhar('origem')
  if (nome === 'refeicoes_dia' && !['estimado', 'exato'].includes(String(r.precisao))) falhar('precisao')
  if (nome === 'fotos' && r.angulo !== null && !['frente', 'lado', 'costas'].includes(String(r.angulo))) falhar('angulo')
}

export function validarReferenciasBackup(tabelas: Record<string, LinhaBackup[]>) {
  // Pais excluídos continuam válidos: o backup preserva tombstones e Desfazer.
  const ids = new Map(Object.entries(tabelas).map(([nome, linhas]) => [nome, new Set(linhas.map(r => r.id))]))
  const vinculos: Record<string, [string, string, boolean][]> = {
    ficha_exercicios: [['ficha_id', 'fichas', true], ['exercicio_id', 'exercicios', true]],
    treinos: [['ficha_id', 'fichas', false]],
    treino_exercicios: [['treino_id', 'treinos', true], ['exercicio_id', 'exercicios', true]],
    series_treino: [['treino_id', 'treinos', true], ['exercicio_id', 'exercicios', true]],
    cardio_sessoes: [['treino_id', 'treinos', false], ['exercicio_id', 'exercicios', false]],
    fotos: [['medida_id', 'medidas_corporais', false], ['exercicio_id', 'exercicios', false]],
    refeicoes_dia: [['foto_id', 'fotos', false], ['alimento_id', 'alimentos_favoritos', false]],
  }
  for (const [nome, referencias] of Object.entries(vinculos)) for (const r of tabelas[nome] ?? []) {
    if(r.eliminado_em)continue
    for (const [campo, destino, obrigatorio] of referencias) {
      const valor = r[campo]
      if (valor === undefined && !obrigatorio) continue
      if (typeof valor !== 'string' || !valor || !ids.get(destino)?.has(valor)) throw new Error(`Vínculo inválido em ${nome}.${campo}: registro ausente em ${destino}.`)
    }
  }
}
import { validarDetalhesCardio } from './detalhesCardio'
