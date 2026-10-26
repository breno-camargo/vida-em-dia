import { useEstadoTemporario } from '../hooks/useEstadoTemporario'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { repositorio } from '../dados/repositorio'
import { estimarEnergia, niveisEnergia, pesoParaEnergia, salvarCampoEnergia } from '../dados/energia'
import { lerGramas } from '../dados/alimentacao'
import { dataMedida, formatarDataMedida } from '../dados/medidas'
import { tipoDia } from '../dados/atividade'
import type { Configuracao, MedidaCorporal } from '../dados/modelos'
import { Painel } from './Painel'
import { enquadrarDetalhes, recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { Rolagem } from './Rolagem'
import { SelecionarNumero } from './SelecionarNumero'

function useDadosEnergia() {
  return useLiveQuery(async () => ({
    config: (await repositorio('configuracoes').listar()).find(c => c.chave === 'principal'),
    peso: pesoParaEnergia(await repositorio('medidas_corporais').listar()),
    feriados: await repositorio('feriados').listar(),
  }))
}

function FormularioEnergia({ config, peso, registrarPeso }: { config: Configuracao; peso?: MedidaCorporal; registrarPeso?: () => void }) {
  const [escolha, setEscolha] = useState<'nascimento' | 'sexo' | 'nivel'>()
  const [dataRascunho, setDataRascunho] = useState((config.data_nascimento || '2000-01-01').split('-').map(Number))
  const [campoNumero, setCampoNumero] = useState<'altura' | 'metaUtil' | 'metaFds'>()
  const [nascimento, setNascimento] = useState(config.data_nascimento ?? '')
  const [sexo, setSexo] = useState(config.sexo_calculo_energia ?? '')
  const [altura, setAltura] = useState(config.altura_cm !== undefined ? String(config.altura_cm) : '')
  const [nivel, setNivel] = useState(config.nivel_atividade_energia ?? '')
  const [metaUtil, setMetaUtil] = useState(config.meta_kcal_util ? String(config.meta_kcal_util) : '')
  const [metaFds, setMetaFds] = useState(config.meta_kcal_fds_feriado ? String(config.meta_kcal_fds_feriado) : '')
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), [mensagem, setMensagem] = useEstadoTemporario('', 3000)
  async function persistir<K extends Parameters<typeof salvarCampoEnergia>[0]>(campo: K, valor: Configuracao[K]) {
    setOcupado(true); setErro(''); setMensagem('')
    try { await salvarCampoEnergia(campo, valor); setMensagem('Salvo.'); }
    finally { setOcupado(false) }
  }
  async function salvarNascimento() {
    const data = dataRascunho.map((v,i) => String(v).padStart(i === 0 ? 4 : 2,'0')).join('-')
    try { await persistir('data_nascimento', data); setNascimento(data); setEscolha(undefined) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar.') }
  }
  return <div className="formulario comida-formulario energia-formulario">
    <p className="nota-resumo">Estimativa para adultos de 19 a 78 anos. Preencha seus dados; o peso vem dos registros de Medidas.</p>
    <div className="energia-peso"><span>Peso usado</span><strong>{peso?.peso !== undefined ? `${peso.peso.toLocaleString('pt-BR')} kg · ${formatarDataMedida(peso.data)}` : 'Ainda não registrado'}</strong>{registrarPeso && <button type="button" className="botao-secundario" onClick={registrarPeso}>Registrar peso em Medidas</button>}</div>
    <button type="button" className="data-medida" onClick={() => { setDataRascunho((nascimento || '2000-01-01').split('-').map(Number)); setEscolha('nascimento') }}><span>Data de nascimento</span><strong>{nascimento ? formatarDataMedida(nascimento) : 'Informar'}</strong></button>
    <button type="button" className="data-medida" onClick={() => setEscolha('sexo')}><span>Sexo usado pela equação</span><strong>{sexo === 'masculino' ? 'Masculino' : sexo === 'feminino' ? 'Feminino' : 'Selecionar'}</strong></button>
    <button type="button" className="data-medida" onClick={() => setCampoNumero('altura')}><span>Altura</span><strong>{altura ? `${altura} cm` : 'Informar'}</strong></button>
    <button type="button" className="data-medida" onClick={() => setEscolha('nivel')}><span>Rotina de atividade</span><strong>{niveisEnergia.find(n => n.valor === nivel)?.nome || 'Apenas repouso'}</strong></button>
    {nivel && <p className="nota-resumo">{niveisEnergia.find(n => n.valor === nivel)?.descricao} Considere a rotina inteira, incluindo os treinos.</p>}
    <fieldset className="energia-metas"><legend>Sua meta alimentar (opcional)</legend><p className="nota-resumo">Defina uma meta própria ou orientada por profissional. O cálculo não preenche essas metas. Vazio ou zero significa sem meta.</p>
      <button type="button" className="data-medida" onClick={() => setCampoNumero('metaUtil')}><span>Dias úteis</span><strong>{Number(metaUtil) ? `${metaUtil} kcal/dia` : 'Sem meta'}</strong></button>
      <button type="button" className="data-medida" onClick={() => setCampoNumero('metaFds')}><span>Fins de semana e feriados</span><strong>{Number(metaFds) ? `${metaFds} kcal/dia` : 'Sem meta'}</strong></button>
    </fieldset>
    {erro && <p role="alert" className="erro">{erro}</p>}{mensagem && <p role="status" className="nota-resumo">{mensagem}</p>}
    {escolha && <Painel titulo={escolha === 'nascimento' ? 'Data de nascimento' : escolha === 'sexo' ? 'Sexo usado pela equação' : 'Rotina de atividade'} fechar={() => { if (!ocupado) setEscolha(undefined) }} acao={escolha === 'nascimento' ? <button type="button" className="botao-principal salvar-cabecalho" disabled={ocupado} onClick={() => void salvarNascimento()}>{ocupado ? 'Salvando…' : 'Salvar'}</button> : undefined}>
      {escolha === 'nascimento' ? <><div className="rodas-data">{[2,1,0].map((indice) => <Rolagem key={indice} rotulo={indice === 2 ? 'DIA' : indice === 1 ? 'MÊS' : 'ANO'} inicial={dataRascunho[indice]} valores={Array.from({ length: indice === 2 ? 31 : indice === 1 ? 12 : new Date().getFullYear() - 1900 + 1 }, (_, i) => i + (indice === 0 ? 1900 : 1))} escolher={valor => setDataRascunho(atual => atual.map((v,i) => i === indice ? valor : v))} />)}</div></> : <div className="formulario">{(escolha === 'sexo' ? [{valor:'masculino',nome:'Masculino'},{valor:'feminino',nome:'Feminino'}] : [{valor:'',nome:'Calcular apenas repouso'},...niveisEnergia]).map(opcao => <button type="button" key={opcao.valor} className="botao-secundario" aria-pressed={(escolha === 'sexo' ? sexo : nivel) === opcao.valor} disabled={ocupado} onClick={async () => { try { if (escolha === 'sexo') { await persistir('sexo_calculo_energia', opcao.valor as Configuracao['sexo_calculo_energia']); setSexo(opcao.valor as typeof sexo) } else { await persistir('nivel_atividade_energia', (opcao.valor || undefined) as Configuracao['nivel_atividade_energia']); setNivel(opcao.valor as typeof nivel) } setEscolha(undefined) } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } }}>{opcao.nome}{(escolha === 'sexo' ? sexo : nivel) === opcao.valor ? ' ✓' : ''}</button>)}</div>}
      {erro && <p role="alert" className="erro">{erro}</p>}
    </Painel>}
    {campoNumero && <SelecionarNumero titulo={campoNumero === 'altura' ? 'Altura' : campoNumero === 'metaUtil' ? 'Meta alimentar: dias úteis' : 'Meta alimentar: fins de semana'} unidade={campoNumero === 'altura' ? 'cm' : 'kcal'} valor={lerGramas(campoNumero === 'altura' ? altura : campoNumero === 'metaUtil' ? metaUtil : metaFds) || (campoNumero === 'altura' ? 170 : 0)} minimo={campoNumero === 'altura' ? 80 : 0} maximo={campoNumero === 'altura' ? 250 : 10000} decimal={campoNumero === 'altura'} permitirDigitar fechar={() => setCampoNumero(undefined)} confirmar={async valor => { if (valor === undefined) return; await persistir(campoNumero === 'altura' ? 'altura_cm' : campoNumero === 'metaUtil' ? 'meta_kcal_util' : 'meta_kcal_fds_feriado', valor); (campoNumero === 'altura' ? setAltura : campoNumero === 'metaUtil' ? setMetaUtil : setMetaFds)(String(valor)) }} />}
  </div>
}

