/* Interação local do estudo visual; não acessa dados do aplicativo real. */
(() => {
 const treino=document.querySelector('.treino-em-andamento');if(!treino)return;
 const el=(tag,texto)=>{const e=document.createElement(tag);if(texto)e.textContent=texto;return e;};
 const botao=(nome,acao,classe='botao-secundario')=>{const b=el('button',nome);b.type='button';b.className=classe;b.onclick=acao;return b;};
 function painel(titulo,montar){
  const d=el('dialog');d.className='painel-modal';d.setAttribute('aria-label',titulo);
  const topo=el('div');topo.className='topo-painel';const header=el('header');header.append(el('h2',titulo),botao('Fechar',()=>d.close()));topo.append(header);
  const body=el('div');body.className='conteudo-modal formulario';d.append(topo,body);document.body.append(d);d.onclose=()=>d.remove();montar(body,d);d.showModal();
 }
 function campo(body,nome,valor){const label=el('label',nome),input=el('input');input.type='text';input.inputMode='decimal';input.value=String(valor).replace('.',',');label.append(input);body.append(label);return input;}
 function erro(body,msg){let e=body.querySelector('[role=alert]');if(!e){e=el('p');e.setAttribute('role','alert');body.append(e);}e.textContent=msg;}
 function atualizar(){
  const series=[...treino.querySelectorAll('.serie-compacta')],feitas=series.filter(s=>s.classList.contains('concluida'));
  const progresso=treino.querySelector('.barra-sessao');progresso.max=series.length;progresso.value=feitas.length;
  const resumo=treino.querySelector('.progresso-sessao strong');resumo.replaceChildren(document.createTextNode(feitas.length),el('small',` / ${series.length} séries`));
  for(const ex of treino.querySelectorAll('.exercicio-recolhivel')){
   const linhas=[...ex.querySelectorAll('.serie-compacta')],n=linhas.filter(s=>s.classList.contains('concluida')).length;
   let selo=ex.querySelector('.resumo-exercicio .situacao-series');if(!selo){selo=el('small');selo.className='situacao-series';ex.querySelector('.resumo-exercicio').append(selo);}
   const antigo=ex.querySelectorAll('.resumo-exercicio > small');if(antigo.length>2)antigo[1].hidden=true;
   selo.textContent=`${n}/${linhas.length} concluídas${n===linhas.length?' · ✓ Concluído':''}`;
   ex.style.boxShadow=n===linhas.length?'inset 0 3px 0 var(--tema-primaria)':'';
   let proxima=true;
   linhas.forEach((s,i)=>{
    const feita=s.classList.contains('concluida');s.classList.toggle('proxima-serie',!feita&&proxima);if(!feita)proxima=false;
    s.setAttribute('aria-label',`Série ${i+1}, ${feita?'concluída':'pendente'}`);
    const concluir=s.querySelector('.concluir-compacto');concluir.textContent=feita?'Feita':'Concluir';concluir.setAttribute('aria-label',`${feita?'Desfazer':'Concluir'} série ${i+1}`);
    const valores=s.querySelectorAll('.valor-serie');valores.forEach((v,j)=>v.setAttribute('aria-label',`${j?'Carga':'Repetições'} série ${i+1}`));
    s.querySelector('.tipo-serie').textContent=s.dataset.tipo==='aquecimento'?'A':s.dataset.tipo==='falha'?'F':s.dataset.tipo==='dropset'?'D':String(i+1);
   });
  }
 }
 function editarValores(serie){
  painel('Repetições e carga',(body,d)=>{
   const valores=serie.querySelectorAll('.valor-serie'),reps=campo(body,'Repetições',valores[0].textContent),peso=campo(body,'Carga em kg',valores[1].textContent);
   body.append(botao('Confirmar valores',()=>{
    const r=Number(reps.value.replace(',','.')),p=Number(peso.value.replace(',','.'));
    if(!reps.value.trim()||!peso.value.trim()||!Number.isInteger(r)||r<1||r>1000||!Number.isFinite(p)||p<0||p>2000){erro(body,'Informe repetições entre 1 e 1000 e carga entre 0 e 2000 kg.');return;}
    valores[0].textContent=r;valores[1].textContent=p.toLocaleString('pt-BR');d.close();
   },'botao-principal'));
  });
 }
 treino.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  const serie=button.closest('.serie-compacta'),ex=button.closest('.exercicio-recolhivel');
  if(button.matches('.concluir-compacto')){serie.classList.toggle('concluida');atualizar();if([...ex.querySelectorAll('.serie-compacta')].every(s=>s.classList.contains('concluida')))ex.open=false;}
  else if(button.matches('.valor-serie'))editarValores(serie);
  else if(button.matches('.tipo-serie,.menu-serie')){
   painel('Opções da série',(body,d)=>{
    for(const [valor,nome] of [['normal','Normal'],['aquecimento','Aquecimento'],['falha','Até a falha'],['dropset','Drop set']])body.append(botao(nome,()=>{serie.dataset.tipo=valor;atualizar();d.close();}));
    body.append(botao('Editar repetições e carga',()=>{d.close();editarValores(serie);}));
    body.append(botao('Remover série',()=>{serie.remove();atualizar();d.close();},'botao-destrutivo'));
   });
  }else if(button.textContent.trim()==='Série extra'){
   const ultima=ex.querySelector('.serie-compacta:last-of-type');if(!ultima)return;
   const nova=ultima.cloneNode(true);nova.classList.remove('concluida','proxima-serie');ultima.after(nova);atualizar();
  }else if(button.textContent.trim()==='Subir exercício'){
   const anterior=ex.previousElementSibling;if(anterior?.matches('.exercicio-recolhivel'))anterior.before(ex);
  }
 });
 atualizar();
})();
