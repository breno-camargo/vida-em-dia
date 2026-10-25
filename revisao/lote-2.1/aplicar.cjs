const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),cp=require('node:child_process'),postcss=require('postcss');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'planejar';
const files=['src/index.css','src/estilos/controles.css','src/estilos/novo-visual.css','src/estilos/paleta-clara.css','src/estilos/contraste-claro.css'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const target=relative=>{const p=path.resolve(root,relative);if(!p.startsWith(root+path.sep)||!relative.startsWith('src/'))throw new Error('Caminho fora do escopo');return p};
const backupPath=path.join(__dirname,'originais.json.gz');
if(mode==='reverter'){
 const backup=JSON.parse(zlib.gunzipSync(fs.readFileSync(backupPath))),applied=JSON.parse(fs.readFileSync(path.join(__dirname,'aplicacao.json')));
 for(const [file,h]of Object.entries(applied.afterHashes))if(fs.existsSync(target(file))){const actual=hash(fs.readFileSync(target(file))),originalHash=backup[file]?hash(Buffer.from(backup[file],'base64')):null;if(actual!==h&&actual!==originalHash)throw new Error('Arquivo mudou depois da aplicação; não sobrescrever: '+file)}
 for(const [file,bytes]of Object.entries(backup))fs.writeFileSync(target(file),Buffer.from(bytes,'base64'));
 const newFile=target('src/estilos/tokens.css');if(!('src/estilos/tokens.css' in backup)&&fs.existsSync(newFile))fs.unlinkSync(newFile);
 console.log('Lote revertido: fontes restauradas byte a byte.');process.exit(0);
}
const accountClasses=c=>/^(?:conta(?:-|$)|entrada-conta|formulario-conta|campo-senha|ajuda-conta|marca-entrada|apresentacao-entrada|conteudo-entrada|alternativa-entrada|perfil-opcional-cadastro|aviso-confirmacao-conta|recuperar-senha)/.test(c)||/sync|conflito|revisao/.test(c);
const frozenClasses=c=>/(?:^|-)(?:adesivo|preview|story)(?:-|$)/.test(c)||/(?:^|-)card$/.test(c)||c==='texto-compartilhar'||c.startsWith('amostra-');
function exclusion(rule,file){const classes=[...rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m=>m[1]);if(classes.some(accountClasses))return {category:'literais-conta-sync',reason:'Conta/entrada/cadastro/sync/conflito/revisão sem baseline; regra intacta'};if(classes.some(frozenClasses))return {category:'literais-por-exclusao',reason:'Card/preview/compartilhamento congelado'};
 if(file==='src/estilos/paleta-clara.css'&&rule.selector.includes('.app button:focus-visible')&&rule.selector.includes('.app a:focus-visible'))return {category:'literais-por-exclusao',reason:'Global de foco: atinge Conta/sync e cards congelados',global:true};
 if(file==='src/estilos/contraste-claro.css'&&rule.selector===':root[data-tema=claro] .app :is(input,select,textarea)')return {category:'literais-por-exclusao',reason:'Global de campos: atinge Conta/sync e cards congelados',global:true};return null;}
const bugRules={
 'src/index.css':{'.confirmar-catalogo':['C07'],'.salvar-cabecalho':['C09']},
 'src/estilos/controles.css':{'.app .botao-principal:active:not(:disabled)':['C02'],':root[data-tema] .app .botao-principal:not(:disabled)':['C01','C02']},
 'src/estilos/novo-visual.css':{'.marca small':['C08'],'.app .destaque .botao-principal':['C01'],'.app .campo-medida strong':['C03'],'.app input:not([type=checkbox]):not([type=radio]),.app textarea,.app select':['C05'],'.app .navegacao button[aria-current=page]':['C06']}
};
const originals={},changed={},records=[],annotations=[],protectedRules=[];
for(const file of files){const bytes=fs.readFileSync(target(file));originals[file]=bytes.toString('base64');const text=bytes.toString('utf8'),eol=text.includes('\r\n')?'\r\n':'\n',ast=postcss.parse(text),edits=[];
 ast.walkRules(rule=>{const protection=exclusion(rule,file);if(protection)protectedRules.push({file,selector:rule.selector,text:rule.toString()});
  const bugs=bugRules[file]?.[rule.selector]||[];if(bugs.length){edits.push({start:rule.source.start.offset,end:rule.source.start.offset,text:bugs.map(id=>'/* BUG-'+id+': manter até Fase 3 */').join(eol)+eol});annotations.push({file,selector:rule.selector,bugs})}
  let annotated=false;rule.walkDecls(d=>{if(d.prop.startsWith('--')||!/#7c8d76\b/i.test(d.value))return;const count=(d.value.match(/#7c8d76\b/gi)||[]).length;records.push({file,originalLine:d.source.start.line,selector:rule.selector,property:d.prop,originalValue:d.value,count,category:protection?.category||'tokenizadas',reason:protection?.reason||'Alias novo, mesmo literal; seletor e prioridade preservados',global:!!protection?.global});
   if(protection?.global&&!annotated){edits.push({start:rule.source.start.offset,end:rule.source.start.offset,text:'/* SEM-BASELINE: literal #7c8d76 mantido; tokenizar após aprovação do lote Conta */'+eol});annotated=true}
   if(protection)return;const start=d.source.start.offset,end=d.source.end.offset+1;edits.push({start,end,text:text.slice(start,end).replace(/#7c8d76\b/gi,'var(--borda-controle-legada-claro)')});
  });
 });
 edits.sort((a,b)=>b.start-a.start);let next=text;for(const edit of edits)next=next.slice(0,edit.start)+edit.text+next.slice(edit.end);
 if(file==='src/index.css'){if(!next.startsWith("@import 'tailwindcss';"))throw new Error('Import inicial diferente');next=next.replace("@import 'tailwindcss';","@import 'tailwindcss';"+eol+"@import './estilos/tokens.css';")}
 // Os blocos protegidos e TODAS as definições anteriores de tokens precisam permanecer idênticos.
 const nextAst=postcss.parse(next),oldTokens=[],newTokens=[];for(const [tree,list]of [[ast,oldTokens],[nextAst,newTokens]])tree.walkDecls(d=>{if(d.prop.startsWith('--'))list.push([d.parent.selector,d.prop,d.value,!!d.important])});if(JSON.stringify(oldTokens)!==JSON.stringify(newTokens))throw new Error('Token anterior alterado em '+file);
 for(const r of protectedRules.filter(r=>r.file===file)){let found=false;nextAst.walkRules(n=>{if(n.selector===r.selector&&n.toString()===r.text)found=true});if(!found)throw new Error('Regra protegida alterada: '+r.selector)}
 changed[file]=next;
}
const originalOccurrences=JSON.parse(fs.readFileSync(path.join(root,'../vida-em-dia-evidencias/revisao/INVENTARIO-VISUAL.json'))).colors.filter(r=>/#7c8d76\b/i.test(r.value)).reduce((a,r)=>a+(r.value.match(/#7c8d76\b/gi)||[]).length,0);
const totals=records.reduce((a,r)=>(a[r.category]=(a[r.category]||0)+r.count,a),{});if(records.reduce((a,r)=>a+r.count,0)!==originalOccurrences)throw new Error('Contagem diferente do Apêndice D');
const plan={originalOccurrences,totals,records,annotations,protectedRules:protectedRules.map(({text,...r})=>r),removedDeclarations:0,existingTokensChanged:0};fs.writeFileSync(path.join(root,'../vida-em-dia-evidencias/revisao/lote-2.1/mapeamento-bordas.json'),JSON.stringify(plan,null,2));
if(mode==='planejar'){console.log(JSON.stringify({originalOccurrences,totals,sourceFilesChanged:0}));process.exit(0)}
if(mode!=='aplicar')throw new Error('Modo inválido');
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'antes/resultado.json')));if(before.normal.length!==72||before.failures.length||before.normal.some(r=>r.pixelDiff))throw new Error('Gate antes incompleto/falhou');
for(const file of files){const committed=cp.execFileSync('git',['show','HEAD:'+file],{cwd:root});const current=fs.readFileSync(target(file));if(hash(committed)!==hash(Buffer.from(current.toString('utf8').replaceAll('\r\n','\n'))))throw new Error('Fonte diferente do commit antes do lote: '+file)}
if(fs.existsSync(target('src/estilos/tokens.css')))throw new Error('tokens.css já existe; não sobrescrever');
fs.writeFileSync(backupPath,zlib.gzipSync(JSON.stringify(originals)));
for(const [file,text]of Object.entries(changed))fs.writeFileSync(target(file),text);
const tokenCss='/* BUG-C10: manter até Fase 3 */\n'+fs.readFileSync(path.join(__dirname,'tokens-propostos.css'),'utf8');fs.writeFileSync(target('src/estilos/tokens.css'),tokenCss);
const afterHashes=Object.fromEntries([...files,'src/estilos/tokens.css'].map(file=>[file,hash(fs.readFileSync(target(file)))]));fs.writeFileSync(path.join(__dirname,'aplicacao.json'),JSON.stringify({sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),afterHashes,totals,existingTokensChanged:0,removedDeclarations:0},null,2));console.log(JSON.stringify({applied:true,totals,files:[...files,'src/estilos/tokens.css']}));
