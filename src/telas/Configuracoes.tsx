export function Configuracoes({ instalado, persistente }: { instalado: boolean; persistente: boolean | null }) {
  return <><section className="painel"><h2>Seu aparelho</h2><dl>
    <div><dt>App instalado</dt><dd>{instalado ? 'Sim' : 'Não'}</dd></div>
    <div><dt>Armazenamento persistente</dt><dd>{persistente === null ? 'Indisponível' : persistente ? 'Concedido' : 'Não concedido'}</dd></div>
    <div><dt>Tema</dt><dd>Escuro</dd></div><div><dt>Última sincronização</dt><dd>Nunca</dd></div>
    <div><dt>Último backup</dt><dd>Nunca</dd></div>
  </dl><p>Instalar, sincronizar e exportar backups ajuda a proteger seus dados. A persistência depende do navegador.</p></section>
    <section className="painel"><h2>Em breve</h2><p>Backup na etapa 7. Conta e sincronização na etapa 8. Personalização do tema na etapa 13.</p></section>
    <section className="painel"><h2>Sobre o Vida em Dia</h2><p>Seu espaço pessoal de treino, alimentação e evolução.</p><small>Versão 0.1.0 · Base do projeto</small></section></>
}
