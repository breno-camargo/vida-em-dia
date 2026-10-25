/* Organização visual exclusiva do protótipo. Preserva handlers e dados. */
(() => {
 const {criarBotao:b}=uiPrototipo;
 function recolher(section){
  if(section.dataset.recolhido)return;
  const titulo=section.querySelector('h2,h3');if(!titulo)return;
  const details=document.createElement('details');details.className='opcoes-recolhidas-codex';
  const summary=document.createElement('summary');summary.textContent=titulo.textContent;
  const conteudo=document.createElement('div');conteudo.className='conteudo-recolhido-codex';
  const cabecalho=titulo.closest('.painel-cabecalho');if(cabecalho)cabecalho.remove();else titulo.remove();
  conteudo.append(...section.childNodes);details.append(summary,conteudo);section.append(details);section.dataset.recolhido='true';
 }
 const privacidade=renderizarConteudoModalPrivacidade;
 renderizarConteudoModalPrivacidade=function(){privacidade();document.querySelectorAll('#corpo-modal-privacidade > section').forEach(recolher);};
 const backup=abrirModalBackup;
 abrirModalBackup=function(){
  backup();const body=document.querySelector('#modal-backup-completo-codex .modal-corpo');
  const opcoes=[...body.querySelectorAll('label.opcao-checkbox')];
  if(opcoes.length){const d=document.createElement('details');d.className='opcoes-recolhidas-codex';const s=document.createElement('summary');s.textContent='Conteúdo do arquivo';const c=document.createElement('div');c.className='conteudo-recolhido-codex';opcoes[0].before(d);c.append(...opcoes);d.append(s,c);}
  body.querySelectorAll('details').forEach(d=>d.classList.add('opcoes-recolhidas-codex'));
 };
 function organizarConfiguracoes(){
  const root=document.getElementById('app-corpo');
  root.querySelectorAll('section.painel-card').forEach(recolher);
  const itens=[...root.querySelectorAll('section[data-recolhido] > details,details.painel-card')];
  const grupos=new Map();
  for(const item of itens){
   const summary=item.querySelector('summary'),nome=summary.textContent;
   let grupo='PREFERÊNCIAS',descricao='Personalize seu espaço',path='M12 8v8M8 12h8';
   if(nome.includes('Conta')){grupo='SEU PERFIL';descricao='Acesso e sincronização';path='M20 21v-2a7 7 0 0 0-14 0v2M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0';}
   else if(nome.includes('garrafa')){grupo='SEU PERFIL';descricao='Capacidade usada no registro de água';path='M9 3h6M9 6h6l2 4v10H7V10l2-4V3';}
   else if(nome.includes('Backup')){grupo='DADOS E SEGURANÇA';descricao='Exportar ou recuperar seus registros';path='M12 16V4m-4 4 4-4 4 4M5 15v5h14v-5';}
   else if(nome.includes('Privacidade')){grupo='DADOS E SEGURANÇA';descricao='Lixeira, limpeza e exclusão';path='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10';}
   else if(nome.includes('Aparência')){descricao='Escolha entre claro e escuro';path='M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10';}
   else if(nome.includes('Cardio')){descricao='Metas diárias, feriados e avisos';path='M3 12h4l3-8 4 16 3-8h4';}
   else if(nome.includes('aparelho')){descricao='Instalação e uso no celular';path='M7 2h10v20H7zM11 18h2';}
   const icone=document.createElement('span');icone.className='config-icone';icone.setAttribute('aria-hidden','true');
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
   const desenho=document.createElementNS('http://www.w3.org/2000/svg','path');desenho.setAttribute('d',path);svg.append(desenho);icone.append(svg);
   const textos=document.createElement('span');textos.className='config-textos';const titulo=document.createElement('strong');titulo.textContent=nome;const detalhe=document.createElement('small');detalhe.textContent=descricao;textos.append(titulo,detalhe);
   const seta=document.createElement('span');seta.className='config-seta';seta.textContent='›';seta.setAttribute('aria-hidden','true');summary.replaceChildren(icone,textos,seta);
   if(!item.querySelector('.conteudo-recolhido-codex')){const conteudo=document.createElement('div');conteudo.className='conteudo-recolhido-codex';[...item.childNodes].filter(n=>n!==summary).forEach(n=>conteudo.append(n));item.append(conteudo);}
   item.className='config-linha';
   if(!grupos.has(grupo))grupos.set(grupo,[]);grupos.get(grupo).push(item);
  }
  for(const grupo of ['SEU PERFIL','PREFERÊNCIAS','DADOS E SEGURANÇA']){
   const bloco=document.createElement('section');bloco.className='config-grupo';const titulo=document.createElement('h2');titulo.textContent=grupo;const lista=document.createElement('div');lista.className='config-lista';lista.append(...(grupos.get(grupo)??[]));bloco.append(titulo,lista);root.append(bloco);
  }
  root.querySelectorAll('section[data-recolhido]').forEach(el=>el.remove());
  root.querySelectorAll(':scope > .formulario').forEach(el=>{if(!el.children.length)el.remove();});
 }
 let observarNav;
 const render=renderizarTela;
 renderizarTela=function(){
  observarNav?.disconnect();document.getElementById('acoes-treino-fixas-codex')?.remove();render();
  if(estado.telaAtual==='configuracoes')organizarConfiguracoes();
  if(estado.telaAtual==='treino'&&estado.secaoTreino==='fichas'){
   const fichas=[...document.querySelectorAll('.ficha-compacta-codex')];
   if(fichas.length>5){
    let pagina=0;const paginas=Math.ceil(fichas.length/5),nav=document.createElement('div');nav.className='paginacao-fichas-codex';nav.setAttribute('aria-label','Páginas de fichas');
    const status=document.createElement('span');status.setAttribute('role','status');
    const anterior=b('Anterior','botao-secundario',()=>{pagina--;mostrar();}),proxima=b('Próxima','botao-secundario',()=>{pagina++;mostrar();});nav.append(anterior,status,proxima);fichas.at(-1).after(nav);
    function mostrar(){fichas.forEach((f,i)=>f.hidden=Math.floor(i/5)!==pagina);status.textContent=`${pagina+1} de ${paginas}`;anterior.disabled=pagina===0;proxima.disabled=pagina===paginas-1;}
    mostrar();
   }
  }
  if(estado.telaAtual==='sessao'&&estado.treinoAtivo){
   const dock=document.createElement('section');dock.id='acoes-treino-fixas-codex';dock.setAttribute('aria-label','Ações do treino');
   const status=document.createElement('p');status.className='progresso-treino-fixo';dock.append(status);
   const grupo=document.createElement('div');grupo.className='grade-dupla';grupo.append(b('Continuar depois','botao-secundario',()=>navegarPara('treino')),b('Ver Resumo e Finalizar','botao-principal',abrirResumoFinalizacaoTreino));dock.append(grupo);
   const nav=document.querySelector('.app-navegacao-inferior');nav.before(dock);dock.style.bottom=nav.getBoundingClientRect().height+'px';
   observarNav=new ResizeObserver(()=>dock.style.bottom=nav.getBoundingClientRect().height+'px');observarNav.observe(nav);
   // O botão final fica sempre acessível; as demais ações continuam no fim da página.
   const original=[...document.querySelectorAll('#modal-modo-treino .modal-rodape button')].find(b=>b.textContent.trim()==='Ver Resumo e Finalizar');if(original)original.hidden=true;
   atualizarProgressoTreinoAtivo();
  }
 };
 const progresso=atualizarProgressoTreinoAtivo;
 atualizarProgressoTreinoAtivo=function(){
  progresso();const status=document.querySelector('.progresso-treino-fixo');
  if(status&&estado.treinoAtivo){const series=estado.treinoAtivo.itens.flatMap(e=>e.series);status.textContent=`${series.filter(s=>s.concluida).length} de ${series.length} séries concluídas`;}
 };
 const itensFicha=renderizarItensEditorFicha;
 renderizarItensEditorFicha=function(){
  itensFicha();
  document.querySelectorAll('#editor-ficha-itens .item-ficha-card').forEach((card,i)=>{
   const header=card.querySelector('.item-ficha-cabecalho'),titulo=header.querySelector('strong');
   titulo.textContent=titulo.textContent.replace(/^\d+\.\s*/,'');
   const numero=document.createElement('span');numero.className='editor-ficha-numero';numero.textContent=String(i+1);header.firstElementChild.prepend(numero);
   const campos=header.lastElementChild,inputs=[...campos.querySelectorAll('input')];campos.replaceChildren();campos.className='editor-ficha-valores';campos.removeAttribute('style');
   inputs.forEach((input,j)=>{
    input.removeAttribute('style');const label=document.createElement('label'),nome=document.createElement('span');nome.textContent=j?'Descanso · segundos':'Séries';label.append(nome,input);campos.append(label);
   });
   const acoes=card.querySelector('.item-ficha-acoes'),details=document.createElement('details'),summary=document.createElement('summary');details.className='editor-ficha-organizar';summary.textContent='Organizar exercício';acoes.before(details);details.append(summary,acoes);
  });
 };
})();
