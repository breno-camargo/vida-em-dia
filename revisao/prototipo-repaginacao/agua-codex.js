/* Água: demonstração isolada em memória. Sem contas, banco ou rede. */
(() => {
 const {painel,criarBotao:b}=uiPrototipo;
 const agua={garrafaMl:undefined,lancamentos:[]};
 const hoje=()=>new Date().toLocaleDateString('sv-SE');
 const texto=(t,tag='p')=>{const e=document.createElement(tag);e.textContent=t;return e;};
 const ml=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:1})+' ml';
 const total=data=>agua.lancamentos.filter(l=>l.data===data).reduce((s,l)=>s+l.ml,0);
 const erro=(body,t)=>{let e=body.querySelector('[role=alert]');if(!e){e=texto('');e.setAttribute('role','alert');body.append(e);}e.textContent=t;};
 function configurar(){
  const body=painel('Minha garrafa','modal-garrafa-codex');
  body.append(texto('Informe a capacidade da sua garrafa. Mudar este tamanho não altera o que você já registrou.'));
  const label=texto('Capacidade da garrafa (ml)','label'),input=document.createElement('input');input.type='text';input.inputMode='numeric';input.className='campo-input';input.value=agua.garrafaMl??'';input.placeholder='Ex.: 600';label.append(input);body.append(label);
  body.append(b('Salvar garrafa','botao-principal',()=>{
   const v=input.value.trim();if(!/^\d+$/.test(v)||Number(v)<50||Number(v)>10000){erro(body,'Informe uma capacidade entre 50 e 10.000 ml, em números inteiros.');return;}
   agua.garrafaMl=Number(v);fecharModal('modal-garrafa-codex');renderizarTela();
  }));abrirModal('modal-garrafa-codex');
 }
 function adicionar(data,volume,fracao){
  agua.lancamentos.push({id:crypto.randomUUID(),data,ml:volume,garrafaMl:agua.garrafaMl,fracao});
 }
 function conteudo(body,data){
  const registros=agua.lancamentos.filter(l=>l.data===data),inteiras=registros.filter(l=>l.fracao===1).length,meias=registros.filter(l=>l.fracao===.5).length;
  const resumo=texto(ml(total(data)),'strong');resumo.className='agua-total';resumo.setAttribute('role','status');body.append(resumo);
  body.append(texto(`${inteiras} ${inteiras===1?'garrafa inteira':'garrafas inteiras'}${meias?' · '+meias+' meia(s) garrafa(s)':''}${registros.some(l=>!l.fracao)?' · inclui outra quantidade':''}`));
  body.append(texto(agua.garrafaMl?'Sua garrafa atual: '+ml(agua.garrafaMl):'Cadastre o tamanho da sua garrafa para começar.'));
  const inteira=b('+1 garrafa','botao-principal',()=>{adicionar(data,agua.garrafaMl,1);atualizar();});
  inteira.disabled=!agua.garrafaMl;body.append(inteira);
  const extras=document.createElement('div');extras.className='grade-dupla';
  const meia=b('Meia garrafa','botao-secundario',()=>{adicionar(data,agua.garrafaMl/2,.5);atualizar();});meia.disabled=!agua.garrafaMl;
  extras.append(meia,b('Outra quantidade','botao-secundario',()=>{
   const form=painel('Outra quantidade de água','modal-agua-quantidade-codex');const label=texto('Quantidade (ml)','label'),input=document.createElement('input');input.type='text';input.inputMode='decimal';input.className='campo-input';label.append(input);form.append(label,b('Registrar água','botao-principal',()=>{
    const v=input.value.trim(),n=Number(v.replace(',','.'));if(!/^\d+(?:[.,]\d)?$/.test(v)||n<=0||n>10000){erro(form,'Informe de 0,1 a 10.000 ml, com até uma casa decimal.');return;}
    adicionar(data,n,undefined);fecharModal('modal-agua-quantidade-codex');atualizar();
   }));abrirModal('modal-agua-quantidade-codex');
  }));body.append(extras);
  const desfazer=b('Desfazer último lançamento','botao-secundario',()=>{
   const ultimo=agua.lancamentos.findLastIndex(l=>l.data===data);if(ultimo>=0)agua.lancamentos.splice(ultimo,1);atualizar();
  });desfazer.disabled=!registros.length;body.append(desfazer);
  function atualizar(){if(document.getElementById('modal-agua-dia-codex')?.classList.contains('aberto'))montarDia(data);renderizarTela();}
 }
 function montarDia(data){
  const body=painel('Água por dia','modal-agua-dia-codex'),label=texto('Data da água','label'),input=document.createElement('input');input.type='date';input.className='campo-input';input.max=hoje();input.value=data;label.append(input);body.append(label);
  input.onchange=()=>{const d=new Date(input.value+'T12:00:00');if(!input.value||!Number.isFinite(d.getTime())||d.toLocaleDateString('sv-SE')!==input.value||input.value>hoje()){erro(body,'Escolha uma data válida, até hoje.');return;}montarDia(input.value);};
  conteudo(body,data);
  if(agua.lancamentos.some(l=>l.data===data)){
   const detalhes=document.createElement('details');detalhes.className='painel-card';detalhes.append(texto('Ver lançamentos deste dia','summary'));
   agua.lancamentos.filter(l=>l.data===data).slice().reverse().forEach(l=>detalhes.append(texto(`${ml(l.ml)}${l.fracao?' · '+(l.fracao===1?'1 garrafa':'meia garrafa')+' de '+ml(l.garrafaMl):' · quantidade personalizada'}`)));body.append(detalhes);
  }
 }
 const render=renderizarTela;
 renderizarTela=function(){
  render();const root=document.getElementById('app-corpo');
  if(estado.telaAtual==='hoje'){
   const card=document.createElement('section');card.className='painel-card formulario';card.id='agua-hoje-codex';card.append(texto('Água','h2'));conteudo(card,hoje());card.append(b(agua.garrafaMl?'Alterar minha garrafa':'Configurar minha garrafa','botao-secundario',configurar),b('Consultar ou registrar outro dia','botao-secundario',()=>{montarDia(hoje());abrirModal('modal-agua-dia-codex');}));root.append(card);
  }
  if(estado.telaAtual==='configuracoes'){
   const card=document.createElement('section');card.className='painel-card formulario';card.append(texto('Meu perfil · garrafa','h2'),texto(agua.garrafaMl?'Capacidade cadastrada: '+ml(agua.garrafaMl):'Nenhuma garrafa cadastrada.'),b('Configurar minha garrafa','botao-secundario',configurar));root.append(card);
  }
 };
 window.aguaPrototipo=agua;
})();