export function PainelEnergia({ registrarPeso, fechar }: { registrarPeso?: () => void; fechar: () => void }) {
  const dados = useDadosEnergia()
  return <Painel titulo="Metabolismo e alimentação" fechar={fechar}>
    {dados?.config ? <FormularioEnergia config={dados.config} peso={dados.peso} registrarPeso={registrarPeso} /> : <p role="status">Carregando perfil…</p>}
  </Painel>
}

export function ConfigurarEnergia({ registrarPeso }: { registrarPeso?: () => void }) {
  const dados = useDadosEnergia()
  if (!dados?.config) return <p role="status">Carregando perfil…</p>
  return <section className="painel"><h2>Metabolismo e alimentação</h2><FormularioEnergia config={dados.config} peso={dados.peso} registrarPeso={registrarPeso} /></section>
}

export function ResumoEnergia({ registrarPeso }: { registrarPeso?: () => void }) {
  const dados = useDadosEnergia(), [aberto, setAberto] = useState(false)
  if (!dados?.config) return null
  const config = dados.config, calculo = estimarEnergia(config, dados.peso?.peso)
  const hoje = dataMedida(), dia = tipoDia(hoje, dados.feriados, config.descanso_por_data?.[hoje] === true)
  const meta = dia === 'util' ? config.meta_kcal_util : config.meta_kcal_fds_feriado
  const numero = (valor: number) => valor.toLocaleString('pt-BR')
  return <section className="painel energia-resumo"><header><h3>Seu gasto estimado hoje</h3><button type="button" className="link-atividade" onClick={() => setAberto(true)}><SlidersHorizontal size={16} aria-hidden="true" />Configurar</button></header>
    {calculo ? <><div className="energia-valores"><div><span>Em repouso</span><strong>≈ {numero(calculo.repouso)} <small>kcal/dia</small></strong></div><div><span>Com sua rotina</span><strong>{calculo.diario ? `≈ ${numero(calculo.diario)}` : 'Não definido'}{calculo.diario && <small> kcal/dia</small>}</strong></div></div>
      <p className="nota-resumo">Base: {numero(calculo.peso)} kg de {formatarDataMedida(dados.peso!.data)}, {numero(calculo.altura)} cm e {calculo.idade} anos.</p></> : <p className="nota-resumo">Configure nascimento, sexo usado no cálculo e altura, e registre seu peso em Medidas para estimar o gasto em repouso.</p>}
    {!dados.peso && registrarPeso && <button className="botao-secundario energia-registrar-peso" onClick={registrarPeso}>Registrar peso</button>}
    <p className="energia-meta">Meta alimentar de hoje: <strong>{meta ? `${numero(meta)} kcal` : 'não definida'}</strong></p>
    <p className="nota-resumo">São estimativas, não medições. A rotina já inclui atividade física; não somamos novamente as calorias de treino, cardio ou passos.</p>
    <details className="energia-metodo" onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}>Como calculamos</summary><p>Repouso: equação de <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Mifflin–St Jeor</a>. A estimativa diária aplica um fator aproximado conforme a rotina, com referência nos <a href="https://www.fao.org/4/Y5686e/y5686e07.htm" target="_blank" rel="noreferrer">intervalos de atividade da FAO/WHO/UNU</a>. Não se destina a crianças, gestantes ou lactantes; nesses casos, use orientação individual.</p></details>
    {aberto && <PainelEnergia registrarPeso={registrarPeso} fechar={() => setAberto(false)} />}
  </section>
}
