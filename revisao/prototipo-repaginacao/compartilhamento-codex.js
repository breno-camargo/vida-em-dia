/* Interface isolada. A composição vem da cópia fiel do renderer aprovado. */
(() => {
 const {painel,criarBotao:b}=window.uiPrototipo;
 abrirModalCardsCompartilhaveis=function(cardio){
  if(!cardio||!Number.isFinite(cardio.duracaoMin))cardio=undefined;
  const h=estado.historicoTreinos.find(t=>t.id===estado.ultimoTreinoFinalizadoId)??estado.historicoTreinos.at(-1);
  const body=painel('Compartilhar card','modal-card-aprovado-codex');
  let modelo='adesivo',cor='clara',foto,resultado,url,previa,sequencia=0;
  const titulo=document.createElement('p');titulo.textContent='Composição original preservada. Dados fictícios desta demonstração.';body.append(titulo);
  const opcoes=document.createElement('div');opcoes.className='abas-segmentadas';
  const imagem=document.createElement('img');imagem.alt='Prévia do card aprovado';imagem.style.cssText='width:100%;max-width:280px;align-self:center;border-radius:8px';
  const aviso=document.createElement('p');aviso.setAttribute('role','status');
  const download=document.createElement('a');download.className='botao-principal largura-total';download.textContent='Baixar PNG';download.download='prototipo-card.png';
  const gerar=async()=>{
   const atual=++sequencia;download.removeAttribute('href');
   const treino={data:cardio?.data??h?.data??'2026-10-22',inicio:h?.inicio??'2026-10-22T12:00:00',fim:cardio?undefined:h?.fim,duracao_minutos:cardio?.duracaoMin??h?.duracaoMin??0,titulo:cardio?.tipo??h?.titulo??'Treino'};
   const dados=cardio?{cardio:{duracao_minutos:cardio.duracaoMin,distancia_km:cardio.distanciaKm,calorias_informadas:cardio.calorias,passos:cardio.passos}}:{volume:h?.volumeTotalKg??0,exercicios:h?.itens?.length??0,series:h?.seriesConcluidas??0};
   treino.calorias=h?.calorias;
   try{
    const r=await rendererPrototipoAprovado.criarImagensCardAprovado(treino,dados,foto,{modelo,cor});if(atual!==sequencia)return;
    if(url)URL.revokeObjectURL(url);if(previa)URL.revokeObjectURL(previa);resultado=r.blob;url=URL.createObjectURL(r.blob);previa=URL.createObjectURL(r.previa);imagem.src=previa;download.href=url;aviso.textContent=modelo==='foto'&&!foto?'Sem foto, é usado Editorial, como no app.':'';
   }catch{aviso.textContent='Não foi possível preparar o card. Tente outro modelo.';}
  };
  [['adesivo','Tipográfico'],['foto','Foto'],['minimalista','Editorial']].forEach(([id,nome])=>{const botao=b(nome,'',()=>{modelo=id;[...opcoes.children].forEach(x=>x.setAttribute('aria-pressed',String(x===botao)));gerar();});botao.setAttribute('aria-pressed',String(id===modelo));opcoes.append(botao);});
  body.append(opcoes,b('Alternar texto claro/escuro','botao-secundario',()=>{cor=cor==='clara'?'escura':'clara';gerar();}));
  const campoArquivo = document.createElement('div');
  campoArquivo.className = 'campo-arquivo-custom';
  const rotulo = document.createElement('span');
  rotulo.className = 'rotulo-arquivo';
  rotulo.textContent = 'Foto para prévia/card (opcional)';

  const zona = document.createElement('label');
  zona.className = 'zona-arquivo';
  zona.tabIndex = 0;
  zona.setAttribute('role', 'button');
  zona.setAttribute('aria-label', 'Escolher foto para prévia do card');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  input.style.cssText = 'position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;';

  const icone = document.createElement('span');
  icone.className = 'icone-arquivo';
  icone.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';

  const info = document.createElement('div');
  info.className = 'texto-arquivo';

  const btnTxt = document.createElement('span');
  btnTxt.className = 'botao-arquivo-simulado';
  btnTxt.textContent = 'Escolher foto…';

  const nomeArq = document.createElement('span');
  nomeArq.className = 'nome-arquivo-selecionado';
  nomeArq.textContent = 'JPEG, PNG ou WebP até 5 MB';

  info.append(btnTxt, nomeArq);
  zona.append(icone, info, input);
  campoArquivo.append(rotulo, zona);

  zona.onkeydown = (e) => {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      input.click();
    }
  };

  input.onchange = () => {
    const f = input.files[0];
    if (f && f.size > 5 * 1024 * 1024) {
      aviso.textContent = 'Use uma imagem de até 5 MB.';
      return;
    }
    if (f) {
      btnTxt.textContent = 'Foto selecionada';
      nomeArq.textContent = `${f.name} (${(f.size / 1024).toFixed(0)} KB)`;
      zona.style.borderColor = 'var(--brand-primary)';
      icone.style.background = 'var(--brand-primary)';
      icone.style.color = 'var(--brand-primary-text)';
    } else {
      btnTxt.textContent = 'Escolher foto…';
      nomeArq.textContent = 'JPEG, PNG ou WebP até 5 MB';
      zona.style.borderColor = '';
      icone.style.background = '';
      icone.style.color = '';
    }
    foto = f;
    gerar();
  };

  body.append(campoArquivo, imagem, aviso, download);
  body.append(b('Copiar PNG','botao-secundario',async()=>{try{if(!resultado||!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error();await navigator.clipboard.write([new ClipboardItem({'image/png':resultado})]);aviso.textContent='Imagem copiada.';}catch{aviso.textContent='Não foi possível copiar neste navegador. Use Baixar PNG.';}}),b('Compartilhar PNG','botao-secundario',async()=>{try{if(!resultado)throw new Error();const file=new File([resultado],'card.png',{type:'image/png'});if(!navigator.canShare?.({files:[file]}))throw new Error();await navigator.share({files:[file]});}catch{aviso.textContent='Compartilhamento não concluído. Use Baixar PNG.';}}));
  abrirModal('modal-card-aprovado-codex');gerar();
 };
})();
