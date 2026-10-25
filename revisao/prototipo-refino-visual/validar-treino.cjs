const {chromium}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  for(const width of [360,390]){
   const p=await browser.newPage({viewport:{width,height:844}}),erros=[];
   p.on('pageerror',e=>erros.push(e.message));await p.route(/^https?:/,r=>r.abort());
   await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href+'#treino-andamento');
   const ex=p.locator('.treino-em-andamento .exercicio-recolhivel').first();
   await ex.getByRole('button',{name:'Concluir série 3',exact:true}).click();
   await ex.getByRole('button',{name:'Desfazer série 3',exact:true}).click();
   await ex.getByRole('button',{name:'Carga série 3',exact:true}).click();
   await p.getByRole('dialog',{name:'Repetições e carga'}).getByLabel('Carga em kg').fill('62,5');
   await p.getByRole('button',{name:'Confirmar valores',exact:true}).click();
   assert.equal(await ex.getByRole('button',{name:'Carga série 3',exact:true}).innerText(),'62,5');
   await ex.getByRole('button',{name:'Opções da série 3',exact:true}).click();
   await p.getByRole('button',{name:'Aquecimento',exact:true}).click();
   assert.equal(await ex.locator('.serie-compacta').nth(2).getAttribute('data-tipo'),'aquecimento');
   await ex.getByRole('button',{name:'Série extra',exact:true}).click();
   assert.equal(await ex.locator('.serie-compacta').count(),5);
   for(const i of [3,4,5])await ex.getByRole('button',{name:`Concluir série ${i}`,exact:true}).click();
   assert.equal(await ex.getAttribute('open'),null);
   await p.getByRole('button',{name:'Medidas',exact:true}).click();
   await p.locator('#tela-medidas').waitFor({state:'visible'});
   assert.deepEqual(erros,[]);
   console.log(`PASSOU ${width}px: concluir/desfazer, carga, tipo, série extra, recolher e navegar.`);
   await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
