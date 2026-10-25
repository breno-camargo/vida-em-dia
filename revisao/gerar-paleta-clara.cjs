// Migra as cores fixas legadas para tokens do tema claro, preservando seletores e medidas.
const fs=require('node:fs');
const postcss=require('postcss');
const resultado=postcss.root();
function cor(hex,propriedade){
 let h=hex.slice(1);if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');
 const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
 const brilho=(r+g+b)/3,vermelho=r>g*1.18&&r>b*1.12;
 if(/^(color|fill|stroke|accent-color)$/.test(propriedade))return vermelho?'#963e32':brilho>175?'var(--visual-texto)':brilho>95?'var(--visual-suave)':'#28431e';
 if(/border|outline/.test(propriedade))return vermelho?'#a76a5b':'#7c8d76';
 if(/background/.test(propriedade))return vermelho?'#fff0ea':brilho>155?hex:brilho<42?'var(--visual-rebaixo)':'var(--visual-acento-fundo)';
 return hex;
}
for(const arquivo of ['src/index.css','src/estilos/controles.css']){
 const raiz=postcss.parse(fs.readFileSync(arquivo,'utf8'));
 raiz.walkRules(regra=>{
  if(regra.parent.type==='atrule'&&/keyframes/.test(regra.parent.name))return;
  if(/data-tema|:root|^html|^body|#root|amostra-card|amostra-foto|amostra-minimalista|amostra-adesivo|decoracao/.test(regra.selector))return;
  const declaracoes=[];
  regra.walkDecls(d=>{
   if(!/^(color|background(?:-color)?|border(?:-(?:top|bottom|left|right))?(?:-color)?|outline(?:-color)?|fill|stroke|accent-color)$/.test(d.prop)||!/#(?:[0-9a-f]{3,8})\b/i.test(d.value))return;
   const valor=d.value.replace(/#[0-9a-f]{3,8}\b/gi,h=>cor(h,d.prop));
   if(valor!==d.value)declaracoes.push(postcss.decl({prop:d.prop,value:valor}));
  });
  if(!declaracoes.length)return;
  // Uma regra de separador também pode remover a moldura/fundo herdados.
  // Preservar esses resets evita recriar caixas ao elevar a especificidade da paleta.
  regra.walkDecls(d=>{
   if((/^border(?:-(?:top|bottom|left|right))?$/.test(d.prop)&&/^(0|none)$/.test(d.value))||(/^background(?:-color)?$/.test(d.prop)&&/^(none|transparent)$/.test(d.value))){
    declaracoes.push(postcss.decl({prop:d.prop,value:d.value}));
   }
  });
  declaracoes.sort((a,b)=>regra.nodes.findIndex(d=>d.prop===a.prop)-regra.nodes.findIndex(d=>d.prop===b.prop));
  const seletor=postcss.list.comma(regra.selector).map(s=>`:root[data-tema=claro] ${s.startsWith('.app')?s:'.app '+s}`).join(',\n');
  const nova=postcss.rule({selector:seletor});nova.append(declaracoes);
  if(regra.parent.type==='atrule'){const meio=postcss.atRule({name:regra.parent.name,params:regra.parent.params});meio.append(nova);resultado.append(meio);}else resultado.append(nova);
 });
}
fs.writeFileSync('src/estilos/paleta-clara.css','/* Gerado por revisao/gerar-paleta-clara.cjs: cobertura das cores fixas legadas. */\n'+resultado.toString());
console.log('Paleta clara gerada:',resultado.nodes.length,'regras');
