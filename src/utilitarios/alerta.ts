let audio: AudioContext | undefined
const ativos = new Set<OscillatorNode>()
export function liberarAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume().catch(() => undefined)
    const fonte = audio.createBufferSource(); fonte.buffer = audio.createBuffer(1, 1, 22050)
    fonte.connect(audio.destination); fonte.start()
  } catch { /* O alerta visual continua disponível. */ }
}
function tocarTom(frequencia: number, duracao: number, atraso = 0) {
  if (!audio || audio.state !== 'running') return
  const tom = audio.createOscillator(); const ganho = audio.createGain()
  const inicio = audio.currentTime + atraso
  tom.frequency.value = frequencia
  ganho.gain.setValueAtTime(0.001, inicio)
  ganho.gain.linearRampToValueAtTime(0.15, inicio + 0.02)
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao)
  tom.connect(ganho); ganho.connect(audio.destination)
  ativos.add(tom)
  tom.onended = () => { ativos.delete(tom); tom.disconnect(); ganho.disconnect() }
  tom.start(inicio); tom.stop(inicio + duracao)
}
export function tocarContagem() { tocarTom(660, 0.12) }
export function tocarAlerta() {
  tocarTom(880, 0.65)
  tocarTom(880, 0.65, 0.8)
  tocarTom(1046, 1.1, 1.6)
}
export function silenciarAlerta() {
  for (const tom of ativos) { try { tom.stop() } catch { /* Tom já encerrado. */ } }
  ativos.clear()
}
