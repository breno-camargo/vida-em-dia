// Gate de preservação. Usa perfis descartáveis; nunca modifica fontes ou dados pessoais.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {PNG}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2];
if(!['antes','depois'].includes(mode))throw new Error('Use: node revisao/lote-2.1/gate.cjs antes|depois');
const out=path.join(root,'../vida-em-dia-evidencias/revisao/lote-2.1',mode);fs.mkdirSync(out,{recursive:true});
const allowedNew=new Set(fs.existsSync(path.join(__dirname,'tokens-propostos.json'))?JSON.parse(fs.readFileSync(path.join(__dirname,'tokens-propostos.json'))).map(t=>t.name):[]);
const result={mode,viewport:{width:390,height:844},normal:[],states:[],failures:[],allowedNewTokens:[...allowedNew],stateMethod:'Um controle por vez; CSS.forcePseudoState via CDP; todos os estilos de todos os elementos visíveis são comparados em cada estado. Sem clicks ou alterações de atributos disabled.'};
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const write=(f,data)=>fs.writeFileSync(path.join(out,f),zlib.gzipSync(JSON.stringify(data)));
const readBefore=f=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'antes',f))));
function pixels(a,b){a=PNG.sync.read(a);b=PNG.sync.read(b);if(a.width!==b.width||a.height!==b.height)throw new Error('Dimensões PNG diferentes');let count=0;for(let i=0;i<a.data.length;i+=4)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3])count++;return count;}
async function snapshot(page,delta=false){return page.evaluate(({newNames,delta})=>{
 const skip=new Set(newNames),rows=[],controls=[];
 const key=e=>{const a=[];for(let n=e;n&&n.nodeType===1;n=n.parentElement)a.unshift(n.localName+':nth-child('+([...n.parentNode.children].indexOf(n)+1)+')');return a.join('>')};
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||!r.height||s.display==='none'||s.visibility!=='visible')return false;let x=Math.max(0,r.left),y=Math.max(0,r.top),right=Math.min(innerWidth,r.right),bottom=Math.min(innerHeight,r.bottom);for(let p=e.parentElement;p;p=p.parentElement){const ps=getComputedStyle(p),pr=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(ps.overflowX)){x=Math.max(x,pr.left);right=Math.min(right,pr.right)}if(/hidden|clip|auto|scroll/.test(ps.overflowY)){y=Math.max(y,pr.top);bottom=Math.min(bottom,pr.bottom)}}return right>x&&bottom>y};
 const style=s=>Object.fromEntries([...s].filter(p=>!skip.has(p)).sort().map(p=>[p,s.getPropertyValue(p)]));
 for(const e of document.querySelectorAll('*')){if(!visible(e))continue;const k=key(e),s=getComputedStyle(e);rows.push({key:k,style:style(s)});
  for(const pseudo of ['::before','::after','::placeholder','::marker','::backdrop']){if(pseudo==='::placeholder'&&!e.matches('input[placeholder],textarea[placeholder]'))continue;if(pseudo==='::marker'&&s.display!=='list-item')continue;if(pseudo==='::backdrop'&&!e.matches('dialog[open]'))continue;const ps=getComputedStyle(e,pseudo);if((pseudo==='::before'||pseudo==='::after')&&(ps.content==='none'||ps.content==='normal'))continue;rows.push({key:k+pseudo,style:style(ps)})}
  if(e.matches('button,input,textarea,select'))controls.push({key:k,tag:e.localName,text:(e.getAttribute('aria-label')||e.textContent||e.getAttribute('placeholder')||'').trim().slice(0,80),category:e.closest('.navegacao')?'navegacao':e.closest('.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor')?'segmented':e.matches('input,textarea,select')?'campo':'botao'});
 }
 const current=Object.fromEntries(rows.map(r=>[r.key,r.style]));
 if(!delta){window.__gateReference=current;return {rows,controls}}
 const base=window.__gateReference,changes=[];for(const k of [...new Set([...Object.keys(base),...Object.keys(current)])].sort()){const a=base[k],b=current[k];if(!a||!b){changes.push({key:k,missing:!b,style:b||null});continue}const props={};for(const p of [...new Set([...Object.keys(a),...Object.keys(b)])].sort())if(a[p]!==b[p])props[p]=b[p]??null;if(Object.keys(props).length)changes.push({key:k,properties:props})}return changes;
 },{newNames:[...allowedNew],delta});}
