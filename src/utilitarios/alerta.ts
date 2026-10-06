let audio: AudioContext | undefined
export function liberarAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume().catch(() => undefined)
    const fonte = audio.createBufferSource(); fonte.buffer = audio.createBuffer(1, 1, 22050)
    fonte.connect(audio.destination); fonte.start()
  } catch { /* O alerta visual continua disponível. */ }
}
export function tocarAlerta() {
  if (!audio || audio.state !== 'running') return
  const tom = audio.createOscillator(); const ganho = audio.createGain()
  tom.frequency.value = 880; ganho.gain.setValueAtTime(0.15, audio.currentTime)
  ganho.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5)
  tom.connect(ganho); ganho.connect(audio.destination); tom.start(); tom.stop(audio.currentTime + 0.5)
}
