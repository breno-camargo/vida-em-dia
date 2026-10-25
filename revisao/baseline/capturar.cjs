// Evidência visual da Fase 0. Não modifica fontes nem usa dados pessoais.
const {chromium}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname, origin='http://127.0.0.1:5180';
const manifest={date:'2026-10-25',viewport:{width:390,height:844},timezone:'America/Sao_Paulo',locale:'pt-BR',screens:[],limitations:[],errors:[]};
async function snapshot(page){return page.evaluate(()=>{
 const dialog=[...document.querySelectorAll('dialog[open]')].at(-1),scope=dialog||document.querySelector('.app');
 const rgba=s=>{const v=s.match(/[\d.]+/g)?.map(Number);return v&&v.length>=3?[v[0],v[1],v[2],v[3]??1]:null};
 const blend=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
 const bg=e=>{const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);let c=[255,255,255,1],gradient=false;for(const n of chain){const s=getComputedStyle(n);if(s.backgroundImage!=='none')gradient=true;const a=rgba(s.backgroundColor);if(a)c=blend(a,c)}return {color:c,gradient}};
 const lumin=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=lumin(a),y=lumin(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const rows=[];for(const e of scope.querySelectorAll('*')){const s=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||s.visibility==='hidden'||s.display==='none'||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)continue;
  const direct=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();const control=e.matches('button,input,select,textarea,summary,[role=button]');if(!direct&&!control)continue;
  const background=bg(e),fg=rgba(s.color);let opacity=1;for(let n=e;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);if(fg)fg[3]*=opacity;
  const border=rgba(s.borderTopColor),parent=bg(e.parentElement||e);const textContrast=fg?contrast(blend(fg,background.color),background.color):null;
  rows.push({tag:e.tagName,selector:e.tagName.toLowerCase()+(e.classList.length?'.'+[...e.classList].join('.'):''),text:(direct||e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,100),color:s.color,background:s.backgroundColor,effectiveBackground:background.color,gradient:background.gradient,borderColor:s.borderTopColor,borderWidth:s.borderTopWidth,fontSize:s.fontSize,fontWeight:s.fontWeight,opacity,textContrast,borderContrast:border&&parseFloat(s.borderTopWidth)?contrast(blend(border,parent.color),parent.color):null,threshold:parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700)?3:4.5,control,disabled:e.matches(':disabled'),width:r.width,height:r.height,x:r.x,y:r.y});
 }
 return {theme:document.documentElement.dataset.tema,title:document.title,dialog:dialog?.getAttribute('aria-labelledby'),rows,scroll:{main:document.querySelector('main')?.scrollTop,modal:dialog?.querySelector('.conteudo-modal')?.scrollTop},overflow:document.documentElement.scrollWidth>innerWidth};
})}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});manifest.browser=browser.version();
try{for(const theme of ['escuro','claro']){
 const context=await browser.newContext({viewport:manifest.viewport,timezoneId:manifest.timezone,locale:manifest.locale,reducedMotion:'reduce',deviceScaleFactor:1});
 await context.addInitScript(()=>{const D=Date,now=D.parse('2026-10-25T15:00:00Z');window.Date=class extends D{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}});
 await context.route('**/*',r=>{const u=r.request().url();return /^https?:/.test(u)&&new URL(u).origin!==origin?r.abort():r.continue()});
 const page=await context.newPage();page.setDefaultTimeout(6000);await page.coverage.startCSSCoverage({resetOnNavigation:false});page.on('pageerror',e=>manifest.errors.push({theme,message:e.message}));await page.goto(origin);await page.locator('.aviso-modo-visitante').waitFor();
 const nav=tab=>page.locator('.navegacao').getByRole('button',{name:tab,exact:true}).click();
 const close=async()=>{const p=page.locator('dialog[open]').last();await p.getByRole('button',{name:'Fechar painel',exact:true}).click()};
 const shot=async(name)=>{await page.waitForTimeout(150);const filename=`${theme}-${name}`;await page.screenshot({path:path.join(dir,filename+'.png'),animations:'disabled',caret:'hide'});const data=await snapshot(page);fs.writeFileSync(path.join(dir,filename+'.json'),JSON.stringify(data,null,2));manifest.screens.push({theme,name,png:filename+'.png',data:filename+'.json'});console.log('CAPTURA '+filename)};
 const step=async(name,fn)=>{try{await fn()}catch(e){manifest.limitations.push({theme,step:name,message:e.message});console.log('PENDENTE '+name+': '+e.message.split('\n')[0])}};
 if(theme==='claro'){await page.getByRole('button',{name:'Usar tema claro',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.tema==='claro')}
 await shot('hoje');
 await nav('Comida');await shot('comida');
 await nav('Medidas');await shot('medidas-vazia');
 await page.locator('.nova-medida').click();await page.getByRole('dialog',{name:'Registrar medidas',exact:true}).waitFor();await shot('registrar-medidas');
 await step('seletor-medida',async()=>{await page.getByRole('button',{name:/Peso, adicionar/}).click();await shot('medida-peso-rolar');await page.getByRole('button',{name:'Digitar',exact:true}).click();await shot('medida-peso-digitar');await close()});
 await step('seletor-data',async()=>{await page.locator('dialog[open]').last().locator('.data-medida').click();await shot('seletor-data');await close()});
 await close();await nav('Evolução');await shot('evolucao-vazia');
 await nav('Treino');await page.getByRole('button',{name:'Nova ficha',exact:true}).waitFor();await shot('treino-fichas-vazia');
 await page.getByRole('button',{name:'Nova ficha',exact:true}).click();await page.getByRole('dialog',{name:'Nova ficha',exact:true}).waitFor();await shot('nova-ficha-sem-selecao');
 await page.getByLabel('Nome da ficha',{exact:true}).fill('Ficha de referência');await page.locator('.selecionar-exercicio').first().click();await shot('nova-ficha-com-selecao');
 await page.locator('.confirmar-catalogo').getByRole('button',{name:/Adicionar/}).click();await shot('nova-ficha-com-item');
 await page.locator('.item-ficha summary').first().click();await shot('nova-ficha-item-expandido');
 await step('descanso-ficha',async()=>{await page.locator('.item-ficha .botao-descanso').filter({hasText:'Descanso'}).click();await shot('seletor-descanso');await close()});
 await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.locator('dialog[open]').waitFor({state:'hidden'});await shot('treino-fichas');
 await page.getByRole('button',{name:/^Exercícios \(/}).click();await shot('treino-exercicios');
 await step('ajuda-exercicio',async()=>{await page.locator('.abrir-exercicio-catalogo').first().click();await shot('detalhe-exercicio');await close()});
 await page.locator('.abas-treino.tres-abas').getByRole('button',{name:'Cardio',exact:true}).click();await shot('treino-cardio');
 await page.getByRole('button',{name:'Registrar cardio',exact:true}).click();await shot('registrar-cardio');await close();
 await page.getByRole('button',{name:'Minhas fichas',exact:true}).click();await page.getByRole('button',{name:'Iniciar treino',exact:true}).first().click();await page.locator('.treino-em-andamento').waitFor();await shot('treino-ativo');
 await page.locator('.treino-em-andamento .exercicio-recolhivel > summary').first().click();await shot('treino-exercicio-expandido');
 await step('valores-serie',async()=>{await page.locator('.valor-serie').first().click();await shot('seletor-valores-serie');await close()});
 await step('timer-descanso',async()=>{await page.getByRole('button',{name:'Concluir série 1',exact:true}).click();await shot('timer-descanso');const skip=page.getByRole('button',{name:/Pular descanso/});if(await skip.count())await skip.click();else await page.keyboard.press('Escape')});
 await step('resumo-treino',async()=>{await page.getByRole('button',{name:'Ver resumo e finalizar',exact:true}).click();await shot('resumo-treino');await page.getByRole('button',{name:'Voltar ao treino',exact:true}).click()});
 await step('retomar',async()=>{await page.getByRole('button',{name:'Continuar depois',exact:true}).click();await shot('treino-em-andamento')});
 await page.getByRole('button',{name:'Abrir configurações',exact:true}).click();await shot('configuracoes');
 for(const id of ['conta','aparencia','backup','atividade','aparelho','instalar','sobre'])await step('config-'+id,async()=>{await page.locator('#titulo-config-'+id).click();await page.locator('#titulo-config-'+id).scrollIntoViewIfNeeded();await shot('config-'+id)});
 await step('privacidade',async()=>{await page.locator('.privacidade-recolhida > summary').click();await page.locator('.privacidade-recolhida').scrollIntoViewIfNeeded();await shot('privacidade')});
 await page.getByRole('button',{name:'Fechar configurações',exact:true}).click();
 // Dados fictícios adicionais apenas neste contexto descartável.
 await page.evaluate(async()=>{const module=part=>performance.getEntriesByType('resource').find(e=>e.name.includes(part)).name;const {tabela}=await import(module('/src/dados/banco.ts'));const {criarRegistro}=await import(module('/src/dados/repositorio.ts'));await tabela('medidas_corporais').add({...criarRegistro(),data:'2026-10-24',peso:72.5,cintura:81,coxa_d:56});await tabela('treinos').add({...criarRegistro(),data:'2026-10-24',inicio:'2026-10-24T12:00:00Z',fim:'2026-10-24T12:45:00Z',titulo:'Treino de referência',observacao:''});});
 await nav('Medidas');await shot('medidas-preenchida');await nav('Evolução');await shot('evolucao-preenchida');
 manifest.limitations.push({theme,step:'conta-entrada',message:'Supabase é null por configuração deliberada da cópia; entrada/cadastro não alcançáveis sem mudar o ambiente. Capturado config-conta, sem simular backend.'});
 fs.writeFileSync(path.join(dir,theme+'-cobertura-css.json'),JSON.stringify(await page.coverage.stopCSSCoverage(),null,2));await context.close();
}}finally{fs.writeFileSync(path.join(dir,'capturas.json'),JSON.stringify(manifest,null,2));await browser.close()}})().catch(e=>{manifest.errors.push({fatal:e.stack});fs.writeFileSync(path.join(dir,'capturas.json'),JSON.stringify(manifest,null,2));console.error(e);process.exitCode=1});
