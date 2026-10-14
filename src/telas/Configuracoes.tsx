import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import { BackupConfiguracoes } from '../componentes/BackupConfiguracoes'
import { ConfigurarAtividade } from '../componentes/ConfigurarAtividade'
import { ConfigurarLembreteMedidas } from '../componentes/ConfigurarLembreteMedidas'
export function Configuracoes({ instalado, persistente }: { instalado: boolean; persistente: boolean | null }) {
  const config = useLiveQuery(() => tabela('configuracoes').where('chave').equals('principal').first())
  const data = (valor?: string) => valor ? new Date(valor).toLocaleString('pt-BR') : 'Nunca'
  return <><BackupConfiguracoes /><ConfigurarLembreteMedidas /><ConfigurarAtividade /><section className="painel"><h2>Seu aparelho</h2><dl>
    <div><dt>App instalado</dt><dd>{instalado ? 'Sim' : 'Não'}</dd></div>
    <div><dt>Armazenamento persistente</dt><dd>{persistente === null ? 'Indisponível' : persistente ? 'Concedido' : 'Não concedido'}</dd></div>
    <div><dt>Tema</dt><dd>Escuro</dd></div><div><dt>Última sincronização</dt><dd>{data(config?.ultima_sincronizacao)}</dd></div>
    <div><dt>Último backup</dt><dd>{data(config?.ultimo_backup)}</dd></div>
  </dl><p>Instalar, sincronizar e exportar backups ajuda a proteger seus dados. A persistência depende do navegador.</p></section>
    {!instalado && <section className="painel"><h2>Instalar no iPhone</h2><p>Abra no Safari → Compartilhar → Adicionar à Tela de Início.</p><p>Instale antes de registrar dados ou fazer login. Safari e app instalado podem ter dados separados; cada endereço tem seu próprio armazenamento.</p></section>}
    <section className="painel"><h2>Em breve</h2><p>Conta e sincronização na etapa 8. Personalização do tema na etapa 13.</p></section>
    <section className="painel"><h2>Sobre o Vida em Dia</h2><p>Seu espaço pessoal de treino, alimentação e evolução.</p><small>Versão 0.6.0 · Cardio e atividade diária</small></section></>
}







