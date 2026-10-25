/* Histórico e validações da demonstração. Sem persistência ou acesso remoto. */
(() => {
 const {painel,criarBotao:b}=uiPrototipo;
 const texto=(t,tag='p')=>{const el=document.createElement(tag);el.textContent=t;return el;};
 const numero=v=>Number.isFinite(v)?v.toLocaleString('pt-BR'):'Não informado';
 const dataValida=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(new Date(d+'T12:00:00').getTime())&&new Date(d+'T12:00:00').toLocaleDateString('sv-SE')===d;
 const hoje=()=>new Date().toLocaleDateString('sv-SE');
 const salvarMedidas=acaoSalvarEditorMedidas;
 acaoSalvarEditorMedidas=function(){
  const campos=[...document.querySelectorAll('#modal-editor-medidas input[id^="input-medida-"]')];
  // O formulário original usa um id diferente em algumas versões do protótipo.
  const inputs=campos.length?campos:[...document.querySelectorAll('input[id^="input-medida-"]')];
  const data=document.getElementById('input-medida-data').value;
  const mostrarErro=msg=>{const pai=document.getElementById('input-medida-data').closest('.modal-corpo');let aviso=pai.querySelector('[role=alert]');if(!aviso){aviso=texto('');aviso.setAttribute('role','alert');pai.append(aviso);}aviso.textContent=msg;};
  if(!dataValida(data)||data>hoje()){mostrarErro('Escolha uma data válida, até hoje.');return;}
  let preenchidos=0;
  for(const input of inputs){
   if(input.id==='input-medida-data'||input.closest('[hidden]'))continue;
   const valor=input.value.trim();if(!valor)continue;preenchidos++;
   const peso=input.id==='input-medida-peso',casas=peso?3:2;
   if(!new RegExp('^\\d+(?:[.,]\\d{1,'+casas+'})?$').test(valor)||Number(valor.replace(',','.'))<=0||Number(valor.replace(',','.'))>(peso?400:300)){
    mostrarErro(`Confira ${peso?'o peso (até 400 kg e 3 casas)':'as medidas (até 300 cm e 2 casas)'}.`);input.focus();return;
   }
  }
  if(!preenchidos){mostrarErro('Preencha pelo menos o peso ou uma medida.');return;}
  salvarMedidas();
 };
 const abrirMedida=abrirEditorMedidas;
 abrirEditorMedidas=function(data){
  abrirMedida(data);
  // Antebraços não são campos do software atual. Mantém os inputs internos
  // ocultos para compatibilidade com os handlers da demonstração anterior.
  for(const lado of ['d','e']){
   const input=document.getElementById('input-medida-antebraco-'+lado);
   if(input){input.value='';input.closest('.campo-grupo').hidden=true;}
  }
 };
 const comparar=renderizarComparacaoMedidas;
 renderizarComparacaoMedidas=function(anterior,atual){
  if(anterior&&atual&&(!Number.isFinite(anterior.peso)||!Number.isFinite(atual.peso))){
   const section=document.createElement('section');section.className='painel-card formulario';section.append(texto('Comparação entre datas','h2'),texto(formatarDataBr(anterior.data)+' → '+formatarDataBr(atual.data)));
   for(const [campo,nome,unidade] of [['peso','Peso','kg'],['busto','Busto','cm'],['cintura','Cintura','cm'],['abdomen','Abdômen','cm'],['quadril','Quadril','cm'],['braco_d','Bíceps direito','cm'],['braco_e','Bíceps esquerdo','cm'],['coxa_d','Coxa direita','cm'],['coxa_e','Coxa esquerda','cm'],['panturrilha_d','Panturrilha direita','cm'],['panturrilha_e','Panturrilha esquerda','cm']]){
    if(Number.isFinite(anterior[campo])&&Number.isFinite(atual[campo]))section.append(texto(`${nome}: ${numero(anterior[campo])} → ${numero(atual[campo])} ${unidade}`));
   }
   return section.outerHTML;
  }
  return comparar(anterior,atual);
 };
 abrirModalDetalhesTreino=function(id){
  const t=estado.historicoTreinos.find(x=>x.id===id);if(!t)return;
  estado.ultimoTreinoFinalizadoId=id;
  const body=painel('Detalhes do treino','modal-historico-completo-codex');
  body.append(texto(t.titulo,'h3'),texto(`${formatarDataBr(t.data)} · ${numero(t.duracaoMin)} min`));
  body.append(texto(`Volume: ${numero(t.volumeTotalKg)} kg · ${numero(t.seriesConcluidas)} séries`),texto(`Peso corporal: ${numero(t.pesoCorporal)} kg · Gasto estimado: ${numero(t.calorias)} kcal`));
  if(t.observacao)body.append(texto(t.observacao));
  if(!t.itens?.length)body.append(texto('Este registro fictício inicial não possui detalhes de séries. Conclua um treino para testar o histórico completo.'));
  for(const item of t.itens??[]){
   const details=document.createElement('details');details.className='painel-card';details.append(texto(item.nome,'summary'));
   for(const [i,s] of item.series.entries()){
    const carga=s.modoCarga==='peso_corporal'?'peso corporal':`${numero(s.peso)} kg${s.modoCarga==='por_lado'?' por lado + barra '+numero(s.pesoBarra??0)+' kg':''}`;
    details.append(texto(`Série ${i+1} · ${s.tipo} · ${numero(s.reps)} reps · ${carga} · ${s.concluida?'Concluída':'Não concluída'}${s.rpe?' · RPE '+s.rpe:''}`));
    for(const [j,r] of (s.reducoes??[]).entries())details.append(texto(`Redução ${j+1}: ${numero(r.reps)} reps · ${numero(r.peso)} kg`));
   }body.append(details);
  }
  body.append(b('Compartilhar este treino','botao-principal',()=>abrirModalCardsCompartilhaveis()),b('Fechar','botao-secundario',()=>fecharModal('modal-historico-completo-codex')));abrirModal('modal-historico-completo-codex');
 };
 // Cada botão do histórico precisa selecionar o próprio registro, não o último.
 const render=renderizarTela;
 renderizarTela=function(){
  render();
  if(estado.telaAtual==='evolucao'){
   const artigos=[...document.querySelectorAll('#app-corpo article.painel-card')];
   estado.historicoTreinos.slice().reverse().forEach((t,i)=>{
    const botao=artigos[i]?.querySelector('.botao-secundario');
    if(botao)botao.onclick=()=>{estado.ultimoTreinoFinalizadoId=t.id;abrirModalCardsCompartilhaveis();};
   });
  }
  if(estado.telaAtual==='hoje'){
   const {preferencias:p,atividade,feriados}=estadoLocalPrototipo;
   const data='2026-10-22'; // Data fictícia comum aos exemplos, não relógio do usuário.
   const diario=atividade.find(a=>a.data===data);
   const descanso=[0,6].includes(new Date(data+'T12:00:00').getDay())||feriados.some(f=>f.data===data);
   const metaPassos=descanso?p.meta_passos_fds_feriado:p.meta_passos_util;
   const metaCalorias=descanso?p.meta_calorias_gastas_fds_feriado:p.meta_calorias_gastas_util;
   const treino=estado.historicoTreinos.filter(t=>t.data===data).reduce((n,t)=>n+(t.calorias??0),0);
   const cardio=estado.sessoesCardio.filter(t=>t.data===data).reduce((n,t)=>n+(t.calorias??0),0);
   const kcal=p.modo_calorias==='total_manual'?(diario?.calorias??0):treino+cardio+(diario?.calorias??0);
   const section=document.createElement('section');section.className='painel-card formulario';section.id='metas-dia-codex';
   section.append(texto('Metas do dia','h2'),texto(descanso?'Metas de fim de semana/descanso':'Metas de dia útil'));
   for(const [nome,v,meta,unidade] of [['Passos',diario?.passos??0,metaPassos,'passos'],['Gasto diário',kcal,metaCalorias,'kcal']]){
    const label=document.createElement('label');label.textContent=`${nome}: ${numero(v)} / ${numero(meta)} ${unidade}`;
    if(meta>0){const barra=document.createElement('progress');barra.max=meta;barra.value=v;barra.setAttribute('aria-label',nome);barra.style.width='100%';label.append(barra);}section.append(label);
   }
   section.append(texto(p.modo_calorias==='total_manual'?'Usando somente o total diário informado. Treino e cardio não são somados novamente.':'Somando treino, cardio informado e atividade extra. Passos de sessões não são somados ao total diário.'));
   document.getElementById('app-corpo').append(section);
  }
 };
})();
