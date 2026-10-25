// Usa o Playwright já instalado fora do projeto. Não instala dependências.
const {chromium}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage(),erros=[],remotas=[];
  page.on('pageerror',e=>erros.push(e.message));
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(/^https?:/.test(url)&&new URL(url).origin!=='http://127.0.0.1:5180'){remotas.push(url);return route.abort();}
   return route.continue();
  });
  await page.goto('http://127.0.0.1:5180/');
  await page.getByText(/Modo visitante: estes registros/).waitFor();
  assert.equal(await page.evaluate(async()=>{const m=await import('/src/sincronizacao/cliente.ts');return m.supabase===null&&m.sessaoLocal()===null;}),true);
  const nav=page.getByRole('navigation',{name:'Navegação principal'});
  await nav.getByRole('button',{name:'Treino',exact:true}).click();
  await page.getByRole('button',{name:'Nova ficha',exact:true}).click();
  const editor=page.getByRole('dialog',{name:'Nova ficha',exact:true});
  await editor.getByLabel('Nome da ficha',{exact:true}).fill('Ficha fictícia da cópia');
  await editor.locator('.selecionar-exercicio').first().click();
  await editor.getByRole('button',{name:'Adicionar (1)',exact:true}).click();
  await editor.getByRole('button',{name:'Salvar',exact:true}).click();
  await page.locator('.abrir-ficha').filter({hasText:'Ficha fictícia da cópia'}).waitFor();
  await page.reload();await page.getByText(/Modo visitante: estes registros/).waitFor();
  await nav.getByRole('button',{name:'Treino',exact:true}).click();
  await page.locator('.abrir-ficha').filter({hasText:'Ficha fictícia da cópia'}).waitFor();
  const bancos=await page.evaluate(async()=>(await indexedDB.databases()).map(b=>b.name));
  assert.ok(bancos.includes('vida-em-dia:visitante'));
  assert.deepEqual(erros,[]);assert.deepEqual(remotas,[]);
  console.log('PASSOU: origem 127.0.0.1:5180, visitante, Supabase null, ficha fictícia persistida após reload, sem erros JS ou requisições HTTP externas.');
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
