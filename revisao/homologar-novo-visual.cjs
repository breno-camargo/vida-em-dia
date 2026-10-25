const {chromium}=require('C:/Users/breno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs');
const pasta=path.join(__dirname,'capturas-novo-visual');fs.mkdirSync(pasta,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{for(const width of [360,390,430]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),erros=[],externas=[];
  page.on('pageerror',e=>erros.push(e.message));
  await context.route('**/*',r=>{const u=r.request().url();if(/^https?:/.test(u)&&new URL(u).origin!=='http://127.0.0.1:5180'){externas.push(u);return r.abort();}return r.continue();});
  await page.goto('http://127.0.0.1:5180');await page.locator('.aviso-modo-visitante').waitFor();
  const nav=page.getByRole('navigation',{name:'Navegação principal'});
  async function conferirBarra(){
   const corte=await nav.evaluate(n=>{const r=n.getBoundingClientRect();return [...n.querySelectorAll('button,span,svg')].some(e=>{const b=e.getBoundingClientRect();return b.bottom>innerHeight||b.top<r.top||b.bottom>r.bottom||b.left<0||b.right>innerWidth;});});
   assert.equal(corte,false,'Navegação inteira e alcançável');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem overflow horizontal');
  }
  await conferirBarra();await page.screenshot({path:path.join(pasta,`hoje-escuro-${width}.png`)});
  await page.getByRole('button',{name:'Usar tema claro',exact:true}).click();
  await page.waitForFunction(()=>document.documentElement.dataset.tema==='claro');
  await page.screenshot({path:path.join(pasta,`hoje-claro-${width}.png`)});
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.tema==='claro');
  // Fixtures somente no perfil descartável e na origem 5180.
  await page.evaluate(async()=>{
   const {tabela}=await import('/src/dados/banco.ts'),{criarRegistro}=await import('/src/dados/repositorio.ts'),{salvarFicha}=await import('/src/dados/fichas.ts');
   const exercicio=(await tabela('exercicios').toArray()).find(e=>e.tipo==='forca'&&e.modo_carga==='total');
   for(let i=1;i<=7;i++){const f={...criarRegistro(),nome:`Ficha visual ${i}`,ordem:i};await salvarFicha(f,[{...criarRegistro(),ficha_id:f.id,exercicio_id:exercicio.id,ordem:0,series_planejadas:1,descanso_segundos:0}]);}
   const hoje=new Date().toLocaleDateString('sv-SE');await tabela('medidas_corporais').add({...criarRegistro(),data:hoje,peso:72.5,cintura:81.25});
  });
  await nav.getByRole('button',{name:'Treino',exact:true}).click();
  await page.locator('.ficha-cartao').first().waitFor();
  assert.equal(await page.locator('.ficha-cartao').count(),5);
  await page.getByRole('navigation',{name:'Páginas de fichas'}).getByRole('button',{name:'Próxima',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.ficha-cartao').length===2);
  assert.equal(await page.locator('.ficha-cartao').count(),2);
  await page.screenshot({path:path.join(pasta,`fichas-claro-${width}.png`)});
  await page.getByRole('button',{name:'Iniciar treino',exact:true}).first().click();
  await page.locator('.treino-em-andamento').waitFor();await conferirBarra();
  const fixe=await page.locator('.finalizar-acoes').boundingBox(),navBox=await nav.boundingBox();
  assert.ok(fixe.y+fixe.height<=navBox.y+1,'Ações do treino acima da navegação');
  const ex=page.locator('.treino-em-andamento .exercicio-recolhivel').first();await ex.locator('summary').click();
  await page.screenshot({path:path.join(pasta,`treino-claro-${width}.png`)});
  await ex.getByRole('button',{name:'Concluir série 1',exact:true}).click();
  const conclusao=page.getByRole('dialog',{name:'Todas as séries concluídas!',exact:true});await conclusao.waitFor();
  await conclusao.getByRole('button',{name:'Continuar treino',exact:true}).click();
  assert.ok((await ex.getAttribute('class')).includes('exercicio-finalizado'));
  await page.getByRole('button',{name:'Ver resumo e finalizar',exact:true}).click();
  await page.getByRole('heading',{name:'Pronto para finalizar?',exact:true}).waitFor();
  await page.getByRole('button',{name:'Finalizar e salvar',exact:true}).click();
  const card=page.getByRole('dialog',{name:'Seu treino, do seu jeito',exact:true});await card.waitFor();await card.locator('img.preview-card').waitFor();
  await card.getByRole('button',{name:'Fechar painel',exact:true}).click();
  await nav.getByRole('button',{name:'Evolução',exact:true}).click();await page.getByRole('button',{name:'Ver treino',exact:true}).first().waitFor();
  await nav.getByRole('button',{name:'Medidas',exact:true}).click();await page.locator('.peso-resumo-medidas strong').filter({hasText:'72,500'}).waitFor();
  await page.getByRole('button',{name:'Abrir configurações',exact:true}).click();
  await page.getByRole('button',{name:/Aparência/}).click();await page.getByRole('button',{name:'Escuro',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.tema==='escuro');
  await page.screenshot({path:path.join(pasta,`configuracoes-escuro-${width}.png`)});
  await page.getByRole('button',{name:/Backup dos seus dados/}).click();await page.getByPlaceholder('No mínimo 12 caracteres').fill('Senha-ficticia-123');
  await page.getByPlaceholder('Digite a mesma senha').fill('Senha-ficticia-123');await page.getByRole('button',{name:'Preparar backup',exact:true}).click();await page.getByText('Backup pronto',{exact:true}).waitFor();
  await conferirBarra();assert.deepEqual(erros,[]);assert.deepEqual(externas,[]);
  console.log(`PASSOU ${width}px: navegação sem corte, temas persistidos, 7 fichas/paginação, treino e resumo, card aprovado, histórico, medidas e backup real local. Sem erros JS ou HTTP externo.`);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
