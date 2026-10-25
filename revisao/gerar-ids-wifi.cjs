// Calcula no Node os mesmos IDs SHA-256 usados no navegador seguro.
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
const catalogoFonte=fs.readFileSync('src/dados/catalogoAmpliado.ts','utf8');
const modulo={exports:{}};vm.runInNewContext(ts.transpileModule(catalogoFonte,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:modulo.exports,module:modulo});
const {catalogoAmpliado,aliasesCatalogo}=modulo.exports;
const bibliotecaFonte=fs.readFileSync('src/dados/biblioteca.ts','utf8');
const ast=ts.createSourceFile('biblioteca.ts',bibliotecaFonte,ts.ScriptTarget.Latest,true);let grupos;
function visitar(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='grupos')grupos=vm.runInNewContext('('+n.initializer.getText(ast)+')');ts.forEachChild(n,visitar);}visitar(ast);
const normalizar=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
const aliases=new Map(Object.entries(aliasesCatalogo).map(([a,b])=>[normalizar(a),normalizar(b)]));
const ids={};for(const nome of [...Object.values(grupos).flat(),...Object.values(catalogoAmpliado).flatMap(s=>s.split('|'))]){const chave=aliases.get(normalizar(nome))??normalizar(nome);const b=crypto.createHash('sha256').update('vida-em-dia:catalogo:1:'+chave).digest().subarray(0,16);b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;const h=b.toString('hex');ids[chave]=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
fs.writeFileSync('src/dados/idsCatalogoWifi.ts','// Gerado por revisao/gerar-ids-wifi.cjs; carregado somente sem Web Crypto.\nexport const idsCatalogoWifi: Record<string, string> = '+JSON.stringify(ids,null,2)+'\n');console.log('IDs compatíveis:',Object.keys(ids).length);
