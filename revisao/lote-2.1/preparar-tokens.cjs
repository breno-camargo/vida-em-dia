// Só prepara a proposta em revisao/. Não escreve no aplicativo.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),inv=JSON.parse(fs.readFileSync(path.join(root,'revisao/INVENTARIO-VISUAL.json')));
const tokens=[];const add=(name,dark,light=dark,group='tema')=>tokens.push({name,dark,light,group});
for(const [name,legacy]of Object.entries({
 '--cor-pagina':'--visual-fundo','--cor-painel':'--visual-painel','--cor-campo':'--visual-rebaixo','--cor-borda-superficie':'--visual-borda',
 '--cor-texto-principal':'--visual-texto','--cor-texto-suave':'--visual-suave','--cor-acento':'--visual-acento','--cor-acento-superficie':'--visual-acento-fundo',
 '--cor-controle-principal-fundo':'--controle-destaque','--cor-controle-principal-texto':'--controle-texto-escuro','--cor-controle-secundario-fundo':'--controle-superficie',
 '--cor-controle-secundario-texto':'--controle-texto','--cor-borda-controle':'--controle-borda','--cor-borda-campo':'--superficie-campo-borda','--cor-painel-topo':'--superficie-topo',
 '--sombra-painel':'--superficie-sombra'
}))add(name,`var(${legacy})`);
add('--cor-controle-ativo-fundo','var(--controle-destaque)','var(--controle-ativo-fundo)');
add('--cor-controle-ativo-texto','var(--controle-texto-escuro)','var(--controle-ativo-texto)');
add('--cor-status-ponto','var(--visual-acento)','var(--status-ponto)');
add('--cor-aviso-fundo','var(--visual-acento-fundo)','var(--aviso-fundo)');
add('--cor-aviso-texto','var(--visual-suave)','var(--aviso-texto)');
add('--cor-aviso-borda','var(--visual-borda)','var(--aviso-borda)');
add('--borda-controle-legada-claro','#7c8d76','#7c8d76','comum');
for(const [name,legacy]of Object.entries({'--fonte-controle':'--controle-fonte','--altura-controle':'--controle-altura','--raio-controle':'--controle-raio','--raio-campo':'--campo-raio','--raio-painel':'--superficie-raio','--duracao-controle':'--movimento-curto','--duracao-painel':'--movimento-painel'}))add(name,`var(${legacy})`,`var(${legacy})`,'comum');
const fonts=[...new Set(inv.fontSizes.map(r=>r.value))].filter(v=>/^\d+(?:\.\d+)?px$/.test(v)).sort((a,b)=>parseFloat(a)-parseFloat(b));
fonts.forEach((v,i)=>add('--fonte-escala-'+String(i+1).padStart(2,'0'),v,v,'comum'));
add('--fonte-oculta','0','0','comum');
[...new Set(inv.fontSizes.map(r=>r.value))].filter(v=>v.startsWith('clamp(')).forEach((v,i)=>add('--fonte-fluida-'+String(i+1).padStart(2,'0'),v,v,'comum'));
const spaces=[...new Set(inv.spacing.filter(r=>/^(padding|gap|row-gap|column-gap)/.test(r.property)).flatMap(r=>r.value.match(/(?<![\w.-])(?:\d*\.)?\d+px\b/g)||[]))].sort((a,b)=>parseFloat(a)-parseFloat(b));
add('--espaco-zero','0','0','comum');spaces.forEach((v,i)=>add('--espaco-escala-'+String(i+1).padStart(2,'0'),v,v,'comum'));
const radii=[...new Set(inv.spacing.filter(r=>r.property==='border-radius').map(r=>r.value))].filter(v=>!v.startsWith('var('));radii.forEach((v,i)=>add('--raio-escala-'+String(i+1).padStart(2,'0'),v,v,'comum'));
for(const [name,value]of Object.entries({'--altura-toque-minima':'44px','--altura-controle-compacta':'44px','--altura-controle-formulario':'48px','--altura-controle-entrada':'54px'}))add(name,value,value,'comum');
const old=new Set(inv.tokens.map(t=>t.token));if(tokens.some(t=>old.has(t.name)))throw new Error('Nome existente na proposta');if(new Set(tokens.map(t=>t.name)).size!==tokens.length)throw new Error('Token duplicado');
let css='/* Lote 2.1: aliases novos apontam para o contrato existente; nenhum token anterior é redirecionado. */\n';
css+=':root {\n'+tokens.filter(t=>t.group==='comum').map(t=>`  ${t.name}: ${t.dark};`).join('\n')+'\n}\n';
css+='\n:root,\n:root[data-tema="escuro"] {\n'+tokens.filter(t=>t.group==='tema').map(t=>`  ${t.name}: ${t.dark};`).join('\n')+'\n}\n';
css+='\n:root[data-tema="claro"] {\n'+tokens.filter(t=>t.group==='tema').map(t=>`  ${t.name}: ${t.light};`).join('\n')+'\n}\n';
fs.writeFileSync(path.join(__dirname,'tokens-propostos.json'),JSON.stringify(tokens,null,2));fs.writeFileSync(path.join(__dirname,'tokens-propostos.css'),css);
console.log(JSON.stringify({newTokens:tokens.length,themeTokens:tokens.filter(t=>t.group==='tema').length,commonTokens:tokens.filter(t=>t.group==='comum').length,sourceFilesChanged:0}));
