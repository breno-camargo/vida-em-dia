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
 return <section className="lembrete-medidas"><ShieldCheck size={22}/><div><h2>Hora de proteger seus dados</h2><p>Já faz {config.dias_lembrete_backup} dias sem backup ou sincronização.</p><button onClick={abrir}>Fazer backup</button></div></section>
}
