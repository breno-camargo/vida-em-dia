const {chromium}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{for(const width of [360,390]){
  const p=await browser.newPage({viewport:{width,height:844}}),erros=[];p.on('pageerror',e=>erros.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
  const card=p.locator('#agua-hoje-codex');assert.equal(await card.getByRole('button',{name:'+1 garrafa',exact:true}).isDisabled(),true);
  await card.getByRole('button',{name:'Configurar minha garrafa',exact:true}).click();
  const tamanho=p.getByLabel('Capacidade da garrafa (ml)',{exact:true});await tamanho.fill('600');await p.getByRole('button',{name:'Salvar garrafa',exact:true}).click();
  for(let i=0;i<3;i++)await card.getByRole('button',{name:'+1 garrafa',exact:true}).click();
  assert.equal(await card.locator('.agua-total').innerText(),'1.800 ml');
  await card.getByRole('button',{name:'Desfazer último lançamento',exact:true}).click();
  await card.getByRole('button',{name:'Meia garrafa',exact:true}).click();assert.equal(await card.locator('.agua-total').innerText(),'1.500 ml');
  await card.getByRole('button',{name:'Alterar minha garrafa',exact:true}).click();await tamanho.fill('750');await p.getByRole('button',{name:'Salvar garrafa',exact:true}).click();
  assert.equal(await card.locator('.agua-total').innerText(),'1.500 ml','Alterar garrafa não recalcula histórico');
  await card.getByRole('button',{name:'+1 garrafa',exact:true}).click();assert.equal(await card.locator('.agua-total').innerText(),'2.250 ml');
  assert.deepEqual(await p.evaluate(()=>aguaPrototipo.lancamentos.map(l=>l.ml)),[600,600,300,750]);
  await card.getByRole('button',{name:'Consultar ou registrar outro dia',exact:true}).click();
  const dia=p.locator('#modal-agua-dia-codex');await dia.getByLabel('Data da água',{exact:true}).fill('2026-10-21');
  await dia.getByRole('button',{name:'+1 garrafa',exact:true}).click();assert.equal(await dia.locator('.agua-total').innerText(),'750 ml');
  await dia.getByRole('button',{name:'Outra quantidade',exact:true}).click();await p.getByLabel('Quantidade (ml)',{exact:true}).fill('125,5');await p.getByRole('button',{name:'Registrar água',exact:true}).click();
  assert.equal(await dia.locator('.agua-total').innerText(),'875,5 ml');
  await dia.getByRole('button',{name:'Desfazer último lançamento',exact:true}).click();assert.equal(await dia.locator('.agua-total').innerText(),'750 ml');
  await dia.getByRole('button',{name:'Fechar Água por dia',exact:true}).click();assert.equal(await card.locator('.agua-total').innerText(),'2.250 ml');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(erros,[]);
  console.log(`PASSOU ${width}px: garrafa, 3 lançamentos, meia, desfazer, mudança preserva volumes, outro dia e quantidade decimal. Sem erros JS.`);await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
