/* Arquivos exclusivamente do protótipo. Nunca ler bancos/backup do aplicativo real. */
(() => {
 const {painel,criarBotao:b}=window.uiPrototipo;
 const chaves=['fichas','exerciciosCatalogo','medidas','sessoesCardio','historicoTreinos'];
 const limite=250*1024*1024;
 const json=v=>JSON.stringify(v);
 const encoder=new TextEncoder();
 const base64=bytes=>{let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str);};
 const bytes=txt=>Uint8Array.from(atob(txt),c=>c.charCodeAt(0));
 const mensagem=texto=>{const p=document.createElement('p');p.textContent=texto;p.className='nota-explicativa';return p;};
 function erro(body,e){const p=mensagem(e instanceof Error?e.message:String(e));p.setAttribute('role','alert');body.append(p);}
 function campo(nome,tipo='text'){const label=document.createElement('label');label.textContent=nome;const input=document.createElement('input');input.type=tipo;input.className='campo-input';label.append(input);return {label,input};}
 function opcao(nome,checked=false){const label=document.createElement('label');label.className='opcao-checkbox';const input=document.createElement('input');input.type='checkbox';input.checked=checked;label.append(input,document.createTextNode(nome));return {label,input};}
 function snapshot(fotos,removidos){
  const dados={};chaves.forEach(key=>{dados[key]=structuredClone(estado[key]).filter(r=>removidos||(!r.apagado_em&&!r.eliminado_em));});
  if(!fotos)dados.exerciciosCatalogo.forEach(ex=>delete ex.fotos);
  return {formato:'vida-em-dia-prototipo-dados',versao:1,criado_em:new Date().toISOString(),dados,removidos:removidos?structuredClone(estado.itensRemovidos):[],fotos};
 }
 async function derivar(senha,salt,usos){const material=await crypto.subtle.importKey('raw',encoder.encode(senha),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,usos);}
 async function cifrar(payload,senha){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const header={formato:'vida-em-dia-prototipo-cifrado',versao:1,kdf:{nome:'PBKDF2',hash:'SHA-256',iteracoes:600000},salt:base64(salt),iv:base64(iv)};
  const key=await derivar(senha,salt,['encrypt']);const cript=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(json(header))},key,encoder.encode(json(payload)));return {...header,dados:base64(new Uint8Array(cript))};
 }
 async function decifrar(env,senha){
  if(env.formato!=='vida-em-dia-prototipo-cifrado'||env.versao!==1)throw new Error('Formato ou versão não reconhecidos. Use somente arquivos desta demonstração.');
  let salt,iv;try{salt=bytes(env.salt);iv=bytes(env.iv);}catch{throw new Error('Formato ou versão não reconhecidos.');}
  if(env.kdf?.nome!=='PBKDF2'||env.kdf.hash!=='SHA-256'||env.kdf.iteracoes!==600000||salt.length!==16||iv.length!==12)throw new Error('Formato ou versão não reconhecidos.');
  const header={formato:env.formato,versao:env.versao,kdf:env.kdf,salt:env.salt,iv:env.iv};
  let plain;try{const key=await derivar(senha,salt,['decrypt']);plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(json(header))},key,bytes(env.dados));}catch{throw new Error('Senha incorreta ou arquivo alterado.');}
  if(plain.byteLength>limite)throw new Error('O texto decifrado excede 250 MB.');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));
 }
 function validar(payload){if(payload?.formato!=='vida-em-dia-prototipo-dados'||payload.versao!==1||!payload.dados||chaves.some(k=>!Array.isArray(payload.dados[k])))throw new Error('Formato ou versão não reconhecidos. Não importe backups reais neste protótipo.');return payload;}
 let url;
 function arquivoPronto(payload,file){
  const body=painel('Arquivo pronto','modal-arquivo-codex');if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);
  body.append(mensagem('Arquivo demonstrativo do protótipo, incompatível com o app real.'),mensagem(file.name+' · '+Math.ceil(file.size/1024)+' KB'));
  const a=document.createElement('a');a.className='botao-principal largura-total';a.href=url;a.download=file.name;a.textContent='Baixar arquivo';body.append(a,b('Compartilhar','botao-secundario',async()=>{try{if(!navigator.canShare?.({files:[file]})){erro(body,'Compartilhamento indisponível. Use Baixar arquivo.');return;}await navigator.share({files:[file],title:'Demonstração Vida em Dia'});}catch(e){if(e.name!=='AbortError')erro(body,'Não foi possível compartilhar. Use Baixar arquivo.');}}));abrirModal('modal-arquivo-codex');
 }
 abrirModalBackup=function(){
  const body=painel('Backup da demonstração','modal-backup-completo-codex');
  body.append(mensagem('Use dados e senhas fictícios. O arquivo exportado pertence somente a este protótipo; não restaura o app real.'));
  const senha=campo('Senha do backup (mínimo 12 caracteres)','password'),conf=campo('Confirme a senha','password');senha.input.autocomplete=conf.input.autocomplete='new-password';
  const fotos=opcao('Incluir fotos',true),removidos=opcao('Incluir registros removidos e suas fotos',false);
  body.append(senha.label,conf.label,mensagem('Sem a senha, o arquivo criptografado não pode ser recuperado.'),fotos.label,removidos.label);
  const preparar=b('Preparar backup protegido','botao-principal',async()=>{
   if(senha.input.value.length<12||senha.input.value!==conf.input.value){erro(body,'Use ao menos 12 caracteres e confirme a mesma senha.');return;}
   preparar.disabled=true;const secret=senha.input.value;senha.input.value='';conf.input.value='';
   try{const dados=snapshot(fotos.input.checked,removidos.input.checked);const envelope=await cifrar(dados,secret);const file=new File([json(envelope)],'prototipo-backup-criptografado.json',{type:'application/json'});arquivoPronto(dados,file);}catch{erro(body,'Não foi possível gerar o arquivo. Tente novamente.');}finally{preparar.disabled=false;}
  });preparar.disabled=true;const validarSenhas=()=>preparar.disabled=senha.input.value.length<12||senha.input.value!==conf.input.value;senha.input.oninput=validarSenhas;conf.input.oninput=validarSenhas;body.append(preparar);
  const outros=document.createElement('details'),sum=document.createElement('summary');sum.textContent='Outros formatos';outros.append(sum,mensagem('JSON legível e CSV contêm dados pessoais e de saúde sem proteção. Qualquer pessoa com o arquivo poderá ler os dados.'));
  outros.append(b('Exportar JSON sem proteção','botao-secundario',()=>{const dados=snapshot(fotos.input.checked,removidos.input.checked);arquivoPronto(dados,new File([json(dados)],'prototipo-legivel.json',{type:'application/json'}));}));
  outros.append(b('Exportar planilha CSV','botao-secundario',()=>{const dados=snapshot(false,removidos.input.checked);const lines=['data,peso,cintura',...dados.dados.medidas.map(m=>[m.data,m.peso??'',m.cintura??''].join(','))];arquivoPronto(dados,new File([lines.join('\r\n')],'prototipo-medidas.csv',{type:'text/csv;charset=utf-8'}));}));body.append(outros);abrirModal('modal-backup-completo-codex');
 };
 function revisar(payload){
  validar(payload);const body=painel('Revisar importação','modal-importacao-revisao-codex');
  body.append(mensagem('Somente dados fictícios do protótipo. '+chaves.reduce((n,k)=>n+payload.dados[k].length,0)+' registros no arquivo.'));
  const modo=document.createElement('select');modo.className='campo-input';modo.append(new Option('Mesclar','mesclar'),new Option('Substituir neste protótipo','substituir'));const label=document.createElement('label');label.textContent='Modo';label.append(modo);const aceite=opcao('Guardei meu backup e aceito substituir os dados desta demonstração');aceite.label.hidden=true;modo.onchange=()=>aceite.label.hidden=modo.value!=='substituir';
  body.append(label,mensagem('Substituir apaga os dados atuais desta demonstração. No app vinculado, também pausa a sincronização até sua revisão; o protótipo não conecta a nenhuma conta.'),aceite.label,b('Importar agora','botao-principal',()=>{
   if(modo.value==='substituir'&&!aceite.input.checked){erro(body,'Confirme a substituição antes de continuar.');return;}
   for(const key of chaves){
    const antigos=estado[key],novos=structuredClone(payload.dados[key]);
    // Tombstones da sessão não são reativados por arquivos antigos.
    const eliminados=new Set(antigos.filter(x=>x.eliminado_em).map(x=>x.id??x.data));
    const mapa=new Map((modo.value==='mesclar'?antigos:antigos.filter(x=>x.apagado_em||x.eliminado_em)).map(x=>[x.id??x.data,x]));
    for(const x of novos){const id=x.id??x.data,atual=mapa.get(id);if(eliminados.has(id)||atual?.apagado_em)continue;if(!atual||!atual.atualizado_em||String(x.atualizado_em??'')>=atual.atualizado_em)mapa.set(id,x);}
    estado[key]=[...mapa.values()];
   }
   fecharModais();renderizarTela();exibirToastGeral('Arquivo demonstrativo importado.');
  }));abrirModal('modal-importacao-revisao-codex');
 }
 abrirModalImportarBackup=function(){
  const body=painel('Restaurar demonstração','modal-importar-completo-codex');body.append(mensagem('Selecione somente JSON exportado por este protótipo. Não use backups reais.'));
  const f=campo('Arquivo JSON','file');f.input.accept='.json,application/json';body.append(f.label);
  f.input.onchange=async()=>{
   const file=f.input.files[0];if(!file)return;
   try{
    if(file.size>limite)throw new Error('O arquivo excede 250 MB.');const obj=JSON.parse(await file.text());
    if(obj.formato==='vida-em-dia-prototipo-cifrado'){
     const senha=campo('Senha do arquivo','password');senha.input.autocomplete='current-password';
     const abrir=b('Abrir backup','botao-principal',async()=>{abrir.disabled=true;try{const texto=senha.input.value;senha.input.value='';revisar(await decifrar(obj,texto));}catch(e){erro(body,e);}finally{abrir.disabled=false;}});body.append(senha.label,abrir);
    }else revisar(validar(obj));
   }catch(e){erro(body,e);}
  };abrirModal('modal-importar-completo-codex');
 };
 window.backupDemonstracao={snapshot,cifrar,decifrar,validar};
 window.addEventListener('pagehide',()=>{if(url)URL.revokeObjectURL(url);});
})();
