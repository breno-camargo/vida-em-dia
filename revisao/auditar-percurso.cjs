// Reutiliza o percurso do baseline sem regravar suas imagens ou seus arquivos.
// Recalcula medições com suporte a color(srgb ...), emitido por color-mix().
const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'analise-runtime','percurso');fs.mkdirSync(out,{recursive:true});
let code=fs.readFileSync(path.join(__dirname,'baseline','capturar.cjs'),'utf8');
code=code.replace('const dir=__dirname, origin=',"const dir=path.join(__dirname,'analise-runtime','percurso'), origin=");
code=code.replace("return v&&v.length>=3?[v[0],v[1],v[2],v[3]??1]:null", "return v&&v.length>=3?[...v.slice(0,3).map(x=>s.startsWith('color(srgb')?x*255:x),v[3]??1]:null");
code=code.replace("if(a)c=blend(a,c)","if(a){c=blend(a,c);if(a[3]===1)gradient=s.backgroundImage!=='none'}");
code=code.replace("rows.push({tag:e.tagName,", "rows.push({directText:!!direct,tag:e.tagName,");
code=code.replace("await page.screenshot({path:path.join(dir,filename+'.png'),animations:'disabled',caret:'hide'});",'');
code=code.replace("console.log('CAPTURA '+filename)","console.log('MEDIÇÃO '+filename)");
code=code.replace("png:filename+'.png'","png:'../../baseline/'+filename+'.png'");
new Function('require','__dirname',code)(require,__dirname);
