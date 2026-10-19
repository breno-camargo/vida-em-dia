import { useState } from 'react'
import { descartarPerfilCadastro, salvarPerfilCadastro, usePerfilCadastro } from '../dados/perfilCadastro'
import { useConta, usuarioAtual } from '../sincronizacao/estado'

export function ConcluirPerfilCadastro({ abrirConta }: { abrirConta: () => void }) {
  const perfil = usePerfilCadastro(), conta = useConta()
  const [ocupado, definirOcupado] = useState(false), [erro, definirErro] = useState('')
  if (!perfil || !conta.usuario || conta.usuario.email?.toLowerCase() !== perfil.email || conta.recuperando) return null
  return <section className="painel perfil-inicial-cadastro"><h2>Seu ponto de partida</h2><p>As informações opcionais do cadastro estão prontas para salvar: {perfil.altura_cm !== undefined ? 'altura' : ''}{perfil.altura_cm !== undefined && perfil.medida ? ' e ' : ''}{perfil.medida ? 'medidas corporais' : ''}.</p>{!conta.vinculado&&<p>Primeiro, conecte este aparelho à sua conta. Seus dados ainda não foram salvos.</p>}<button className="botao-principal" disabled={ocupado||conta.ocupado} onClick={async()=>{
    if (!conta.vinculado) { abrirConta(); return }
    definirOcupado(true); definirErro('')
    try { await salvarPerfilCadastro(conta.usuario!,perfil,()=>usuarioAtual()?.id); descartarPerfilCadastro() }
    catch(e) { definirErro(e instanceof Error?e.message:'Não foi possível salvar seu perfil.') }
    finally { definirOcupado(false) }
  }}>{ocupado?'Salvando…':conta.vinculado?'Salvar informações iniciais':'Conectar aparelho'}</button><button className="botao-secundario" disabled={ocupado} onClick={descartarPerfilCadastro}>Preencher depois</button>{erro&&<p className="erro" role="alert">{erro}</p>}</section>
}
