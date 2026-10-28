import { useId } from 'react'
import { grupoMuscularVisual } from '../dados/grupoMuscularVisual'

export function IndicadorMusculo({ grupo, nome, tipo, completo = false }: { grupo?: string; nome?: string; tipo?: string; completo?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const principal = grupoMuscularVisual(grupo, nome, tipo)
  if (!principal) return null
  const costas = ['Costas', 'Tríceps', 'Posteriores', 'Glúteos', 'Panturrilhas', 'Lombar', 'Trapézio'].includes(principal)
  const inferior = ['Quadríceps', 'Posteriores', 'Glúteos', 'Adutores', 'Abdutores', 'Panturrilhas', 'Pernas'].includes(principal)
  const enquadramento = completo ? '3 0 42 74' : inferior ? '12 36 24 35' : principal === 'Abdômen' ? '13 23 22 18' : '8 10 32 31'
  const cor = (...grupos: string[]) => `url(#musculo-${grupos.includes(principal) ? 'ativo' : 'base'}-${id})`
  return <span className="indicador-musculo" data-regiao={inferior ? 'inferior' : 'superior'} role="img" aria-label={`Grupo principal: ${principal}`} title={`Grupo principal: ${principal}`}>
    <svg viewBox={enquadramento} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`musculo-base-${id}`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="var(--musculo-luz, #789989)" /><stop offset="1" stopColor="var(--musculo-base)" /></linearGradient>
        <linearGradient id={`musculo-ativo-${id}`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#e0ffb1" /><stop offset=".5" stopColor="var(--musculo-ativo)" /><stop offset="1" stopColor="#88be58" /></linearGradient>
      </defs>
      {completo && <ellipse cx="24" cy="72" rx="9" ry="1" fill="var(--musculo-contorno)" opacity=".18" />}
      <path d="M20.5 5.4C20.5 2.5 21.6 1 24 1S27.5 2.5 27.5 5.4L27.1 8.1Q26.8 9.4 25.7 10.2V12H22.3V10.2Q21.2 9.4 20.9 8.1Z" fill={cor()} />
      <path d="M22.2 11.2Q20.7 12.7 17.5 13.4C14.8 13.7 13.1 15.2 12.6 17.6L11.7 23.5Q11.2 25 10.4 26.4L8.4 34.8L7.4 37.5Q7 39.2 7.8 41L9 42.2Q9.8 42.5 10 41.7L10.2 39.9L10.8 40.4Q11.5 40.5 11.1 39L10.7 37.3L13.5 29.9L15.3 24.1L17 29.1Q17.9 32.4 17.4 35.3L16.4 40.1Q15.9 43.8 16.7 48.5L18.1 55.5Q17.6 58.8 18.5 62.2L20.3 68.7L19.7 70.4Q19 71.6 20.3 71.6H23Q23.7 71.3 23.4 70.4L22.5 68.2L23 61.9L22.8 56.1L24 46.5L25.2 56.1L25 61.9L25.5 68.2L24.6 70.4Q24.3 71.3 25 71.6H27.7Q29 71.6 28.3 70.4L27.7 68.7L29.5 62.2Q30.4 58.8 29.9 55.5L31.3 48.5Q32.1 43.8 31.6 40.1L30.6 35.3Q30.1 32.4 31 29.1L32.7 24.1L34.5 29.9L37.3 37.3L36.9 39Q36.5 40.5 37.2 40.4L37.8 39.9L38 41.7Q38.2 42.5 39 42.2L40.2 41Q41 39.2 40.6 37.5L39.6 34.8L37.6 26.4Q36.8 25 36.3 23.5L35.4 17.6C34.9 15.2 33.2 13.7 30.5 13.4Q27.3 12.7 25.8 11.2" fill={cor()} />
      <g stroke="var(--musculo-contorno)" strokeWidth=".35" strokeLinejoin="round" strokeLinecap="round">
        <path d="M17.4 14.3Q14.1 14.4 13.7 18.2L13.4 21.5Q16.4 20.5 18 17.8Z M30.6 14.3Q33.9 14.4 34.3 18.2L34.6 21.5Q31.6 20.5 30 17.8Z" fill={cor('Ombros')} />
        <path d="M13.4 22.5L16.2 21.6Q16.4 25.8 13.7 28.3L12.1 28.7Q12.1 25 13.4 22.5Z M34.6 22.5L31.8 21.6Q31.6 25.8 34.3 28.3L35.9 28.7Q35.9 25 34.6 22.5Z" fill={costas ? cor('Tríceps') : cor('Bíceps')} />
        <path d="M11.8 30L13.5 29.6L10.1 36.9L8.8 37Q9.5 33.1 11.8 30Z M36.2 30L34.5 29.6L37.9 36.9L39.2 37Q38.5 33.1 36.2 30Z" fill={cor('Antebraços')} />
        {costas ? <>
          <path d="M22 12Q19.4 13.5 17.9 15.3L21.8 19.6L24 21.1L26.2 19.6L30.1 15.3Q28.6 13.5 26 12L24 15Z" fill={cor('Trapézio')} />
          <path d="M17.7 20.1Q19.8 21 23.2 21.4L22.7 32.9Q19.6 30.6 18.8 27.2Z M30.3 20.1Q28.2 21 24.8 21.4L25.3 32.9Q28.4 30.6 29.2 27.2Z" fill={cor('Costas')} />
          <path d="M22.7 31.8L23.4 34.3L23.2 38.7L19 39.6Q20.1 35.8 22.7 31.8Z M25.3 31.8L24.6 34.3L24.8 38.7L29 39.6Q27.9 35.8 25.3 31.8Z" fill={cor('Lombar')} />
          <path d="M18.2 40.2Q20.1 38.8 23.5 39.6L23.4 44.3Q22.7 47.3 17.5 45.1Q16.7 42.4 18.2 40.2Z M29.8 40.2Q27.9 38.8 24.5 39.6L24.6 44.3Q25.3 47.3 30.5 45.1Q31.3 42.4 29.8 40.2Z" fill={cor('Glúteos')} />
        </> : <>
          <path d="M18.1 18Q20.7 16.9 23.3 18.2L23.3 23.6Q20.8 25.1 17.5 23.3L16.8 20.7Z M29.9 18Q27.3 16.9 24.7 18.2L24.7 23.6Q27.2 25.1 30.5 23.3L31.2 20.7Z" fill={cor('Peito')} />
          {[26, 29.5, 33].map(y => <path key={y} d={`M20.8 ${y}Q22 ${y - .7} 23.3 ${y}L23.3 ${y + 2.7}Q21.6 ${y + 3.4} 20.7 ${y + 2.4}Z M27.2 ${y}Q26 ${y - .7} 24.7 ${y}L24.7 ${y + 2.7}Q26.4 ${y + 3.4} 27.3 ${y + 2.4}Z`} fill={cor('Abdômen')} />)}
          <path d="M18 25.2L19.8 27.4L19.7 35.6L23.1 39L19 37Q17.8 32 18 25.2Z M30 25.2L28.2 27.4L28.3 35.6L24.9 39L29 37Q30.2 32 30 25.2Z" fill={cor('Abdômen')} />
        </>}
        <path d="M17.8 44Q20.6 44 21.3 48.8L21.3 53.3Q20.1 56.5 18.8 53.7L17.6 48.5Z M30.2 44Q27.4 44 26.7 48.8L26.7 53.3Q27.9 56.5 29.2 53.7L30.4 48.5Z" fill={costas ? cor('Posteriores', 'Pernas') : cor('Quadríceps', 'Pernas')} />
        {!costas && <>
          <path d="M21.1 42Q23.2 42.6 23 46.1L22 52.4Q20.5 49.7 20.6 47.1Z M26.9 42Q24.8 42.6 25 46.1L26 52.4Q27.5 49.7 27.4 47.1Z" fill={cor('Adutores', 'Pernas')} />
          <path d="M17.2 39.8L19 39.1L19.2 42.4L17.3 46Q16.8 42.5 17.2 39.8Z M30.8 39.8L29 39.1L28.8 42.4L30.7 46Q31.2 42.5 30.8 39.8Z" fill={cor('Abdutores')} />
        </>}
        <path d="M19.1 57.1Q21 56.5 21.8 58.1Q22.9 61.5 21.2 65.7L20.6 67L19.3 62.4Q18.6 59.1 19.1 57.1Z M28.9 57.1Q27 56.5 26.2 58.1Q25.1 61.5 26.8 65.7L27.4 67L28.7 62.4Q29.4 59.1 28.9 57.1Z" fill={cor('Panturrilhas')} />
      </g>
    </svg>
  </span>
}
