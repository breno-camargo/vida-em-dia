import { describe, expect, test } from 'vitest'
import { lembreteBackup } from './backup'

describe('A05: Lembrete de backup', () => {
  // 1. sync recente com backup antigo
  test('sync recente com backup antigo: sincronização não reinicia prazo e emite lembrete', () => {
    // Configuração com backup feito há 30 dias, mas sincronização feita há 1 hora
    const config = {
      criado_em: '2026-01-01T00:00:00Z',
      ultimo_backup: '2026-01-01T00:00:00Z',
      ultima_sincronizacao: '2026-01-30T23:00:00Z',
      dias_lembrete_backup: 14,
    }
    const agora = Date.parse('2026-01-31T00:00:00Z') // 30 dias após o backup
    // Sincronização NÃO cobre fotos locais e não substitui o backup completo
    expect(lembreteBackup(config, agora)).toBe(true)
  })

  // 2. sem backup
  test('sem backup: usa criado_em como referência', () => {
    const config = {
      criado_em: '2026-01-01T00:00:00Z',
      dias_lembrete_backup: 14,
    }
    // 13 dias e 23h após criação -> dentro do prazo
    expect(lembreteBackup(config, Date.parse('2026-01-14T23:59:59Z'))).toBe(false)
    // 14 dias após criação -> prazo atingido
    expect(lembreteBackup(config, Date.parse('2026-01-15T00:00:00Z'))).toBe(true)
    // 60 dias após criação, mesmo com sync recente diário -> continua lembrando
    expect(lembreteBackup({ ...config, ultima_sincronizacao: '2026-03-01T00:00:00Z' }, Date.parse('2026-03-02T00:00:00Z'))).toBe(true)
  })

  // 3. backup recente
  test('backup recente: suprime o lembrete enquanto estiver dentro do prazo', () => {
    const config = {
      criado_em: '2026-01-01T00:00:00Z',
      ultimo_backup: '2026-01-20T00:00:00Z',
      dias_lembrete_backup: 14,
    }
    // 5 dias após o backup -> não deve lembrar
    expect(lembreteBackup(config, Date.parse('2026-01-25T00:00:00Z'))).toBe(false)
    // 13 dias após o backup -> não deve lembrar
    expect(lembreteBackup(config, Date.parse('2026-02-02T00:00:00Z'))).toBe(false)
    // 14 dias após o backup -> deve lembrar
    expect(lembreteBackup(config, Date.parse('2026-02-03T00:00:00Z'))).toBe(true)
  })

  // 4. datas inválidas com fallback
  test('datas inválidas com fallback: ultimo_backup corrompido recai em criado_em válido', () => {
    const config = {
      criado_em: '2026-01-01T00:00:00Z',
      ultimo_backup: 'data-invalida-corrompida',
      dias_lembrete_backup: 14,
    }
    // Fallback para criado_em (há 10 dias) -> não lembra
    expect(lembreteBackup(config, Date.parse('2026-01-11T00:00:00Z'))).toBe(false)
    // Fallback para criado_em (há 15 dias) -> lembra
    expect(lembreteBackup(config, Date.parse('2026-01-16T00:00:00Z'))).toBe(true)

    // Se ultimo_backup for string vazia ou espaço
    expect(lembreteBackup({ ...config, ultimo_backup: '' }, Date.parse('2026-01-16T00:00:00Z'))).toBe(true)

    // Se ambos forem inválidos -> fallback seguro sem lançar exceção
    expect(lembreteBackup({ criado_em: 'invalido', ultimo_backup: 'invalido', dias_lembrete_backup: 14 }, Date.parse('2026-01-16T00:00:00Z'))).toBe(false)
  })

  // 5. prazo exato
  test('prazo exato: aciona no milissegundo exato do limite', () => {
    const criado = Date.parse('2026-01-01T12:00:00.000Z')
    const dias = 10
    const limiteMs = dias * 86_400_000
    const config = {
      criado_em: '2026-01-01T12:00:00.000Z',
      ultimo_backup: '2026-01-01T12:00:00.000Z',
      dias_lembrete_backup: dias,
    }

    // 1 ms antes do limite exato
    expect(lembreteBackup(config, criado + limiteMs - 1)).toBe(false)
    // Exatamente no limite
    expect(lembreteBackup(config, criado + limiteMs)).toBe(true)
    // 1 ms após o limite
    expect(lembreteBackup(config, criado + limiteMs + 1)).toBe(true)
  })

  // 6. preservação de desligamento e configuração de dias
  test('preservação de desligamento e configuração de dias personalizada', () => {
    const base = {
      criado_em: '2026-01-01T00:00:00Z',
      ultimo_backup: '2026-01-01T00:00:00Z',
    }
    const agora = Date.parse('2026-06-01T00:00:00Z')

    // Desligado com 0 ou negativo
    expect(lembreteBackup({ ...base, dias_lembrete_backup: 0 }, agora)).toBe(false)
    expect(lembreteBackup({ ...base, dias_lembrete_backup: -1 }, agora)).toBe(false)
    expect(lembreteBackup({ ...base, dias_lembrete_backup: NaN }, agora)).toBe(false)

    // Intervalo personalizado de 30 dias
    const config30 = { ...base, dias_lembrete_backup: 30 }
    expect(lembreteBackup(config30, Date.parse('2026-01-30T00:00:00Z'))).toBe(false) // 29 dias
    expect(lembreteBackup(config30, Date.parse('2026-01-31T00:00:00Z'))).toBe(true)  // 30 dias

    // Intervalo personalizado de 7 dias
    const config7 = { ...base, dias_lembrete_backup: 7 }
    expect(lembreteBackup(config7, Date.parse('2026-01-07T00:00:00Z'))).toBe(false)  // 6 dias
    expect(lembreteBackup(config7, Date.parse('2026-01-08T00:00:00Z'))).toBe(true)   // 7 dias
  })
})
