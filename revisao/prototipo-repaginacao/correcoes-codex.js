/* Ajustes isolados de interação. Nenhum acesso ao app, rede ou dados reais. */
(() => {
  const renderOriginal = renderizarTela;
  const cardsOriginal = renderizarExerciciosTreinoAtivo;
  const fichaOriginal = renderizarItensEditorFicha;
  const barraOriginal = renderizarBarraPrototipo;
  renderizarBarraPrototipo = function () {
    const anterior=document.querySelector('.ferramentas-mobile-codex');
    const aberto=anterior?.open ?? false;
    barraOriginal();
    const barra=document.getElementById('barra-prototipo');if(!barra)return;
    const titulo=barra.querySelector('.barra-prototipo-titulo');if(titulo)titulo.hidden=true;
    const acoes=barra.querySelector('.barra-prototipo-acoes');
    const details=document.createElement('details');details.className='ferramentas-mobile-codex';details.open=aberto;
    const summary=document.createElement('summary');summary.textContent='Prévia · tema e telas';
    details.append(summary,acoes);barra.append(details);
  };
  let telaTreino;
  let selecao;
  const criarBotao = (texto, classe, acao) => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = classe; b.textContent = texto; b.onclick = acao; return b;
  };
  const serie = (e, s) => estado.treinoAtivo?.itens[e]?.series[s];

  // O treino é uma página da moldura; sair da página não encerra a sessão.
  renderizarTela = function () {
    if (telaTreino) { telaTreino.hidden = true; document.body.append(telaTreino); }
    renderOriginal();
    if (estado.telaAtual === 'sessao' && estado.treinoAtivo) {
      const corpo = document.getElementById('app-corpo'); corpo.replaceChildren(telaTreino);
      telaTreino.hidden = false;
      document.getElementById('titulo-modo-treino').textContent = estado.treinoAtivo.titulo;
      document.getElementById('btn-nomear-treino-livre').hidden = !!estado.treinoAtivo.fichaId;
      renderizarExerciciosTreinoAtivo(); atualizarProgressoTreinoAtivo();
      filtrarExerciciosParaTreinoAtivo(''); atualizarDisplayDescanso();
    } else if (estado.treinoAtivo && ['treino', 'hoje'].includes(estado.telaAtual)) {
      const b = criarBotao('Continuar treino em andamento', 'botao-principal largura-total retomada-codex', abrirModalModoTreino);
      document.getElementById('app-corpo').prepend(b);
    }
  };
  abrirModalModoTreino = function () {
    if (!estado.treinoAtivo) return;
    fecharModais(); estado.telaAtual = 'sessao'; renderizarTela();
  };
  const iniciarFicha = iniciarTreinoFicha, iniciarLivre = iniciarTreinoLivre;
  iniciarTreinoFicha = id => estado.treinoAtivo ? abrirModalModoTreino() : iniciarFicha(id);
  iniciarTreinoLivre = () => estado.treinoAtivo ? abrirModalModoTreino() : iniciarLivre();

  function painel(titulo, id) {
    let root = document.getElementById(id);
    if (!root) {
      root = document.createElement('div'); root.id = id; root.className = 'modal-overlay centralizado'; root.hidden = true;
      root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', titulo);
      const sheet = document.createElement('div'); sheet.className = 'modal-sheet';
      const header = document.createElement('div'); header.className = 'modal-cabecalho';
      const h = document.createElement('h2'); h.textContent = titulo;
      const close = criarBotao('', 'app-botao-icone', () => fecharModal(id));
      close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      close.setAttribute('aria-label', 'Fechar ' + titulo);
      header.append(h, close); const body = document.createElement('div'); body.className = 'modal-corpo formulario';
      sheet.append(header, body); root.append(sheet); document.body.append(root);
    }
    root.querySelector('h2').textContent = titulo; root.setAttribute('aria-label', titulo);
    const body = root.querySelector('.modal-corpo'); body.replaceChildren(); return body;
  }

  function escolherNumero(titulo, valor, min, max, passo, confirmar) {
    const body = painel(titulo, 'modal-numero-codex');
    let escolhido = Number(valor ?? min), modo = 'rolar';
    const abas = document.createElement('div'); abas.className = 'abas-segmentadas';
    const janela = document.createElement('div'); janela.className='janela-roda-codex';
    const roda = document.createElement('div'); roda.className = 'roda-codex'; roda.setAttribute('aria-label', titulo);roda.setAttribute('role','listbox');roda.tabIndex=0;janela.append(roda);
    const label = document.createElement('label'); label.textContent = titulo;
    const input = document.createElement('input'); input.className = 'campo-input'; input.type = 'text'; input.inputMode = passo < 1 ? 'decimal' : 'numeric';
    input.value = escolhido.toLocaleString('pt-BR', {useGrouping:false}); label.append(input); label.hidden = true;
    const status = document.createElement('p'); status.className = 'nota-explicativa'; status.setAttribute('role', 'status');
    const valores=Array.from({length:Math.floor((max-min)/passo)+1},(_,i)=>Number((min+i*passo).toFixed(3)));
    let indice=Math.max(0,Math.min(valores.length-1,Math.round((escolhido-min)/passo)));
    const atualizar = () => {
      escolhido=valores[indice];
      [...roda.children].forEach((b,i)=>b.setAttribute('aria-selected',String(i===indice)));
      roda.setAttribute('aria-activedescendant','opcao-numero-codex-'+indice);
      status.textContent=modo==='rolar'?'Deslize para escolher.':'Digite o valor e confirme.';
    };
    const centralizar=()=>{roda.scrollTo({top:indice*48,behavior:'instant'});};
    const mostrar = novo => {
      if(modo==='digitar'&&novo==='rolar'){
        const digitado=Number(input.value.trim().replace(',','.'));
        if(input.value.trim()&&Number.isFinite(digitado)&&digitado>=min&&digitado<=max)indice=Math.round((digitado-min)/passo);
      }
      modo = novo; label.hidden = modo !== 'digitar'; janela.hidden = modo !== 'rolar';
      [...abas.children].forEach(b => b.setAttribute('aria-pressed', String(b.textContent.toLowerCase() === modo)));
      if (modo === 'digitar') { input.value = String(escolhido).replace('.', ','); input.focus(); }
      else requestAnimationFrame(centralizar);
      atualizar();
    };
    abas.append(criarBotao('Rolar', '', () => mostrar('rolar')), criarBotao('Digitar', '', () => mostrar('digitar')));
    valores.forEach((v,i)=>{
      const b = criarBotao(v.toLocaleString('pt-BR'), 'item-roda-codex', () => {indice=i;atualizar();centralizar();});
      b.dataset.valor=v;b.id='opcao-numero-codex-'+i;b.tabIndex=-1;b.setAttribute('role','option');roda.append(b);
    });
    roda.onscroll = () => {
      if(janela.hidden)return;
      indice=Math.max(0,Math.min(valores.length-1,Math.round(roda.scrollTop/48)));atualizar();
    };
    roda.onkeydown=e=>{
      if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      e.preventDefault();indice=e.key==='Home'?0:e.key==='End'?valores.length-1:Math.max(0,Math.min(valores.length-1,indice+(e.key==='ArrowDown'?1:-1)));atualizar();centralizar();
    };
    const ok = criarBotao('Confirmar', 'botao-principal largura-total', () => {
      if(modo==='rolar'){indice=Math.max(0,Math.min(valores.length-1,Math.round(roda.scrollTop/48)));atualizar();}
      const v = modo === 'digitar' ? Number(input.value.trim().replace(',', '.')) : escolhido;
      if ((modo === 'digitar' && !input.value.trim()) || !Number.isFinite(v) || v < min || v > max || Math.abs((v-min)/passo - Math.round((v-min)/passo)) > 0.00001) {
        status.textContent = `Informe de ${min} a ${max}, em passos de ${passo}.`; return;
      }
      fecharModal('modal-numero-codex'); confirmar(v);
    });
    body.append(abas, label, janela, status, ok); atualizar(); mostrar('rolar'); abrirModal('modal-numero-codex');
    requestAnimationFrame(centralizar);
  }
  alterarRepsSeriePrompt = (e,s) => escolherNumero('Repetições', serie(e,s).reps, 0, 100, 1, v => { serie(e,s).reps=v; renderizarExerciciosTreinoAtivo(); });
  alterarPesoSeriePrompt = (e,s) => escolherNumero('Carga em kg', serie(e,s).peso, 0, 400, .25, v => { serie(e,s).peso=v; renderizarExerciciosTreinoAtivo(); });
  ciclarTipoSerie = (e,s) => {
    const body = painel('Tipo de série', 'modal-tipo-codex');
    for(const [valor,nome] of [['normal','Normal'],['aquecimento','Aquecimento'],['falha','Até a falha'],['dropset','Drop set']]) body.append(criarBotao(nome,'botao-secundario largura-total',()=>{serie(e,s).tipo=valor; fecharModal('modal-tipo-codex');renderizarExerciciosTreinoAtivo();}));
    abrirModal('modal-tipo-codex');
  };

  renderizarItensEditorFicha = function () {
    fichaOriginal();
    document.querySelectorAll('#editor-ficha-itens input[type=number]').forEach((input,i) => {
      input.readOnly = true; input.setAttribute('aria-label', i%2 ? 'Descanso em segundos' : 'Quantidade de séries');
      input.onclick = () => escolherNumero(i%2?'Descanso em segundos':'Quantidade de séries',Number(input.value),i%2?0:1,i%2?600:20,i%2?15:1,v=>{estado.fichaEmEdicao.itens[Math.floor(i/2)][i%2?'descansoSegundos':'seriesPlanejadas']=v;input.value=v;});
    });
  };

  renderizarExerciciosTreinoAtivo = function () {
    const anteriores = new Map([...document.querySelectorAll('#treino-exercicios-container > details')].map(d=>[d.dataset.item,d.open]));
    cardsOriginal();
    document.querySelectorAll('#treino-exercicios-container > details').forEach((d,e) => {
      const item=estado.treinoAtivo.itens[e]; d.dataset.item=item.id;
      d.open=anteriores.get(item.id) ?? false;
      if(item.series.every(s=>s.concluida)) d.open=false;
      const controles=document.createElement('div'); controles.className='controles-descanso-codex';
      controles.append(criarBotao(`Descanso · ${item.descansoSegundos}s`,'botao-secundario',()=>escolherNumero('Descanso em segundos',item.descansoSegundos,0,600,15,v=>{item.descansoSegundos=v;renderizarExerciciosTreinoAtivo();})));
      d.querySelector('.conteudo-exercicio-treino').prepend(controles);
      const ajuda=d.querySelector('summary button');if(ajuda){ajuda.setAttribute('aria-label','Como fazer: '+item.nome);ajuda.title='Como fazer';ajuda.textContent='Como fazer';ajuda.classList.add('ajuda-compacta-codex');}
      const acoes=d.querySelector('.acoes-exercicio-linha');if(acoes){const detalhes=document.createElement('details');detalhes.className='acoes-exercicio-codex';const sum=document.createElement('summary');sum.textContent='Mais opções do exercício';acoes.before(detalhes);detalhes.append(sum,acoes);}
      d.querySelectorAll('.opcoes-serie-painel').forEach(p => {
        // Recupera o índice pela linha imediatamente anterior, sem variável local no handler HTML.
        const linha=p.previousElementSibling; const s=[...d.querySelectorAll('.linha-serie')].indexOf(linha);
        p.querySelectorAll('input').forEach((input,i)=>{
          input.removeAttribute('onchange'); input.readOnly=true; input.setAttribute('aria-label',i?'Esforço RPE':'Peso da barra');
          input.onclick=()=>escolherNumero(i?'Esforço RPE':'Peso da barra',Number(input.value),0,i?10:100,.5,v=>{item.series[s][i?'rpe':'pesoBarra']=v;renderizarExerciciosTreinoAtivo();});
        });
      });
    });
  };

  const iniciarDescansoOriginal=iniciarDescansoTimer;
  iniciarDescansoTimer=function(segundos){
    if(segundos<=0) return;
    iniciarDescansoOriginal(segundos);
    const body=painel('Tempo de descanso','modal-descanso-codex');
    const tempo=document.createElement('strong'); tempo.id='tempo-popup-codex'; tempo.className='tempo-descanso-codex';
    const acoes=document.createElement('div'); acoes.className='grade-dupla';
    acoes.append(criarBotao('−15 s','botao-secundario',()=>adicionarTempoDescanso(-15)),criarBotao('+30 s','botao-secundario',()=>adicionarTempoDescanso(30)));
    body.append(tempo,acoes,criarBotao('Pular descanso','botao-principal largura-total',pularDescanso)); abrirModal('modal-descanso-codex'); atualizarDisplayDescanso();
  };
  const displayOriginal=atualizarDisplayDescanso;
  atualizarDisplayDescanso=function(){
    displayOriginal(); const resumo=document.getElementById('painel-descanso');if(resumo)resumo.hidden=!(estado.descansoTempoRestante>0);const el=document.getElementById('tempo-popup-codex'); if(el)el.textContent=formatarTempoSegundos(Math.max(0,estado.descansoTempoRestante));
    if(estado.descansoTempoRestante<=0 && estado.pilhaModais.some(m=>m.id==='modal-descanso-codex'))fecharModal('modal-descanso-codex');
  };
  const pularOriginal=pularDescanso;
  pularDescanso=function(){pularOriginal();if(estado.pilhaModais.some(m=>m.id==='modal-descanso-codex'))fecharModal('modal-descanso-codex');};
  alternarConclusaoSerie=function(e,s){
    const item=estado.treinoAtivo.itens[e], atual=item.series[s]; atual.concluida=!atual.concluida;
    renderizarExerciciosTreinoAtivo();atualizarProgressoTreinoAtivo();
    if(atual.concluida)iniciarDescansoTimer(item.descansoSegundos ?? 90);
  };
  perguntarCancelarTreino=function(){
    const body=painel('Cancelar treino?','modal-cancelar-codex');
    const p=document.createElement('p');p.textContent='Este treino e suas séries ficarão fora do histórico. Para apenas sair da tela, escolha continuar depois.';
    body.append(p,criarBotao('Continuar depois','botao-secundario',()=>{fecharModais();navegarPara('treino');}),criarBotao('Cancelar treino','botao-destrutivo',()=>{fecharModais();cancelarTreinoAtivo();navegarPara('treino');}));abrirModal('modal-cancelar-codex');
  };
  abrirModalNomearTreinoLivre=function(){
    const body=painel('Nome do treino livre','modal-nome-codex');const label=document.createElement('label');label.textContent='Nome';const input=document.createElement('input');input.className='campo-input';input.value=estado.treinoAtivo.titulo;input.maxLength=80;label.append(input);
    body.append(label,criarBotao('Salvar nome','botao-principal',()=>{estado.treinoAtivo.titulo=input.value.trim()||'Treino livre';fecharModal('modal-nome-codex');document.getElementById('titulo-modo-treino').textContent=estado.treinoAtivo.titulo;}));abrirModal('modal-nome-codex');
  };
  window.uiPrototipo={painel,escolherNumero,criarBotao};
  document.addEventListener('DOMContentLoaded',()=>{
    telaTreino=document.getElementById('modal-modo-treino');telaTreino.className='treino-pagina-codex';telaTreino.removeAttribute('aria-modal');telaTreino.setAttribute('role','region');
    const sair=telaTreino.querySelector('.modal-cabecalho > button');sair.onclick=()=>navegarPara('treino');sair.setAttribute('aria-label','Voltar sem encerrar treino');sair.textContent='←';
    document.querySelectorAll('[id^=input-medida-]').forEach(input=>{if(input.type==='number'){input.type='text';input.inputMode='decimal';input.autocomplete='off';}});
    // Mantém ações do painel alcançáveis quando o teclado reduz o viewport visual.
    const ajustarViewport=()=>document.documentElement.style.setProperty('--altura-visivel-codex',(window.visualViewport?.height ?? window.innerHeight)+'px');
    window.visualViewport?.addEventListener('resize',ajustarViewport);ajustarViewport();
    // Arrastar somente a alça/cabeçalho; o corpo conserva sua rolagem nativa.
    let gesto;
    const limparGesto=()=>{if(gesto)gesto.sheet.style.transform='';gesto=undefined;};
    document.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||e.button!==0||e.target.closest('button,input,select,textarea,a'))return;
      const cabecalho=e.target.closest('.modal-alca,.modal-cabecalho');
      const modal=cabecalho?.closest('.modal-overlay');
      if(!modal||modal.hidden||modal!==estado.pilhaModais.at(-1))return;
      const sheet=modal.querySelector('.modal-sheet');if(!sheet)return;
      gesto={modal,sheet,id:e.pointerId,y:e.clientY,inicio:performance.now(),distancia:0,alvo:cabecalho};
      cabecalho.setPointerCapture(e.pointerId);e.preventDefault();
    });
    document.addEventListener('pointermove',e=>{
      if(!gesto||gesto.id!==e.pointerId)return;
      gesto.distancia=Math.max(0,e.clientY-gesto.y);
      gesto.sheet.style.transform=`translateY(${gesto.distancia}px)`;
    });
    document.addEventListener('pointerup',e=>{
      if(!gesto||gesto.id!==e.pointerId)return;
      const {modal,distancia,inicio}=gesto;
      const fechar=distancia>=60||(distancia>=24&&distancia/Math.max(1,performance.now()-inicio)>.45);
      limparGesto();if(fechar)fecharModal(modal.id);
    });
    document.addEventListener('pointercancel',limparGesto);
    document.addEventListener('lostpointercapture',()=>{if(gesto)limparGesto();});
    document.querySelectorAll('.modal-overlay .modal-alca').forEach(alca=>{
      alca.setAttribute('role','button');alca.tabIndex=0;alca.setAttribute('aria-label','Fechar painel');
      alca.removeAttribute('onclick');alca.onclick=()=>{};
      alca.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();fecharModal(alca.closest('.modal-overlay').id);}};
    });
    // O treino não deve exibir um descanso fictício antes da primeira série.
    estado.descansoTempoRestante=0;renderizarTela();
  });
})();
