/* Comportamentos reais representados exclusivamente em memória fictícia. */
(() => {
 const {painel,escolherNumero,criarBotao:b}=window.uiPrototipo;
 const p=(texto)=>{const el=document.createElement('p');el.textContent=texto;el.className='nota-explicativa';return el;};
 const valor=(nome,valor,acao)=>b(`${nome}: ${valor}`, 'botao-secundario largura-total',acao);
 const localizar=(e,i)=>estado.treinoAtivo?.itens[e]?.series[i];
 const total=(s,peso=s.peso)=>s.modoCarga==='peso_corporal'?0:s.modoCarga==='por_lado'?peso*2+(s.pesoBarra??0):peso;
 const volume=(itens)=>itens.reduce((v,item)=>v+item.series.filter(s=>s.concluida&&s.tipo!=='aquecimento').reduce((n,s)=>n+total(s)*s.reps+(s.tipo==='dropset'?(s.reducoes??[]).reduce((d,r)=>d+total(s,r.peso)*r.reps,0):0),0),0);
 const fechar=id=>fecharModal(id);
 const erro=(body,texto)=>{let el=body.querySelector('[role=alert]');if(!el){el=p('');el.setAttribute('role','alert');body.append(el);}el.textContent=texto;};

 function valoresSerie(e,i,reducao) {
  const s=localizar(e,i);if(!s)return;
  const alvo=reducao===undefined?s:s.reducoes[reducao];
  let reps=alvo.reps,peso=alvo.peso,proximas=false;
  const body=painel(reducao===undefined?`Série ${i+1}`:`Redução ${reducao+1}`,'modal-valores-codex');
  const grupo=document.createElement('div');grupo.className='serie-valores-grade';
  function campoNumero(nome,unidade,numero,acao){
   const botao=b('', 'serie-campo-numero',acao),label=document.createElement('span'),valor=document.createElement('strong'),unit=document.createElement('small');label.textContent=nome;unit.textContent=unidade;
   const atualizar=v=>{valor.textContent=v.toLocaleString('pt-BR');botao.setAttribute('aria-label',`${nome}: ${v.toLocaleString('pt-BR')}`);};atualizar(numero);botao.append(label,valor,unit);return {botao,atualizar};
  }
  const rep=campoNumero('Repetições','reps',reps,()=>escolherNumero('Repetições',reps,1,1000,1,v=>{reps=v;rep.atualizar(v);}));
  const carga=campoNumero('Carga em kg',s.modoCarga==='por_lado'?'kg por lado':'kg',peso,()=>escolherNumero('Carga em kg',peso,0,2000,.25,v=>{peso=v;carga.atualizar(v);}));
  const contexto=p(estado.treinoAtivo.itens[e].nome);contexto.classList.add('serie-contexto');body.append(contexto,grupo);grupo.append(rep.botao);if(s.modoCarga!=='peso_corporal')grupo.append(carga.botao);else{grupo.classList.add('serie-sem-carga');body.append(p('Exercício com peso corporal, sem carga externa.'));}
  if(!s.concluida&&reducao===undefined){
   const label=document.createElement('label');label.className='opcao-checkbox';const input=document.createElement('input');input.type='checkbox';input.onchange=()=>proximas=input.checked;
   const textos=document.createElement('span'),titulo=document.createElement('strong'),ajuda=document.createElement('small');titulo.textContent='Aplicar às próximas séries';ajuda.textContent='Somente as pendentes deste exercício';textos.append(titulo,ajuda);label.classList.add('serie-aplicar-proximas');label.append(input,textos);body.append(label);
  }
  body.append(b('Confirmar valores','botao-principal largura-total',()=>{
   alvo.reps=reps;alvo.peso=peso;
   if(proximas)estado.treinoAtivo.itens[e].series.slice(i+1).filter(x=>!x.concluida).forEach(x=>{x.reps=reps;x.peso=peso;});
   fechar('modal-valores-codex');renderizarExerciciosTreinoAtivo();
  }));abrirModal('modal-valores-codex');
 }
 alterarRepsSeriePrompt=(e,i)=>valoresSerie(e,i);
 alterarPesoSeriePrompt=(e,i)=>valoresSerie(e,i);

 alternarOpcoesSerie=(e,i)=>{
  const s=localizar(e,i);if(!s)return;
  const desenhar=()=>{
   const body=painel(`Opções da série ${i+1}`,'modal-opcoes-serie-codex');
   const grupo=document.createElement('div');grupo.className='abas-segmentadas';grupo.setAttribute('aria-label','Modo de carga');
   for(const [modo,nome] of [['total','Total'],['por_lado','Por lado'],['peso_corporal','Corporal']]){
    const botao=b(nome,'',()=>{s.modoCarga=modo;desenhar();renderizarExerciciosTreinoAtivo();});botao.setAttribute('aria-pressed',String(s.modoCarga===modo));grupo.append(botao);
   }
   body.append(grupo);
   if(s.modoCarga==='por_lado')body.append(valor('Peso da barra',`${s.pesoBarra??0} kg`,()=>escolherNumero('Peso da barra',s.pesoBarra??0,0,100,.5,v=>{s.pesoBarra=v;desenhar();renderizarExerciciosTreinoAtivo();})));
   if(s.modoCarga!=='peso_corporal')body.append(p('Carga total: '+total(s).toLocaleString('pt-BR')+' kg'));
   body.append(valor('Esforço RPE',s.rpe?`${s.rpe} / 10`:'Não informado',()=>escolherNumero('Esforço RPE (0 = não informar)',s.rpe??0,0,10,.5,v=>{if(v>0&&v<1)return;s.rpe=v||undefined;desenhar();})));
   if(i>0)body.append(b('Copiar repetições e carga da série anterior','botao-secundario',()=>{const anterior=localizar(e,i-1);Object.assign(s,{reps:anterior.reps,peso:anterior.peso,modoCarga:anterior.modoCarga,pesoBarra:anterior.pesoBarra});desenhar();renderizarExerciciosTreinoAtivo();}));
   if(s.tipo==='dropset'&&s.modoCarga!=='peso_corporal'){
    (s.reducoes??[]).forEach((r,j)=>{
     body.append(b(`Redução ${j+1}: ${r.reps} reps · ${r.peso.toLocaleString('pt-BR')} kg`,'botao-secundario',()=>valoresSerie(e,i,j)),b(`Retirar redução ${j+1}`,'botao-destrutivo',()=>{s.reducoes.splice(j,1);desenhar();}));
    });
    body.append(b('Adicionar redução sem descanso','botao-secundario',()=>{(s.reducoes??=[]).push({reps:s.reps,peso:Math.round(s.peso*.75*4)/4});desenhar();}));
   }
   body.append(b('Concluído','botao-principal',()=>fechar('modal-opcoes-serie-codex')));
  };desenhar();abrirModal('modal-opcoes-serie-codex');
 };
 const cards=renderizarExerciciosTreinoAtivo;
 renderizarExerciciosTreinoAtivo=function(){
  cards();
  document.querySelectorAll('#treino-exercicios-container > details').forEach((d,e)=>{
   const series=estado.treinoAtivo.itens[e].series;
   const concluido=series.length>0&&series.every(s=>s.concluida);
   d.classList.toggle('exercicio-concluido-codex',concluido);
   if(concluido){
    const selo=document.createElement('span');selo.className='selo-concluido-codex';selo.textContent='✓ Concluído';
    d.querySelector('summary > div')?.append(selo);
   }
   d.querySelectorAll('.linha-serie').forEach((linha,i)=>{
    const s=localizar(e,i);const carga=linha.querySelectorAll('.valor-serie-btn')[1];
    if(s.modoCarga==='peso_corporal'&&carga){carga.textContent='—';carga.disabled=true;carga.setAttribute('aria-label','Peso corporal, sem carga externa');}
    if(s.modoCarga==='por_lado'){const nota=p('Por lado · total '+total(s).toLocaleString('pt-BR')+' kg');linha.after(nota);}
   });
  });
 };
 ciclarTipoSerie=(e,i)=>{
  const s=localizar(e,i);const body=painel('Tipo de série','modal-tipo-codex');
  for(const [tipo,nome] of [['normal','Normal'],['aquecimento','Aquecimento — fora do volume'],['falha','Até a falha'],['dropset','Drop set']])body.append(b(nome,'botao-secundario',()=>{s.tipo=tipo;fechar('modal-tipo-codex');renderizarExerciciosTreinoAtivo();}));
  body.append(b('Remover série','botao-destrutivo',()=>{estado.treinoAtivo.itens[e].series.splice(i,1);estado.treinoAtivo.itens[e].series.forEach((s,j)=>s.numero=j+1);fechar('modal-tipo-codex');renderizarExerciciosTreinoAtivo();atualizarProgressoTreinoAtivo();}));abrirModal('modal-tipo-codex');
 };

 const resumoOriginal=abrirResumoFinalizacaoTreino;
 abrirResumoFinalizacaoTreino=function(){
  if(!estado.treinoAtivo)return;
  resumoOriginal();const t=estado.treinoAtivo;
  const medida=estado.medidas.filter(m=>m.peso>0&&m.data<=t.data).sort((a,b)=>a.data.localeCompare(b.data)).at(-1);
  t.pesoSessao=medida?.peso;
  const peso=document.getElementById('finalizacao-peso');const kcal=document.getElementById('finalizacao-calorias');
  peso.closest('.campo-grupo').hidden=true;kcal.closest('.campo-grupo').hidden=true;
  const painel=document.getElementById('resumo-metricas-painel');painel.replaceChildren();
  painel.append(p('Volume das séries concluídas, sem aquecimentos'),p(volume(t.itens).toLocaleString('pt-BR')+' kg'));
  const info=p(medida?`Peso cadastrado: ${medida.peso.toLocaleString('pt-BR')} kg · ${formatarDataBr(medida.data)}`:'Sem peso cadastrado. Cadastre em Medidas para estimar calorias.');
  const calorias=p('');const atualizar=()=>{const minutos=(Date.now()-t.inicioSegundos)/60000;calorias.textContent=t.pesoSessao?`Calorias estimadas: ${Math.round(5*t.pesoSessao*minutos/60)} kcal`:'Calorias estimadas: —';};atualizar();
  painel.append(info,calorias);
 };
 concluirTreinoDefinitivo=function(){
  const t=estado.treinoAtivo;if(!t)return;
  const h={id:'h-'+Date.now(),data:t.data,titulo:t.titulo,inicio:new Date(t.inicioSegundos).toISOString(),fim:new Date().toISOString(),duracaoMin:Math.max(0,Math.round((Date.now()-t.inicioSegundos)/60000)),seriesConcluidas:t.itens.reduce((n,item)=>n+item.series.filter(s=>s.concluida).length,0),volumeTotalKg:volume(t.itens),pesoCorporal:t.pesoSessao,calorias:t.pesoSessao?Math.round(5*t.pesoSessao*(Date.now()-t.inicioSegundos)/3600000):undefined,itens:structuredClone(t.itens),observacao:document.getElementById('treino-observacao').value};
  estado.historicoTreinos.push(h);estado.ultimoTreinoFinalizadoId=h.id;clearInterval(estado.treinoTimerInterval);clearInterval(estado.descansoTimerInterval);estado.treinoAtivo=null;fecharModais();navegarPara('evolucao');
 };
 window.motorPrototipo={volume,total};

 // Biblioteca: edição local, notas e fotos fictícias, sem upload ou chamadas externas.
 function campo(nome,atual='',tipo='text'){
  const label=document.createElement('label');label.textContent=nome;const input=document.createElement(tipo==='textarea'?'textarea':'input');
  if(tipo!=='textarea')input.type=tipo;input.className='campo-input';input.value=atual??'';label.append(input);return {label,input};
 }
 function editarExercicio(ex){
  const novo=!ex;const dados=ex?structuredClone(ex):{id:'ex-'+Date.now(),nome:'',grupo:'Peito',equipamento:'',tipo:'forca',descansoPadrao:90,alvoReps:12};
  const body=painel(novo?'Novo exercício':'Editar exercício','modal-editor-exercicio-codex');
  const nome=campo('Nome',dados.nome),grupo=campo('Grupo muscular',dados.grupo),equip=campo('Equipamento',dados.equipamento),nota=campo('Nota fixa',dados.nota,'textarea'),instrucoes=campo('Como fazer',dados.instrucoes,'textarea'),musculos=campo('Músculos envolvidos',dados.musculos,'textarea'),video=campo('Link do vídeo',dados.video,'url');
  body.append(nome.label,grupo.label,equip.label);
  const tipo=document.createElement('div');tipo.className='abas-segmentadas';
  ['forca','cardio'].forEach(v=>{const botao=b(v==='forca'?'Força':'Cardio','',()=>{dados.tipo=v;[...tipo.children].forEach(x=>x.setAttribute('aria-pressed',String(x===botao)));});botao.setAttribute('aria-pressed',String(dados.tipo===v));tipo.append(botao);});body.append(tipo);
  const descanso=valor('Descanso padrão',dados.descansoPadrao+'s',()=>escolherNumero('Descanso em segundos',dados.descansoPadrao,0,600,15,v=>{dados.descansoPadrao=v;descanso.textContent='Descanso padrão: '+v+'s';}));
  const alvo=valor('Alvo de repetições',dados.alvoReps??12,()=>escolherNumero('Alvo de repetições',dados.alvoReps??12,1,100,1,v=>{dados.alvoReps=v;alvo.textContent='Alvo de repetições: '+v;}));
  const corporal=document.createElement('label');corporal.className='opcao-checkbox';const check=document.createElement('input');check.type='checkbox';check.checked=!!dados.pesoCorporal;check.onchange=()=>dados.pesoCorporal=check.checked;corporal.append(check,document.createTextNode('Exercício com peso corporal'));
  body.append(descanso,alvo,corporal,nota.label,instrucoes.label,musculos.label,video.label);
  body.append(b('Salvar exercício','botao-principal',()=>{
   if(!nome.input.value.trim()){erro(body,'Informe o nome do exercício.');return;}
   if(video.input.value&&!/^https?:\/\//i.test(video.input.value)){erro(body,'O link deve começar com http:// ou https://.');return;}
   Object.assign(dados,{nome:nome.input.value.trim(),grupo:grupo.input.value.trim(),equipamento:equip.input.value.trim(),nota:nota.input.value,instrucoes:instrucoes.input.value,musculos:musculos.input.value,video:video.input.value});
   if(novo)estado.exerciciosCatalogo.push(dados);else Object.assign(ex,dados);
   fechar('modal-editor-exercicio-codex');renderizarTela();
  }));abrirModal('modal-editor-exercicio-codex');
 }
 abrirModalNovoExercicio=()=>editarExercicio();
 abrirAjudaExercicio=function(id){
  const ex=estado.exerciciosCatalogo.find(e=>e.id===id);if(!ex)return;
  const body=painel(ex.nome,'modal-ajuda-completa-codex');
  body.append(p(ex.grupo+' · '+ex.equipamento),p('Nota: '+(ex.nota||'Sem nota')),p('Como fazer: '+(ex.instrucoes||'Sem instruções cadastradas')),p('Músculos: '+(ex.musculos||ex.grupo)),p('Vídeo: '+(ex.video||'Sem link preferido — busca no YouTube disponível no app real.')));
  body.append(b('Editar exercício','botao-secundario',()=>editarExercicio(ex)));
  const upload=campo('Adicionar foto fictícia para esta demonstração','','file');upload.input.accept='image/jpeg,image/png,image/webp';
  upload.input.onchange=async()=>{
   const file=upload.input.files[0];if(!file)return;
   if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){erro(body,'Use JPEG, PNG ou WebP de até 5 MB.');return;}
   const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.readAsDataURL(file);}).catch(e=>{erro(body,e.message);return null;});
   if(url){(ex.fotos??=[]).push(url);fechar('modal-ajuda-completa-codex');abrirAjudaExercicio(id);}
  };body.append(upload.label,p('As imagens ficam apenas na memória do protótipo. Use arquivos fictícios.'));
  (ex.fotos??[]).forEach((foto,i)=>{const img=document.createElement('img');img.src=foto;img.alt='Foto demonstrativa do exercício';img.style.maxWidth='100%';body.append(img,b('Remover foto '+(i+1),'botao-destrutivo',()=>{ex.fotos.splice(i,1);fechar('modal-ajuda-completa-codex');abrirAjudaExercicio(id);}));});
  body.append(b('Remover exercício','botao-destrutivo',()=>{
   if(estado.fichas.some(f=>f.itens.some(item=>item.exercicioId===id))){erro(body,'Remova este exercício das fichas antes de excluí-lo.');return;}
   estado.exerciciosCatalogo=estado.exerciciosCatalogo.filter(e=>e.id!==id);fechar('modal-ajuda-completa-codex');renderizarTela();exibirToastGeral('Exercício removido nesta demonstração.');
  }));abrirModal('modal-ajuda-completa-codex');
 };
 const acrescentarAoTreino=adicionarExercicioAoTreinoAtivo;
 adicionarExercicioAoTreinoAtivo=function(id){acrescentarAoTreino(id);const ex=estado.exerciciosCatalogo.find(e=>e.id===id);if(ex?.pesoCorporal){estado.treinoAtivo.itens.filter(item=>item.exercicioId===id).forEach(item=>item.series.forEach(s=>s.modoCarga='peso_corporal'));renderizarExerciciosTreinoAtivo();}};

 // Cardio mantém campos específicos da modalidade; valores ausentes não viram defaults.
 const modalidades=[['corrida','Corrida'],['caminhada','Caminhada'],['esteira','Esteira'],['bicicleta','Bicicleta'],['ciclismo','Ciclismo'],['spinning','Spinning'],['airbike','Airbike'],['eliptico','Elíptico'],['escada','Escada'],['remo','Remo'],['ski','Ski'],['natacao','Natação'],['outro','Outro']];
 function camposCardio(tipo){const bike=['bicicleta','ciclismo','spinning','airbike'].includes(tipo);return [...(tipo!=='escada'&&tipo!=='outro'?['distanciaKm','velocidade']:[]),...(tipo==='esteira'?['inclinacao']:[]),...(['corrida','caminhada','esteira','escada'].includes(tipo)?['passos']:[]),...(bike?['cadencia','potencia']:[]),...(tipo==='natacao'?['comprimentos','piscina']:[])];}
 const descCardio={duracaoMin:['Duração (min)',1440],distanciaKm:['Distância (km)',1000],velocidade:['Velocidade média (km/h)',150],inclinacao:['Inclinação (%)',50],passos:['Passos da sessão',200000],cadencia:['Cadência (rpm)',300],potencia:['Potência (W)',3000],comprimentos:['Comprimentos nadados',10000],piscina:['Comprimento da piscina (m)',100],calorias:['Calorias informadas (kcal)',20000],fcMedia:['FC média (bpm)',250],fcMax:['FC máxima (bpm)',250]};
 function editorCardio(sessao){
  const d=sessao?structuredClone(sessao):{id:'c-'+Date.now(),tipo:'corrida',data:'2026-10-22'};
  if(!modalidades.some(([id])=>id===d.tipo))d.tipo='corrida';
  const desenhar=()=>{
   const body=painel(sessao?'Editar cardio':'Registrar cardio','modal-cardio-completo-codex');
   const tipo=document.createElement('select');tipo.className='campo-input';const lbl=document.createElement('label');lbl.textContent='Modalidade';lbl.append(tipo);modalidades.forEach(([id,nome])=>{const o=new Option(nome,id,id===d.tipo,id===d.tipo);tipo.append(o);});
   tipo.onchange=()=>{d.tipo=tipo.value;desenhar();};body.append(lbl);
   const data=campo('Data',d.data,'date');data.input.onchange=()=>d.data=data.input.value;body.append(data.label,p('Duração obrigatória. Os demais campos são opcionais.'));
   let minutos=Math.floor(d.duracaoMin??0),segundos=Math.round(((d.duracaoMin??0)-minutos)*60);
   if(segundos===60){minutos++;segundos=0;}
   const min=campo('Duração (min)',String(minutos),'number'),seg=campo('Segundos',String(segundos),'number');
   min.input.min=0;min.input.max=1440;seg.input.min=0;seg.input.max=59;min.input.inputMode=seg.input.inputMode='numeric';
   const atualizarDuracao=()=>{minutos=Number(min.input.value);segundos=Number(seg.input.value);d.duracaoMin=minutos+segundos/60;};
   min.input.oninput=seg.input.oninput=atualizarDuracao;body.append(min.label,seg.label);
   const permitidos=['duracaoMin',...camposCardio(d.tipo),'calorias','fcMedia','fcMax'];
   for(const key of permitidos.filter(k=>k!=='duracaoMin')){const [nome]=descCardio[key];const f=campo(nome,d[key]===undefined?'':String(d[key]).replace('.',','));f.input.inputMode=['passos','comprimentos'].includes(key)?'numeric':'decimal';f.input.oninput=()=>{const txt=f.input.value.trim();d[key]=txt?Number(txt.replace(',','.')):undefined;};body.append(f.label);}
   if(permitidos.includes('passos'))body.append(p('Passos desta sessão não são somados ao total diário.'));
   const vinculo=document.createElement('select');vinculo.className='campo-input';vinculo.append(new Option('Sem vínculo',''));estado.historicoTreinos.filter(t=>t.data===d.data).forEach(t=>vinculo.append(new Option(t.titulo,t.id)));vinculo.value=d.treinoId??'';vinculo.onchange=()=>d.treinoId=vinculo.value||undefined;const rotulo=document.createElement('label');rotulo.textContent='Vincular a treino';rotulo.append(vinculo);body.append(rotulo);
   const obs=campo('Observação',d.obs,'textarea');obs.input.oninput=()=>d.obs=obs.input.value;body.append(obs.label,b('Salvar cardio','botao-principal',()=>{
    if(!Number.isInteger(minutos)||!Number.isInteger(segundos)||minutos<0||segundos<0||segundos>59){erro(body,'Informe minutos inteiros e segundos entre 0 e 59.');return;}
    if(d.fcMedia!==undefined&&d.fcMax!==undefined&&d.fcMedia>d.fcMax){erro(body,'A FC média não pode superar a FC máxima.');return;}
    if(['passos','comprimentos'].some(k=>d[k]!==undefined&&!Number.isInteger(d[k]))){erro(body,'Passos e comprimentos devem ser números inteiros.');return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.data)||!Number.isFinite(d.duracaoMin)||d.duracaoMin<=0||d.duracaoMin>1440){erro(body,'Confira a data e informe uma duração válida.');return;}
    for(const key of permitidos){if(d[key]!==undefined&&(!Number.isFinite(d[key])||d[key]<0||d[key]>descCardio[key][1])){erro(body,'Confira '+descCardio[key][0]+'.');return;}}
    const salvo={...d};Object.keys(descCardio).filter(key=>!permitidos.includes(key)).forEach(key=>delete salvo[key]);
    const idx=estado.sessoesCardio.findIndex(s=>s.id===salvo.id);if(idx<0)estado.sessoesCardio.push(salvo);else estado.sessoesCardio[idx]=salvo;
    fechar('modal-cardio-completo-codex');estado.telaAtual='treino';estado.secaoTreino='cardio';renderizarTela();
   }));
  };desenhar();abrirModal('modal-cardio-completo-codex');
 }
 abrirEditorCardio=()=>editorCardio();
 function paginaCardio(){
  const wrapper=document.createElement('div');wrapper.className='formulario pagina-cardio-codex';
  const duracao=v=>{const segundos=Math.round(v*60),m=Math.floor(segundos/60),s=segundos%60;return `${m.toLocaleString('pt-BR')} min${s?' '+s+' s':''}`;};
  wrapper.append(b('Registrar cardio','botao-principal',()=>editorCardio()));
  const total=estado.sessoesCardio.reduce((n,s)=>n+s.duracaoMin,0),resumo=p(`${estado.sessoesCardio.length} ${estado.sessoesCardio.length===1?'sessão registrada':'sessões registradas'} · ${duracao(total)} no total`);resumo.classList.add('cardio-contagem');wrapper.append(resumo);
  estado.sessoesCardio.forEach(s=>{
   const card=document.createElement('details');card.className='painel-card cardio-sessao-codex';const sum=document.createElement('summary');
   const icone=document.createElement('span');icone.className='cardio-icone';icone.setAttribute('aria-hidden','true');icone.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>';
   const nomes=document.createElement('span');nomes.className='cardio-titulos';const nome=document.createElement('strong');nome.textContent=modalidades.find(([id])=>id===s.tipo)?.[1]??s.tipo;const data=document.createElement('small');data.textContent=formatarDataBr(s.data);nomes.append(nome,data);
   const tempo=document.createElement('span');tempo.className='cardio-tempo';tempo.textContent=duracao(s.duracaoMin);const seta=document.createElement('span');seta.className='cardio-seta';seta.textContent='⌄';seta.setAttribute('aria-hidden','true');sum.append(icone,nomes,tempo,seta);card.append(sum);
   const conteudo=document.createElement('div');conteudo.className='cardio-conteudo';const metricas=document.createElement('div');metricas.className='cardio-metricas';
   const campos={distanciaKm:['Distância','km'],calorias:['Calorias informadas','kcal'],fcMedia:['FC média','bpm'],fcMax:['FC máxima','bpm'],velocidade:['Velocidade média','km/h'],inclinacao:['Inclinação','%'],passos:['Passos',''],cadencia:['Cadência','rpm'],potencia:['Potência','W'],comprimentos:['Comprimentos',''],piscina:['Piscina','m']};
   for(const [key,[rotulo,unidade]] of Object.entries(campos))if(Number.isFinite(s[key])){const bloco=document.createElement('div'),label=document.createElement('span'),valor=document.createElement('strong'),unit=document.createElement('small');label.textContent=rotulo;valor.textContent=s[key].toLocaleString('pt-BR');unit.textContent=unidade;valor.append(document.createTextNode(' '),unit);bloco.append(label,valor);metricas.append(bloco);}
   conteudo.append(metricas);if(s.obs)conteudo.append(p(s.obs));if(!metricas.children.length)conteudo.append(p('Sem métricas adicionais nesta sessão.'));
   const acoes=document.createElement('div');acoes.className='cardio-acoes';
   acoes.append(b('Editar cardio','botao-secundario',()=>editorCardio(s)),b('Remover cardio','botao-destrutivo',()=>{estado.sessoesCardio=estado.sessoesCardio.filter(x=>x.id!==s.id);renderizarTela();const body=painel('Cardio removido','modal-desfazer-cardio-codex');body.append(b('Desfazer','botao-secundario',()=>{estado.sessoesCardio.push(s);fechar('modal-desfazer-cardio-codex');renderizarTela();}));abrirModal('modal-desfazer-cardio-codex');}));
   const compartilhar=b('Compartilhar adesivo','botao-secundario',()=>abrirModalCardsCompartilhaveis(s));compartilhar.classList.add('cardio-compartilhar');acoes.append(compartilhar);conteudo.append(acoes);card.append(conteudo);wrapper.append(card);
  });return wrapper;
 };
 const telaAnterior=renderizarTela;
 renderizarTela=function(){telaAnterior();if(estado.telaAtual==='treino'&&estado.secaoTreino==='cardio')document.getElementById('secao-treino-conteudo')?.replaceChildren(paginaCardio());};
 window.abrirCardioCompletoPrototipo=editorCardio;

 // Configuração e atividade diária demonstráveis, sem editar o dispositivo/conta reais.
 const preferencias={meta_passos_util:8000,meta_passos_fds_feriado:6000,meta_calorias_gastas_util:500,meta_calorias_gastas_fds_feriado:400,meta_cardio_min_semana:150,fator_calorias_cardio:100,dia_medidas:6,dias_backup:7,modo_calorias:'total_manual'};
 const atividade=[];const feriados=[];
 const configCampos=[['meta_passos_util','Passos · dias úteis',200000],['meta_passos_fds_feriado','Passos · fins de semana/feriados',200000],['meta_calorias_gastas_util','Calorias · dias úteis',20000],['meta_calorias_gastas_fds_feriado','Calorias · fins de semana/feriados',20000],['meta_cardio_min_semana','Cardio por semana (min)',10080],['fator_calorias_cardio','Ajuste de calorias do cardio (%)',200],['dia_medidas','Dia de medidas (0 domingo a 6 sábado)',6],['dias_backup','Lembrete de backup (dias, 0 desliga)',365]];
 function editorPreferencias(){
  const body=painel('Metas e lembretes','modal-preferencias-codex');const campos={};
  configCampos.forEach(([key,nome,max])=>{const f=campo(nome,preferencias[key],'number');f.input.min=0;f.input.max=max;f.input.inputMode='numeric';campos[key]=f.input;body.append(f.label);});
  const modo=document.createElement('select');modo.className='campo-input';modo.append(new Option('Total diário do relógio (sem somar novamente)','total_manual'),new Option('Somar treino, cardio e atividade extra','somar_registros'));modo.value=preferencias.modo_calorias;const label=document.createElement('label');label.textContent='Como contar calorias';label.append(modo);body.append(label);
  body.append(b('Salvar metas e lembretes','botao-principal',()=>{
   for(const [key,nome,max] of configCampos){const v=Number(campos[key].value);if(!campos[key].value.trim()||!Number.isInteger(v)||v<0||v>max){erro(body,'Confira '+nome+'.');return;}}
   configCampos.forEach(([key])=>preferencias[key]=Number(campos[key].value));preferencias.modo_calorias=modo.value;fechar('modal-preferencias-codex');renderizarTela();
  }),b('Feriados e dias de descanso','botao-secundario',editorFeriados));abrirModal('modal-preferencias-codex');
 }
 function editorFeriados(){
  const body=painel('Feriados e descanso','modal-feriados-codex');const data=campo('Data','','date'),nome=campo('Nome');body.append(data.label,nome.label,b('Adicionar data','botao-principal',()=>{
   if(!data.input.value||!nome.input.value.trim()){erro(body,'Informe a data e o nome.');return;}
   if(feriados.some(f=>f.data===data.input.value)){erro(body,'Já existe um descanso nesta data.');return;}
   feriados.push({data:data.input.value,nome:nome.input.value.trim()});fechar('modal-feriados-codex');editorFeriados();
  }));feriados.forEach((f,i)=>body.append(p(formatarDataBr(f.data)+' · '+f.nome),b('Remover '+f.nome,'botao-destrutivo',()=>{feriados.splice(i,1);fechar('modal-feriados-codex');editorFeriados();})));abrirModal('modal-feriados-codex');
 }
 function editorAtividade(registro){
  const edicaoDireta=Boolean(registro);
  if(!registro)registro=atividade.find(a=>a.data==='2026-10-22');
  const body=painel('Atividade do dia','modal-atividade-codex');const data=campo('Data',registro?.data??'2026-10-22','date'),passos=campo('Passos do dia',registro?.passos??0,'number'),calorias=campo(preferencias.modo_calorias==='total_manual'?'Calorias totais do relógio':'Calorias de atividade extra',registro?.calorias??0,'number');passos.input.inputMode='numeric';calorias.input.inputMode='numeric';
  data.input.max=new Date().toLocaleDateString('sv-SE');
  if(!edicaoDireta)data.input.onchange=()=>{
   registro=atividade.find(a=>a.data===data.input.value);
   passos.input.value=String(registro?.passos??0);calorias.input.value=String(registro?.calorias??0);
  };
  body.append(p('Escolha o dia a que os passos e as calorias pertencem. Você pode registrar dias anteriores.'));
  body.append(data.label,passos.label,calorias.label,p(preferencias.modo_calorias==='total_manual'?'Informe o total diário; treino e cardio não serão somados novamente.':'Informe somente o extra para não contar treino/cardio duas vezes.'),b('Salvar atividade','botao-principal',()=>{
   const pa=Number(passos.input.value),ca=Number(calorias.input.value),dia=new Date(data.input.value+'T12:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.input.value)||!Number.isFinite(dia.getTime())||dia.toLocaleDateString('sv-SE')!==data.input.value||data.input.value>data.input.max||!Number.isInteger(pa)||pa<0||pa>200000||!Number.isFinite(ca)||ca<0||ca>20000){erro(body,'Confira a data (até hoje), os passos e as calorias.');return;}
   const existente=atividade.find(a=>a.data===data.input.value);if(existente&&existente!==registro){erro(body,'Já existe atividade nesta data. Edite pelo histórico.');return;}
   const salvar=()=>{const d={data:data.input.value,passos:pa,calorias:ca};if(registro)Object.assign(registro,d);else atividade.push(d);fechar('modal-atividade-codex');if(document.getElementById('modal-historico-atividade-codex')?.classList.contains('aberto'))fechar('modal-historico-atividade-codex');renderizarTela();};
   if(edicaoDireta&&registro&&registro.data!==data.input.value){const confirmacao=painel('Corrigir data?','modal-data-atividade-codex');confirmacao.append(p(`Mover o registro de ${formatarDataBr(registro.data)} para ${formatarDataBr(data.input.value)}?`),b('Confirmar mudança de data','botao-principal',()=>{fechar('modal-data-atividade-codex');salvar();}));abrirModal('modal-data-atividade-codex');}else salvar();
  }));abrirModal('modal-atividade-codex');
 }
 function historicoAtividade(){
  const body=painel('Histórico de atividade','modal-historico-atividade-codex');body.append(b('Registrar outro dia','botao-principal',()=>editorAtividade()));
  const filtro=document.createElement('select');filtro.className='campo-input';filtro.setAttribute('aria-label','Período');filtro.append(new Option('Todos os meses',''));
  [...new Set(atividade.map(a=>a.data.slice(0,7)))].sort().reverse().forEach(m=>filtro.append(new Option(m.slice(5)+'/'+m.slice(0,4),m)));
  const label=document.createElement('label');label.textContent='Período';label.append(filtro);
  const lista=document.createElement('div');lista.className='formulario';lista.dataset.historicoAtividade='';const status=p('');status.setAttribute('role','status');
  let pagina=0;const anterior=b('Anterior','botao-secundario',()=>{pagina--;desenhar();}),proxima=b('Próxima','botao-secundario',()=>{pagina++;desenhar();});
  const navegacao=document.createElement('div');navegacao.className='grade-dupla';navegacao.append(anterior,proxima);body.append(label,lista,status,navegacao);
  function desenhar(){
   const registros=atividade.filter(a=>!filtro.value||a.data.startsWith(filtro.value)).sort((a,b)=>b.data.localeCompare(a.data)),paginas=Math.max(1,Math.ceil(registros.length/10));pagina=Math.max(0,Math.min(pagina,paginas-1));lista.replaceChildren();
   for(const a of registros.slice(pagina*10,pagina*10+10)){
    const item=document.createElement('details');item.className='painel-card';const resumo=document.createElement('summary');resumo.textContent=`${formatarDataBr(a.data)} · ${a.passos} passos · ${a.calorias} kcal`;
    const acoes=document.createElement('div');acoes.className='acoes-historico-atividade';
    const editar=b('Editar','botao-secundario',()=>editorAtividade(a)),remover=b('Remover','botao-destrutivo',()=>{atividade.splice(atividade.indexOf(a),1);desenhar();});
    editar.setAttribute('aria-label','Editar '+formatarDataBr(a.data));remover.setAttribute('aria-label','Remover '+formatarDataBr(a.data));
    acoes.append(editar,remover);item.append(resumo,acoes);lista.append(item);
   }
   if(!registros.length)lista.append(p('Nenhum registro de atividade neste período.'));
   status.textContent=`${registros.length} registros · Página ${pagina+1} de ${paginas}`;anterior.disabled=pagina===0;proxima.disabled=pagina>=paginas-1;navegacao.hidden=paginas===1;
  }
  filtro.onchange=()=>{pagina=0;desenhar();};desenhar();abrirModal('modal-historico-atividade-codex');
 }
 const telaComCardio=renderizarTela;
 renderizarTela=function(){
  telaComCardio();const root=document.getElementById('app-corpo');
  if(estado.telaAtual==='configuracoes'){
   const card=document.createElement('section');card.className='painel-card formulario';const h=document.createElement('h2');h.textContent='Cardio, movimento e lembretes';card.append(h,p('Metas por dia, ajuste de calorias, feriados e intervalos dos lembretes.'),b('Configurar metas e lembretes','botao-secundario',editorPreferencias),b('Ver atividade diária','botao-secundario',historicoAtividade));root.append(card);
   const aparelho=document.createElement('details');aparelho.className='painel-card';const titulo=document.createElement('summary');titulo.textContent='Seu aparelho e instalação';aparelho.append(titulo,p('Protótipo isolado: dados apenas na memória, sem instalação ou sincronização real.'),p('No app: Safari → Compartilhar → Adicionar à Tela de Início. Cada endereço e perfil possui armazenamento separado.'));root.append(aparelho);
  }
  if(estado.telaAtual==='hoje'){
   const card=document.createElement('section');card.className='painel-card formulario';const h=document.createElement('h2');h.textContent='Seu movimento';const atual=atividade.find(a=>a.data==='2026-10-22');card.append(h,p(atual?`${atual.passos} passos · ${atual.calorias} kcal registradas`:'Ainda sem atividade registrada hoje.'),b('Registrar atividade','botao-principal',()=>editorAtividade()),b('Histórico de atividade','botao-secundario',historicoAtividade));root.querySelector('.grade-dupla')?.replaceWith(card);
  }
 };
 window.estadoLocalPrototipo={preferencias,atividade,feriados};
 // Estes painéis não possuem backend. Não anunciar operações remotas como reais.
 for(const [nome,id] of [['renderizarConteudoModalConta','corpo-modal-conta'],['renderizarConteudoModalPrivacidade','corpo-modal-privacidade']]){
  const original=window[nome];
  window[nome]=function(){
   original();const corpo=document.getElementById(id);
   if(corpo){const aviso=p('Demonstração visual: nenhuma conta, senha, fila, nuvem ou banco real é alterado. Use somente dados fictícios.');aviso.className='aviso-banner';aviso.setAttribute('role','note');corpo.prepend(aviso);}
  };
 }
 const toastOriginal=exibirToastGeral;
 const mensagensDemonstracao=new Map([
  ['Login efetuado com sucesso!','Simulação de entrada concluída. Não houve autenticação.'],
  ['Conta criada com sucesso! Verifique seu e-mail para confirmação.','Simulação de cadastro concluída. Nenhuma conta foi criada e nenhum e-mail foi enviado.'],
  ['Senha redefinida com sucesso!','Simulação concluída. Nenhuma senha foi alterada.'],
  ['Conta excluída com sucesso dos servidores.','Simulação concluída. Nenhuma conta ou dado remoto foi excluído.'],
  ['Armazenamento deste aparelho limpo com sucesso.','Simulação de limpeza concluída. Nenhum banco do navegador foi apagado.'],
  ['Registros do armazenamento legado removidos.','Simulação concluída. O banco legado real permanece intacto.']
 ]);
 exibirToastGeral=function(texto){toastOriginal(mensagensDemonstracao.get(texto)??texto);};
})();
