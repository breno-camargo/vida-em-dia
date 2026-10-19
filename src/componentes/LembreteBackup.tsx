import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ShieldCheck } from 'lucide-react'
import { tabela } from '../dados/banco'
import { lembreteBackup } from '../dados/backup'
export function LembreteBackup({abrir}:{abrir:()=>void}){
 const config=useLiveQuery(()=>tabela('configuracoes').where('chave').equals('principal').first())
 const [agora,definir]=useState(Date.now)
 useEffect(()=>{const atualizar=()=>definir(Date.now());const timer=setInterval(atualizar,60000);document.addEventListener('visibilitychange',atualizar);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',atualizar)}},[])
 if(!config||!lembreteBackup(config,agora))return null
 return <section className="aviso-backup"><div className="aviso-backup-titulo"><ShieldCheck size={22} aria-hidden="true"/><h2>Guarde uma cópia da sua evolução</h2></div><p>Salve seus registros e fotos em um arquivo de backup. A sincronização não inclui suas fotos.</p><button type="button" className="botao-principal" onClick={abrir}>Criar backup</button></section>
}
