export const LIMITE_BACKUP = 250 * 1048576
const FORMATO = 'vida-em-dia:criptografado'
const FORMATO_INVALIDO = 'Formato ou versão não reconhecidos.'
const AUTENTICACAO_INVALIDA = 'Senha incorreta ou arquivo alterado.'
const encoder = new TextEncoder()
interface Cabecalho {
 formato: typeof FORMATO; versao: 1; algoritmo: 'AES-256-GCM'
 kdf: { nome: 'PBKDF2'; hash: 'SHA-256'; iteracoes: number }; salt: string; iv: string
}
export interface EnvelopeBackup extends Cabecalho { dados: string }
function base64(bytes: Uint8Array) {
 let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192))
 return btoa(s)
}
function bytes(s: unknown): Uint8Array<ArrayBuffer> {
 if (typeof s !== 'string' || s.length % 4 || /[^A-Za-z0-9+/=]/.test(s) || s.slice(0, -2).includes('=') || !/^[A-Za-z0-9+/]*(?:={1,2})?$/.test(s.slice(-4))) throw new Error(FORMATO_INVALIDO)
 const tamanho = s.length / 4 * 3 - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0)
 const resultado = new Uint8Array(tamanho)
 for (let i = 0, destino = 0; i < s.length; i += 32768) {
  const parte = atob(s.slice(i, i + 32768))
  for (let j = 0; j < parte.length; j++) resultado[destino++] = parte.charCodeAt(j)
 }
 return resultado
}
function aad(c: Cabecalho) {
 return encoder.encode(JSON.stringify([c.formato, c.versao, c.algoritmo, c.kdf.nome, c.kdf.hash, c.kdf.iteracoes, c.salt, c.iv]))
}
async function chave(senha: string, salt: Uint8Array<ArrayBuffer>, iteracoes: number) {
 const material = await crypto.subtle.importKey('raw', encoder.encode(senha), 'PBKDF2', false, ['deriveKey'])
 return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iteracoes }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
export function conferirTamanho(tamanho: number) {
 if (tamanho > LIMITE_BACKUP) throw new Error('O arquivo ou conteúdo ultrapassa 250 MB. Importe um backup menor.')
}
// Conta UTF-8 sem alocar outra cópia integral do texto só para conferir o limite.
function conferirTexto(texto: string) {
 let tamanho=0
 for(let i=0;i<texto.length;i++){
  const c=texto.charCodeAt(i)
  if(c<128)tamanho++
  else if(c<2048)tamanho+=2
  else if(c>=0xd800&&c<=0xdbff&&texto.charCodeAt(i+1)>=0xdc00&&texto.charCodeAt(i+1)<=0xdfff){tamanho+=4;i++}
  else tamanho+=3
  conferirTamanho(tamanho)
 }
}
export function validarSenhaBackup(senha: string, repetida: string) {
 if (Array.from(senha).length < 12) throw new Error('Use uma senha com pelo menos 12 caracteres.')
 if (senha !== repetida) throw new Error('As senhas não coincidem.')
}
export async function criptografarBackup(texto: string, senha: string): Promise<EnvelopeBackup> {
 validarSenhaBackup(senha, senha)
 conferirTexto(texto)
 const conteudo = encoder.encode(texto)
 const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
 const c: Cabecalho = { formato: FORMATO, versao: 1, algoritmo: 'AES-256-GCM', kdf: { nome: 'PBKDF2', hash: 'SHA-256', iteracoes: 600000 }, salt: base64(salt), iv: base64(iv) }
 const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(c), tagLength: 128 }, await chave(senha, salt, c.kdf.iteracoes), conteudo)
 const envelope = { ...c, dados: base64(new Uint8Array(dados)) }
 conferirTamanho(JSON.stringify({ ...c, dados: '' }).length + envelope.dados.length)
 return envelope
}
export function ehCriptografado(valor: unknown): valor is EnvelopeBackup {
 return !!valor && typeof valor === 'object' && 'formato' in valor
}
export async function decifrarBackup(valor: unknown, senha: string): Promise<string> {
 const c = valor as EnvelopeBackup
 if (!c || c.formato !== FORMATO || c.versao !== 1 || c.algoritmo !== 'AES-256-GCM' || c.kdf?.nome !== 'PBKDF2' || c.kdf.hash !== 'SHA-256' || !Number.isSafeInteger(c.kdf.iteracoes) || c.kdf.iteracoes < 600000 || c.kdf.iteracoes > 1000000) throw new Error(FORMATO_INVALIDO)
 // Todos os limites são conferidos antes do KDF e da alocação do corpo.
 if(typeof c.salt!=='string'||c.salt.length!==24||typeof c.iv!=='string'||c.iv.length!==16)throw new Error(FORMATO_INVALIDO)
 const salt = bytes(c.salt), iv = bytes(c.iv)
 if (salt.length !== 16 || iv.length !== 12 || typeof c.dados !== 'string') throw new Error(FORMATO_INVALIDO)
 conferirTamanho(c.dados.length)
 const corpo = bytes(c.dados)
 if (corpo.byteLength < 16) throw new Error(FORMATO_INVALIDO)
 conferirTamanho(corpo.byteLength - 16)
 let claro: ArrayBuffer
 try { claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad(c), tagLength: 128 }, await chave(senha, salt, c.kdf.iteracoes), corpo) }
 catch { throw new Error(AUTENTICACAO_INVALIDA) }
 conferirTamanho(claro.byteLength)
 return new TextDecoder('utf-8', { fatal: true }).decode(claro)
}
export function lerJsonBackup(texto: string): unknown {
 conferirTexto(texto)
 try { return JSON.parse(texto) as unknown } catch { throw new Error(FORMATO_INVALIDO) }
}