function mismatch(a,b){const changes=[];if(Array.isArray(a)&&Array.isArray(b)){const am=new Map(a.map(x=>[x.key,x])),bm=new Map(b.map(x=>[x.key,x]));for(const k of new Set([...am.keys(),...bm.keys()])){const av=am.get(k),bv=bm.get(k);if(JSON.stringify(av)!==JSON.stringify(bv))changes.push({key:k,before:av,after:bv});if(changes.length===5)break}}return changes;}
const gate={capture:async(page,theme,name)=>{
 const id=theme+'-'+name,png=await page.screenshot({animations:'disabled',caret:'hide'}),baseline=fs.readFileSync(path.join(root,'revisao/baseline',id+'.png')),pixelDiff=pixels(png,baseline);
 fs.writeFileSync(path.join(out,id+'.png'),png);const normal=await snapshot(page);let styleDiff=0;
 if(mode==='antes')write(id+'-normal.json.gz',normal);else{const previous=readBefore(id+'-normal.json.gz');if(hash(previous)!==hash(normal)){styleDiff=1;fs.writeFileSync(path.join(out,id+'-diferencas.json'),JSON.stringify(mismatch(previous.rows,normal.rows),null,2))}}
 if(mode==='depois'&&name==='hoje'){
  result.newTokensComputed??={};result.newTokensComputed[theme]=await page.evaluate(names=>Object.fromEntries(names.map(n=>[n,getComputedStyle(document.documentElement).getPropertyValue(n).trim()])),[...allowedNew]);
  fs.writeFileSync(path.join(out,'novos-tokens-computados.json'),JSON.stringify(result.newTokensComputed,null,2));
 }
 result.normal.push({id,pixelDiff,styleDiff,elements:normal.rows.length,controls:normal.controls.length,sha256:hash(normal)});
 if(pixelDiff||styleDiff)throw new Error('GATE: '+id+' pixels='+pixelDiff+' estilos='+styleDiff);
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument');const states=[];const forced={hover:['hover'],active:['active'],'focus-visible':['focus','focus-visible'],disabled:['disabled']};
 try{for(const target of normal.controls){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:target.key});if(!nodeId)throw new Error('GATE: controle não encontrado '+target.key);
  for(const [state,classes]of Object.entries(forced)){await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:classes});const matches=await page.locator(target.key).evaluate((e,s)=>e.matches(':'+s),state);if(!matches)throw new Error('GATE: estado não aplicado '+state);const delta=await snapshot(page,true);const entry={target,state,delta,hash:hash(delta)};states.push(entry);const log={id,category:target.category,target:target.key,state,matched:matches,sha256:entry.hash,diff:0};if(mode==='depois'){const expected=gate.beforeStates.find(s=>s.target.key===target.key&&s.state===state);if(!expected||expected.hash!==entry.hash){log.diff=1;result.states.push(log);fs.writeFileSync(path.join(out,id+'-estado-diferencas.json'),JSON.stringify({expected,actual:entry},null,2));throw new Error('GATE: diferença no estado '+id+' '+state+' '+target.text)}}result.states.push(log);await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});}
 }}finally{await cdp.detach()}
 if(mode==='antes')write(id+'-estados.json.gz',states);
 console.log('GATE '+mode+' '+id+': pixels=0; estilos=0; '+states.length+' estados; '+normal.rows.length+' elementos/pseudoelementos');
 },beforeStates:[]};
const capture=gate.capture;gate.capture=async(page,theme,name)=>{if(mode==='depois')gate.beforeStates=readBefore(theme+'-'+name+'-estados.json.gz');try{return await capture(page,theme,name)}catch(e){result.failures.push({theme,name,error:e.stack});throw e}finally{fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(result,null,2))}};
let source=fs.readFileSync(path.join(root,'revisao/baseline/capturar.cjs'),'utf8');
source=source.replace('const dir=__dirname, origin=',"const dir=path.join(__dirname,'"+mode+"'), origin=");
const start=source.indexOf(' const shot=async(name)=>'),end=source.indexOf('\n const step=',start);if(start<0||end<0)throw new Error('Percurso baseline não reconhecido');
source=source.slice(0,start)+" const shot=async(name)=>{await page.waitForTimeout(150);await gate.capture(page,theme,name);manifest.screens.push({theme,name})};"+source.slice(end);
const stepStart=source.indexOf(' const step=async'),stepEnd=source.indexOf('\n if(theme',stepStart);source=source.slice(0,stepStart)+' const step=async(name,fn)=>{await fn()};'+source.slice(stepEnd);
source=source.replace("(async()=>{const browser=", "return (async()=>{const browser=");
new Function('require','__dirname','gate',source)(require,__dirname,gate).then(()=>{if(result.normal.length!==72||result.failures.length)throw new Error('GATE incompleto');console.log('GATE completo: 72/72; '+result.states.length+' estados');}).catch(e=>{result.failures.push({fatal:e.stack});fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(result,null,2));console.error(e);process.exitCode=1});
