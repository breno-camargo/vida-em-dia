/**
 * VIDA EM DIA — PROTÓTIPO DE REPAGINAÇÃO VISUAL (SEGUNDA ENTREGA / PÓS-DEVOLUTIVA CODEX)
 * Motor interativo de navegação, fluxos, estados e dados simulados.
 * 100% Offline, sem dependências externas, sem alert(), foco inerte e acessibilidade completa.
 */

// Estado Global em Memória do Protótipo
const estado = {
  telaAtual: 'hoje', // hoje, treino, comida, medidas, evolucao, configuracoes, componentes
  secaoTreino: 'fichas', // fichas, biblioteca, cardio
  abaMedidas: 'registros', // registros, comparar
  tema: 'dark', // dark, light
  dispositivo: '390', // 390, 360, desktop
  modoVisitante: false,
  visitanteSemRegistros: false,
  
  // Elemento com foco antes da abertura de modal para restauração
  pilhaModais: [],
  ultimoFoco: null,

  // Catálogo Base de Exercícios (Editável pelo usuário)
  exerciciosCatalogo: [
    { id: 'ex-1', nome: 'Supino Reto com Barra', grupo: 'Peito', equipamento: 'Barra', tipo: 'forca', descansoPadrao: 90, nota: 'Manter escápulas retraídas e pés firmes no chão.' },
    { id: 'ex-2', nome: 'Crucifixo Inclinado com Halteres', grupo: 'Peito', equipamento: 'Halteres', tipo: 'forca', descansoPadrao: 75, nota: 'Alongamento controlado no final da fase excêntrica.' },
    { id: 'ex-3', nome: 'Puxada Frontal na Polia', grupo: 'Costas', equipamento: 'Polia', tipo: 'forca', descansoPadrao: 90, nota: 'Puxar a barra em direção à parte superior do esterno.' },
    { id: 'ex-4', nome: 'Remada Curvada com Barra', grupo: 'Costas', equipamento: 'Barra', tipo: 'forca', descansoPadrao: 90, nota: 'Coluna alinhada e cotovelos rentes ao tronco.' },
    { id: 'ex-5', nome: 'Agachamento Livre', grupo: 'Pernas', equipamento: 'Barra', tipo: 'forca', descansoPadrao: 120, nota: 'Descer até quebrar o paralelo mantendo o tronco estável.' },
    { id: 'ex-6', nome: 'Leg Press 45°', grupo: 'Pernas', equipamento: 'Máquina', tipo: 'forca', descansoPadrao: 90, nota: 'Posicionar os pés na largura dos ombros na plataforma.' },
    { id: 'ex-7', nome: 'Desenvolvimento com Halteres', grupo: 'Ombros', equipamento: 'Halteres', tipo: 'forca', descansoPadrao: 75, nota: 'Cotovelos levemente à frente do plano do corpo.' },
    { id: 'ex-8', nome: 'Tríceps Corda na Polia', grupo: 'Braços', equipamento: 'Polia', tipo: 'forca', descansoPadrao: 60, nota: 'Abrir a corda no final da extensão dos braços.' },
    { id: 'ex-9', nome: 'Rosca Direta com Barra W', grupo: 'Braços', equipamento: 'Barra', tipo: 'forca', descansoPadrao: 60, nota: 'Executar sem balanço do tronco.' },
    { id: 'ex-10', nome: 'Elevação Lateral com Halteres', grupo: 'Ombros', equipamento: 'Halteres', tipo: 'forca', descansoPadrao: 60, nota: 'Manter punhos alinhados com os cotovelos.' },
    { id: 'ex-11', nome: 'Abdominal Supra na Polia', grupo: 'Abdômen', equipamento: 'Polia', tipo: 'forca', descansoPadrao: 60, nota: 'Enrolar o tronco contra a resistência do cabo.' },
    { id: 'ex-12', nome: 'Esteira Ergométrica', grupo: 'Cardio', equipamento: 'Esteira', tipo: 'cardio', descansoPadrao: 0, nota: 'Corrida contínua ou intervalada.' }
  ],
  filtroGrupoMuscular: 'Todos',
  buscaCatalogo: '',

  // Fichas de Treino com Itens Reais
  fichas: [
    {
      id: 'f1',
      nome: 'Treino A · Peito, Ombro e Tríceps',
      obs: 'Carga e intensidade',
      itens: [
        { id: 'fi-1', exercicioId: 'ex-1', seriesPlanejadas: 4, descansoSegundos: 90 },
        { id: 'fi-2', exercicioId: 'ex-2', seriesPlanejadas: 3, descansoSegundos: 75 },
        { id: 'fi-3', exercicioId: 'ex-7', seriesPlanejadas: 3, descansoSegundos: 75 },
        { id: 'fi-4', exercicioId: 'ex-8', seriesPlanejadas: 3, descansoSegundos: 60 }
      ]
    },
    {
      id: 'f2',
      nome: 'Treino B · Costas e Bíceps',
      obs: 'Puxadas e remadas',
      itens: [
        { id: 'fi-5', exercicioId: 'ex-3', seriesPlanejadas: 4, descansoSegundos: 90 },
        { id: 'fi-6', exercicioId: 'ex-4', seriesPlanejadas: 3, descansoSegundos: 90 },
        { id: 'fi-7', exercicioId: 'ex-9', seriesPlanejadas: 3, descansoSegundos: 60 }
      ]
    }
  ],
  fichaEmEdicao: null, // Rascunho da ficha sendo criada/editada
  fichaOpcoesAtivaId: null, // Id da ficha com o menu de engrenagem aberto

  // Treino Ativo em Andamento (Ficha ou Livre)
  treinoAtivo: null,
  treinoTempoSegundos: 0,
  treinoTimerInterval: null,
  descansoTempoRestante: 90,
  descansoTimerInterval: null,
  desfazerTreinoRemocao: null,

  // Histórico de Treinos Concluídos
  historicoTreinos: [
    {
      id: 'h-1',
      data: '2026-10-20',
      titulo: 'Treino B · Costas e Bíceps',
      duracaoMin: 52,
      seriesConcluidas: 10,
      volumeTotalKg: 4250,
      calorias: 410,
      pesoCorporal: 72.800
    }
  ],
  ultimoTreinoFinalizadoId: 'h-1',

  // Dados simulados de Medidas Corporais
  medidas: [
    { data: '2026-10-15', peso: 73.200, cintura: 79.50, busto: 94.00, abdomen: 82.50, quadril: 98.00, braco_d: 33.00, braco_e: 32.50, antebraco_d: 28.50, antebraco_e: 28.00, coxa_d: 56.00, coxa_e: 55.50, panturrilha_d: 37.00, panturrilha_e: 36.50 },
    { data: '2026-10-22', peso: 72.500, cintura: 78.00, busto: 93.50, abdomen: 81.00, quadril: 97.50, braco_d: 33.50, braco_e: 33.00, antebraco_d: 28.50, antebraco_e: 28.00, coxa_d: 56.50, coxa_e: 56.00, panturrilha_d: 37.50, panturrilha_e: 37.00 }
  ],
  medidaPendenteConfirmacao: null, // { anterior, nova, alteracoes }

  // Sessões de Cardio
  sessoesCardio: [
    { id: 'c1', tipo: 'Corrida na rua', data: '2026-10-22', duracaoMin: 45, distanciaKm: 6.10, calorias: 610, fcMedia: 148, obs: 'Ritmo 7\'23"/km · FC 148 bpm' }
  ],

  // Itens na Lixeira (Retenção 30 dias)
  itensRemovidos: [
    { id: 'rem-1', tipo: 'Medida Corporal', nome: 'Registro de 08/10/2026 (73,800 kg)', diasRestantes: 24 },
    { id: 'rem-2', tipo: 'Ficha de Treino', nome: 'Treino C Antigo (Pernas e Ombros)', diasRestantes: 18 }
  ],
  itemPendenteEliminacao: null,

  // Backup e Restauração
  backupSenha: '',
  backupConfirmacao: '',
  backupFotos: true,
  backupRemovidos: false,
  backupGerado: false,

  importTipoArquivo: 'json_criptografado', // json_criptografado, json_legivel
  importSenha: '',
  importModo: 'mesclar', // mesclar, substituir
  importAceiteSubstituir: false,

  // Privacidade
  filaPendenteSync: 3,
  simularFalhaExclusaoServidor: false,

  // Conta e Acesso
  modoConta: 'entrar', // entrar, cadastro, confirmar, recuperar
  etapaRecuperacao: 1, // 1: email, 2: codigo e nova senha, 3: concluido
  estadoConta: 'normal',
  mostrarSenhaConta: false
};

// Ícones SVG inline padronizados
const icones = {
  leaf: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  dumbbell: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
  utensils: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v14a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V2"/><path d="M8 2v6"/><line x1="12" y1="2" x2="12" y2="8"/></svg>`,
  ruler: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4"/><path d="m13 7 4 4"/><path d="m11 9 4 4"/><path d="m9 11 4 4"/><path d="m7 13 4 4"/><path d="M21.17 8 8 21.17a2.83 2.83 0 0 1-4-4L17.17 4a2.83 2.83 0 0 1 4 4Z"/></svg>`,
  trendingUp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  ellipsis: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  shieldLock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><rect width="8" height="5" x="8" y="11" rx="1"/><path d="M10 11V9a2 2 0 1 1 4 0v2"/></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowUp: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  arrowDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`
};

// Inicialização da Aplicação
function iniciarApp() {
  definirTema(estado.tema);
  definirDispositivo(estado.dispositivo);
  renderizarBarraPrototipo();
  renderizarTela();
  adicionarOuvintesGlobais();
}

// Alternar Tema (Escuro / Claro)
function definirTema(novoTema) {
  estado.tema = novoTema;
  document.documentElement.setAttribute('data-theme', novoTema);
  renderizarBarraPrototipo();
}

// Alternar Dispositivo (390, 360, Desktop)
function definirDispositivo(largura) {
  estado.dispositivo = largura;
  const moldura = document.getElementById('dispositivo-moldura');
  if (!moldura) return;
  moldura.className = 'dispositivo-moldura';
  if (largura === '360') moldura.classList.add('modo-360');
  else if (largura === 'desktop') moldura.classList.add('modo-desktop');
  renderizarBarraPrototipo();
}

// Navegação entre Telas
function navegarPara(tela) {
  estado.telaAtual = tela;
  renderizarTela();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Renderizar a Barra Superior de Ferramentas
function renderizarBarraPrototipo() {
  const container = document.getElementById('barra-prototipo');
  if (!container) return;
  container.innerHTML = `
    <div class="barra-prototipo-titulo">
      <span>Vida em Dia</span>
      <span class="badge">Protótipo Repaginação (Revisão Codex)</span>
    </div>
    <div class="barra-prototipo-acoes">
      <div class="seletor-visao" role="group" aria-label="Seletor de tela principal">
        <button class="${estado.telaAtual === 'hoje' ? 'ativo' : ''}" onclick="navegarPara('hoje')">Hoje</button>
        <button class="${estado.telaAtual === 'treino' ? 'ativo' : ''}" onclick="navegarPara('treino')">Treino</button>
        <button class="${estado.telaAtual === 'comida' ? 'ativo' : ''}" onclick="navegarPara('comida')">Comida</button>
        <button class="${estado.telaAtual === 'medidas' ? 'ativo' : ''}" onclick="navegarPara('medidas')">Medidas</button>
        <button class="${estado.telaAtual === 'evolucao' ? 'ativo' : ''}" onclick="navegarPara('evolucao')">Evolução</button>
        <button class="${estado.telaAtual === 'configuracoes' ? 'ativo' : ''}" onclick="navegarPara('configuracoes')">Config</button>
      </div>

      <div class="seletor-tema" role="group" aria-label="Seletor de tema">
        <button class="${estado.tema === 'dark' ? 'ativo' : ''}" data-tema="dark" onclick="definirTema('dark')">Escuro</button>
        <button class="${estado.tema === 'light' ? 'ativo' : ''}" data-tema="light" onclick="definirTema('light')">Claro</button>
      </div>

      <div class="seletor-dispositivo" role="group" aria-label="Seletor de largura do dispositivo">
        <button class="${estado.dispositivo === '390' ? 'ativo' : ''}" data-dispositivo="390" onclick="definirDispositivo('390')">390 px</button>
        <button class="${estado.dispositivo === '360' ? 'ativo' : ''}" data-dispositivo="360" onclick="definirDispositivo('360')">360 px</button>
        <button class="${estado.dispositivo === 'desktop' ? 'ativo' : ''}" data-dispositivo="desktop" onclick="definirDispositivo('desktop')">Desktop</button>
      </div>

      <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="alternarModoVisitante()">
        ${estado.modoVisitante ? 'Sair de Visitante' : 'Simular Visitante'}
      </button>

      ${estado.modoVisitante ? `
        <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="alternarVisitanteSemRegistros()">
          ${estado.visitanteSemRegistros ? 'Com Registros' : 'Sem Registros'}
        </button>
      ` : ''}
    </div>
  `;
}

function alternarModoVisitante() {
  estado.modoVisitante = !estado.modoVisitante;
  if (!estado.modoVisitante) estado.visitanteSemRegistros = false;
  renderizarBarraPrototipo();
  renderizarTela();
}

function alternarVisitanteSemRegistros() {
  estado.visitanteSemRegistros = !estado.visitanteSemRegistros;
  renderizarBarraPrototipo();
  renderizarTela();
}

// Renderizar Tela Ativa
function renderizarTela() {
  renderizarBarraPrototipo();
  atualizarItensNavegacaoInferior();
  const corpo = document.getElementById('app-corpo');
  if (!corpo) return;

  switch (estado.telaAtual) {
    case 'hoje':
      corpo.innerHTML = renderizarTelaHoje();
      break;
    case 'treino':
      corpo.innerHTML = renderizarTelaTreino();
      break;
    case 'comida':
      corpo.innerHTML = renderizarTelaComida();
      break;
    case 'medidas':
      corpo.innerHTML = renderizarTelaMedidas();
      break;
    case 'evolucao':
      corpo.innerHTML = renderizarTelaEvolucao();
      break;
    case 'configuracoes':
      corpo.innerHTML = renderizarTelaConfiguracoes();
      break;
    default:
      corpo.innerHTML = renderizarTelaHoje();
  }
}

function atualizarItensNavegacaoInferior() {
  document.querySelectorAll('.app-navegacao-item').forEach(item => {
    const tela = item.dataset.tela;
    const ativo = tela === estado.telaAtual;
    item.classList.toggle('ativo', ativo);
    if (ativo) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

/* ==========================================================================
   TELA 1: HOJE
   ========================================================================== */
function renderizarTelaHoje() {
  const proximaFicha = estado.fichas[0];
  const ultimoTreino = estado.historicoTreinos[estado.historicoTreinos.length - 1];

  return `
    <div class="linha-data-rede">
      <span>Quinta-feira, 22 de outubro</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <h1 class="titulo-pagina">Olá, vamos cuidar de você?</h1>

    ${estado.modoVisitante ? `
      <div class="aviso-banner aviso-visitante">
        <div class="icone">${icones.info}</div>
        <div>
          <strong>Modo visitante ativo:</strong> Estes registros ficam visíveis a quem usar este perfil do navegador. Eles não são transferidos ao criar ou acessar uma conta.
        </div>
      </div>
    ` : ''}

    ${estado.treinoAtivo ? `
      <!-- Retomar Treino em Andamento -->
      <section class="painel-card painel-card-destaque" style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span class="badge" style="background:var(--brand-surface); color:var(--brand-primary); font-size:11px; font-weight:700;">Treino em Andamento</span>
          <span style="font-size:12px; font-family:var(--fonte-mono); font-weight:700; color:var(--brand-primary);">${formatarTempoSegundos(estado.treinoTempoSegundos)}</span>
        </div>
        <h2 style="font-size:18px; margin:4px 0 12px;">${estado.treinoAtivo.titulo}</h2>
        <button type="button" class="botao-principal largura-total" onclick="abrirModalModoTreino()">
          ${icones.play} Continuar Treino
        </button>
      </section>
    ` : ''}

    ${estado.modoVisitante && estado.visitanteSemRegistros ? `
      <section class="estado-vazio-card">
        <div class="estado-vazio-icone">${icones.dumbbell}</div>
        <h2>Comece seu primeiro treino</h2>
        <p>Crie sua primeira ficha de exercícios ou inicie um treino livre agora mesmo.</p>
        <button type="button" class="botao-principal" onclick="navegarPara('treino')">${icones.plus} Começar Treino</button>
      </section>
    ` : `
      <!-- Destaque: Próxima Ficha ou Iniciar Treino -->
      <section class="destaque-hoje">
        <span class="etiqueta">Próximo Treino</span>
        <h2>${proximaFicha ? proximaFicha.nome : 'Treino Livre'}</h2>
        <p>${proximaFicha ? `${proximaFicha.itens.length} exercícios planejados · Estimativa 45 min.` : 'Monte seu treino do dia ou selecione exercícios livremente.'}</p>
        <button type="button" class="botao-principal" onclick="${proximaFicha ? `iniciarTreinoFicha('${proximaFicha.id}')` : 'iniciarTreinoLivre()'}">
          ${icones.play} Iniciar Treino
        </button>
      </section>

      <!-- Último Treino Finalizado -->
      ${ultimoTreino ? `
        <div class="painel-card" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="abrirModalDetalhesTreino('${ultimoTreino.id}')">
          <div>
            <span style="font-size:11px; color:var(--text-secondary);">Último treino · ${formatarDataBr(ultimoTreino.data)}</span>
            <strong style="display:block; font-size:14px; color:var(--text-primary); margin-top:2px;">${ultimoTreino.titulo}</strong>
          </div>
          <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="abrirModalDetalhesTreino('${ultimoTreino.id}')">
            Ver detalhes ${icones.arrowRight}
          </button>
        </div>
      ` : ''}

      <!-- Resumo de Atividade Diária -->
      <div class="painel-cabecalho">
        <h2>Sua Atividade Hoje</h2>
        <span>Metas do dia</span>
      </div>

      <div class="grade-dupla">
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">${icones.leaf} Calorias gastas</span>
          <strong class="cartao-metrica-valor">485 <small>kcal</small></strong>
          <span class="cartao-metrica-sub">Meta 550 kcal (88%)</span>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">${icones.dumbbell} Cardio semanal</span>
          <strong class="cartao-metrica-valor">45 <small>min</small></strong>
          <span class="cartao-metrica-sub">Meta 150 min (30%)</span>
        </div>
      </div>

      <!-- Lembrete de Proteção (Backup) -->
      <section class="painel-card">
        <div class="painel-cabecalho">
          <h2>Lembrete de Proteção</h2>
          <span>Segurança</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:14px;">
          Seu último backup criptografado foi gerado há 6 dias. Mantenha seus dados salvos em segurança fora deste aparelho.
        </p>
        <button type="button" class="botao-secundario largura-total" onclick="abrirModalBackup()">
          ${icones.shieldLock} Gerar Backup Agora
        </button>
      </section>

      <!-- Atalho Rápido de Medidas -->
      <section class="painel-card">
        <div class="painel-cabecalho">
          <h2>Acompanhamento Corporal</h2>
          <span>Semanal</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">
          <div>
            <span style="font-size:11px; color:var(--text-secondary);">Último peso registrado</span>
            <p style="font-size:24px; font-weight:700; color:var(--text-primary); margin-top:2px;">72,500 <small style="font-size:12px; font-weight:500;">kg</small></p>
          </div>
          <button type="button" class="botao-secundario" style="min-height:44px; padding:8px 14px; font-size:12px;" onclick="abrirEditorMedidas('2026-10-22')">
            ${icones.plus} Registrar
          </button>
        </div>
      </section>
    `}
  `;
}

/* ==========================================================================
   TELA 2: TREINO (Fichas, Biblioteca e Cardio)
   ========================================================================== */
function renderizarTelaTreino() {
  return `
    <div class="linha-data-rede">
      <span>Planejamento e Execução</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <h1 class="titulo-pagina">Treino</h1>

    ${estado.modoVisitante ? `
      <div class="aviso-banner aviso-visitante">
        <div class="icone">${icones.info}</div>
        <div>
          <strong>Modo visitante:</strong> Seus treinos e fichas ficam salvos apenas neste perfil do navegador.
        </div>
      </div>
    ` : ''}

    ${estado.desfazerTreinoRemocao ? `
      <div class="aviso-banner aviso-sucesso" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <span>${estado.desfazerTreinoRemocao.texto}</span>
        <button type="button" class="botao-secundario" style="min-height:38px; padding:4px 10px; font-size:11px;" onclick="executarDesfazerTreinoRemocao()">Desfazer</button>
      </div>
    ` : ''}

    <!-- Abas Internas de Treino: Minhas Fichas | Exercícios | Cardio -->
    <div class="abas-segmentadas" role="tablist" aria-label="Seções de treino">
      <button class="${estado.secaoTreino === 'fichas' ? 'ativo' : ''}" role="tab" aria-selected="${estado.secaoTreino === 'fichas'}" onclick="alternarSecaoTreino('fichas')">Minhas Fichas</button>
      <button class="${estado.secaoTreino === 'biblioteca' ? 'ativo' : ''}" role="tab" aria-selected="${estado.secaoTreino === 'biblioteca'}" onclick="alternarSecaoTreino('biblioteca')">Exercícios (${estado.exerciciosCatalogo.length})</button>
      <button class="${estado.secaoTreino === 'cardio' ? 'ativo' : ''}" role="tab" aria-selected="${estado.secaoTreino === 'cardio'}" onclick="alternarSecaoTreino('cardio')">Cardio</button>
    </div>

    <div id="secao-treino-conteudo">
      ${renderizarConteudoSecaoTreino()}
    </div>
  `;
}

function alternarSecaoTreino(secao) {
  estado.secaoTreino = secao;
  renderizarTela();
}

function renderizarConteudoSecaoTreino() {
  if (estado.secaoTreino === 'biblioteca') {
    return renderizarSecaoBiblioteca();
  }
  if (estado.secaoTreino === 'cardio') {
    return renderizarSecaoCardio();
  }
  return renderizarSecaoFichas();
}

function renderizarSecaoFichas() {
  if (estado.modoVisitante && estado.visitanteSemRegistros) {
    return `
      <section class="estado-vazio-card">
        <div class="estado-vazio-icone">${icones.dumbbell}</div>
        <h2>Sua primeira ficha</h2>
        <p>Organize os exercícios, as séries planejadas e o descanso ou inicie um treino livre.</p>
        <button type="button" class="botao-principal" onclick="abrirModalNovaFicha()">${icones.plus} Criar Primeira Ficha</button>
      </section>
    `;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">${estado.fichas.length} fichas planejadas</span>
      <button type="button" class="botao-principal" style="min-height:44px; padding:8px 14px; font-size:13px;" onclick="abrirModalNovaFicha()">
        ${icones.plus} Nova Ficha
      </button>
    </div>

    ${estado.fichas.map(f => `
      <article class="painel-card ficha-compacta-codex">
        <div class="ficha-cabecalho-compacto">
          <div>
            <h2>${f.nome}</h2>
            <span>${f.itens.length} exercícios</span>
          </div>
          <button type="button" class="botao-principal ficha-iniciar-compacto" onclick="iniciarTreinoFicha('${f.id}')" aria-label="Iniciar treino ${f.nome}">
            ${icones.play}<span>Iniciar</span>
          </button>
          <button type="button" class="app-botao-icone" onclick="abrirOpcoesFicha('${f.id}')" aria-label="Opções da ficha ${f.nome}">
            ${icones.settings}
          </button>
        </div>

        <details class="ficha-exercicios-compactos">
        <summary>Ver exercícios</summary>
        ${f.obs ? `<p>${f.obs}</p>` : ''}
        <ul>
          ${f.itens.map(item => {
            const ex = estado.exerciciosCatalogo.find(e => e.id === item.exercicioId);
            return `<li style="font-size:12px; color:var(--text-secondary); display:flex; justify-content:space-between;">
              <span>• ${ex ? ex.nome : 'Exercício'}</span>
              <span style="font-variant-numeric:tabular-nums;">${item.seriesPlanejadas} séries · ${item.descansoSegundos}s</span>
            </li>`;
          }).join('')}
        </ul>
        </details>
      </article>
    `).join('')}

    <button type="button" class="botao-secundario largura-total" style="border-style:dashed; margin-top:8px;" onclick="iniciarTreinoLivre()">
      ${icones.plus} Iniciar Treino Livre (Sem Ficha)
    </button>

    <!-- PLACEHOLDER NEUTRO DO COMPONENTE CONGELADO -->
    <div class="container-componente-congelado">
      <span class="etiqueta-congelado">Componente existente preservado</span>
      <p class="placeholder-descricao">Cards de exercícios e séries dentro do treino mantidos sem alteração.</p>
    </div>
  `;
}

function renderizarSecaoBiblioteca() {
  const grupos = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Cardio'];
  const exerciciosFiltrados = estado.exerciciosCatalogo.filter(ex => {
    const matchGrupo = estado.filtroGrupoMuscular === 'Todos' || ex.grupo === estado.filtroGrupoMuscular;
    const matchBusca = !estado.buscaCatalogo || ex.nome.toLowerCase().includes(estado.buscaCatalogo.toLowerCase()) || ex.equipamento.toLowerCase().includes(estado.buscaCatalogo.toLowerCase());
    return matchGrupo && matchBusca;
  });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Biblioteca de Exercícios</span>
      <button type="button" class="botao-principal" style="min-height:44px; padding:8px 14px; font-size:12px;" onclick="abrirModalNovoExercicio()">
        ${icones.plus} Adicionar Exercício
      </button>
    </div>

    <div class="campo-grupo" style="margin-bottom:14px;">
      <label for="busca-exercicios-catalogo" class="sr-only">Buscar exercício</label>
      <div class="campo-senha-container">
        <input type="search" id="busca-exercicios-catalogo" class="campo-input" placeholder="Buscar exercício por nome ou equipamento…" value="${estado.buscaCatalogo}" oninput="estado.buscaCatalogo = this.value; renderizarTela();" />
        <span class="campo-senha-alternar" aria-hidden="true">${icones.search}</span>
      </div>
    </div>

    <!-- Filtros Musculares em Faixa Horizontal Preservada -->
    <div class="faixa-filtros-musculares" role="toolbar" aria-label="Filtro de grupos musculares">
      ${grupos.map(g => `
        <button type="button" class="chip-filtro ${estado.filtroGrupoMuscular === g ? 'ativo' : ''}" aria-pressed="${estado.filtroGrupoMuscular === g}" onclick="estado.filtroGrupoMuscular = '${g}'; renderizarTela();">
          ${g} ${g === 'Todos' ? `(${estado.exerciciosCatalogo.length})` : ''}
        </button>
      `).join('')}
    </div>

    <div class="lista-catalogo" style="display:flex; flex-direction:column; gap:10px;">
      ${exerciciosFiltrados.length === 0 ? `
        <p class="nota-explicativa" style="text-align:center; padding:20px;">Nenhum exercício encontrado para os filtros selecionados.</p>
      ` : exerciciosFiltrados.map(ex => `
        <article class="painel-card" style="padding:14px; display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:0;">
          <div>
            <strong style="font-size:14px; display:block; color:var(--text-primary);">${ex.nome}</strong>
            <small style="font-size:11px; color:var(--text-secondary);">${ex.grupo} · ${ex.equipamento} · Descanso ${ex.descansoPadrao}s</small>
          </div>
          <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="abrirAjudaExercicio('${ex.id}')">
            Como Fazer
          </button>
        </article>
      `).join('')}
    </div>
  `;
}

function renderizarSecaoCardio() {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Sessões desta semana</span>
      <button type="button" class="botao-principal" style="min-height:44px; padding:8px 14px; font-size:12px;" onclick="abrirEditorCardio()">
        ${icones.plus} Registrar Cardio
      </button>
    </div>

    <section class="painel-card">
      <div class="painel-cabecalho">
        <h2>Esta Semana</h2>
        <span>Meta: 150 min</span>
      </div>
      <div class="grade-dupla">
        <div>
          <span style="font-size:11px; color:var(--text-secondary);">Duração total</span>
          <p style="font-size:22px; font-weight:700; color:var(--text-primary); margin-top:2px;">45:00 <small style="font-size:11px;">min</small></p>
        </div>
        <div>
          <span style="font-size:11px; color:var(--text-secondary);">Distância</span>
          <p style="font-size:22px; font-weight:700; color:var(--text-primary); margin-top:2px;">6,10 <small style="font-size:11px;">km</small></p>
        </div>
      </div>
    </section>

    ${estado.sessoesCardio.map(s => `
      <article class="painel-card" style="margin-bottom:12px;">
        <div class="painel-cabecalho">
          <div>
            <h2>${s.tipo}</h2>
            <span>${formatarDataBr(s.data)} · ${s.duracaoMin} min · ${s.distanciaKm > 0 ? `${s.distanciaKm.toFixed(2)} km` : ''}</span>
          </div>
          <span class="badge" style="background:var(--brand-surface); color:var(--brand-primary); padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">Cardio</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:14px;">
          ${s.obs} · ${s.calorias} kcal informadas.
        </p>
        <button type="button" class="botao-secundario largura-total" onclick="abrirModalCardsCompartilhaveis()">
          ${icones.share} Compartilhar Adesivo
        </button>
      </article>
    `).join('')}
  `;
}

/* ==========================================================================
   TELA 3: COMIDA (Preservada Conforme App.tsx - EstadoVazio)
   ========================================================================== */
function renderizarTelaComida() {
  return `
    <div class="linha-data-rede">
      <span>Diário Alimentar</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <h1 class="titulo-pagina">Comida</h1>

    <!-- Representação Fiel do EstadoVazio do App Real (App.tsx: proximas.Comida) -->
    <section class="estado-vazio-card">
      <div class="estado-vazio-icone">
        ${icones.utensils}
      </div>
      <h2>Mais simples, mais constante</h2>
      <p>Um diário rápido para acompanhar suas refeições, sem complicar a rotina.</p>
      <span class="selo-etapa">Planejado para a etapa 9</span>
    </section>
  `;
}

/* ==========================================================================
   TELA 4: MEDIDAS (Registro Parcial, Complementação e Confirmação Antes/Depois)
   ========================================================================== */
function renderizarTelaMedidas() {
  const regAtual = estado.medidas[estado.medidas.length - 1];
  const regAnterior = estado.medidas.length > 1 ? estado.medidas[estado.medidas.length - 2] : null;

  return `
    <div class="linha-data-rede">
      <span>Composição Corporal</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <h1 class="titulo-pagina" style="margin-bottom:0;">Medidas</h1>
      <button type="button" class="botao-principal" style="min-height:44px; padding:8px 14px; font-size:12px;" onclick="abrirEditorMedidas()">
        ${icones.plus} Registrar
      </button>
    </div>

    ${estado.modoVisitante ? `
      <div class="aviso-banner aviso-visitante">
        <div class="icone">${icones.info}</div>
        <div>
          <strong>Modo visitante:</strong> As medidas corporais ficam armazenadas neste navegador e funcionam offline.
        </div>
      </div>
    ` : ''}

    ${estado.modoVisitante && estado.visitanteSemRegistros ? `
      <section class="estado-vazio-card">
        <div class="estado-vazio-icone">${icones.ruler}</div>
        <h2>Seu primeiro registro</h2>
        <p>Você pode informar apenas o peso ou as medidas que quiser acompanhar.</p>
        <p style="font-size:12px; color:var(--text-tertiary);">Os registros ficam salvos neste aparelho e funcionam offline.</p>
        <button type="button" class="botao-principal" onclick="abrirEditorMedidas()">${icones.plus} Registrar Medidas</button>
      </section>
    ` : `
      <!-- Abas: Registros / Comparar Datas -->
      <div class="abas-segmentadas" role="tablist">
        <button class="${estado.abaMedidas === 'registros' ? 'ativo' : ''}" role="tab" aria-selected="${estado.abaMedidas === 'registros'}" onclick="renderizarAbaMedidas('registros')">Registros</button>
        <button class="${estado.abaMedidas === 'comparar' ? 'ativo' : ''}" role="tab" aria-selected="${estado.abaMedidas === 'comparar'}" onclick="renderizarAbaMedidas('comparar')">Comparar Datas</button>
      </div>

      <div id="conteudo-aba-medidas">
        ${estado.abaMedidas === 'comparar' ? renderizarComparacaoMedidas(regAnterior, regAtual) : renderizarRegistrosMedidas(regAtual, regAnterior)}
      </div>
    `}
  `;
}

function renderizarAbaMedidas(aba) {
  estado.abaMedidas = aba;
  renderizarTela();
}

function renderizarRegistrosMedidas(regAtual, regAnterior) {
  if (!regAtual) return `<p class="nota-explicativa">Nenhum registro de medida disponível.</p>`;
  return `
    <article class="painel-card painel-card-destaque">
      <div class="painel-cabecalho">
        <div>
          <h2>Registro Mais Recente</h2>
          <span>${formatarDataBr(regAtual.data)}</span>
        </div>
        <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="abrirEditorMedidas('${regAtual.data}')">
          Editar
        </button>
      </div>

      <div style="margin-bottom:14px;">
        <span style="font-size:11px; color:var(--text-secondary);">Peso Corporal</span>
        <p style="font-size:28px; font-weight:800; color:var(--text-primary); margin-top:2px;">
          ${formatarKg(regAtual.peso)} <small style="font-size:14px; font-weight:500;">kg</small>
        </p>
      </div>

      <div class="grade-dupla" style="gap:10px;">
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Busto / Tórax</span>
          <strong class="cartao-metrica-valor">${regAtual.busto !== undefined ? `${formatarCm(regAtual.busto)} cm` : '—'}</strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Cintura</span>
          <strong class="cartao-metrica-valor">${regAtual.cintura ? `${formatarCm(regAtual.cintura)} cm` : '—'}</strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Abdômen</span>
          <strong class="cartao-metrica-valor">${regAtual.abdomen ? `${formatarCm(regAtual.abdomen)} cm` : '—'}</strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Quadril</span>
          <strong class="cartao-metrica-valor">${regAtual.quadril !== undefined ? `${formatarCm(regAtual.quadril)} cm` : '—'}</strong>
        </div>
        ${[['Bíceps','braco_d','braco_e'],['Coxas','coxa_d','coxa_e'],['Panturrilhas','panturrilha_d','panturrilha_e']].map(([nome,direito,esquerdo])=>`
          <div class="cartao-metrica resumo-par-medidas">
            <span class="cartao-metrica-rotulo">${nome}</span>
            <div><small>Direito</small><strong>${regAtual[direito] !== undefined ? `${formatarCm(regAtual[direito])} cm` : '—'}</strong></div>
            <div><small>Esquerdo</small><strong>${regAtual[esquerdo] !== undefined ? `${formatarCm(regAtual[esquerdo])} cm` : '—'}</strong></div>
          </div>`).join('')}
      </div>
    </article>

    <div class="painel-cabecalho">
      <h2>Histórico de Medições</h2>
      <span>${estado.medidas.length} registros</span>
    </div>

    ${estado.medidas.slice().reverse().map(m => `
      <div class="painel-card" style="padding:14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div>
          <strong style="font-size:14px; color:var(--text-primary);">${formatarDataBr(m.data)}</strong>
          <small style="display:block; font-size:11px; color:var(--text-secondary); margin-top:2px;">
            Peso: ${formatarKg(m.peso)} kg · Cintura: ${m.cintura ? `${formatarCm(m.cintura)} cm` : '—'}
          </small>
        </div>
        <button type="button" class="botao-secundario" style="min-height:44px; padding:6px 12px; font-size:12px;" onclick="abrirEditorMedidas('${m.data}')">
          Editar
        </button>
      </div>
    `).join('')}
  `;
}

function renderizarComparacaoMedidas(anterior, atual) {
  if (!anterior || !atual) {
    return `<p class="nota-explicativa" style="text-align:center; padding:20px;">Necessário ter pelo menos duas medições salvas para comparar datas.</p>`;
  }

  const difPeso = atual.peso - anterior.peso;
  const difCintura = (atual.cintura && anterior.cintura) ? (atual.cintura - anterior.cintura) : 0;

  return `
    <article class="painel-card">
      <div class="painel-cabecalho">
        <div>
          <h2>Comparação entre Datas</h2>
          <span>${formatarDataBr(anterior.data)} → ${formatarDataBr(atual.data)}</span>
        </div>
      </div>

      <div class="grade-dupla" style="margin-bottom:16px;">
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Diferença de Peso</span>
          <strong class="cartao-metrica-valor">${difPeso > 0 ? '+' : ''}${formatarKg(difPeso)} <small>kg</small></strong>
          <span class="cartao-metrica-sub">${anterior.peso.toFixed(3)} → ${atual.peso.toFixed(3)} kg</span>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Diferença Cintura</span>
          <strong class="cartao-metrica-valor">${difCintura > 0 ? '+' : ''}${formatarCm(difCintura)} <small>cm</small></strong>
          <span class="cartao-metrica-sub">${anterior.cintura?.toFixed(2)} → ${atual.cintura?.toFixed(2)} cm</span>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   TELA 5: EVOLUÇÃO
   ========================================================================== */
function renderizarTelaEvolucao() {
  return `
    <div class="linha-data-rede">
      <span>Consistência e Histórico</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <h1 class="titulo-pagina">Evolução</h1>

    ${estado.modoVisitante && estado.visitanteSemRegistros ? `
      <section class="estado-vazio-card">
        <div class="estado-vazio-icone">${icones.trendingUp}</div>
        <h2>Acompanhe sua jornada</h2>
        <p>Conforme você conclui treinos e sessões de cardio, seu volume e gráficos aparecerão aqui.</p>
        <button type="button" class="botao-principal" onclick="navegarPara('treino')">${icones.play} Iniciar Treino</button>
      </section>
    ` : `
      <div class="painel-cabecalho">
        <h2>Histórico de Treinos</h2>
        <span>${estado.historicoTreinos.length} treinos concluídos</span>
      </div>

      ${estado.historicoTreinos.slice().reverse().map(t => `
        <article class="painel-card" style="margin-bottom:12px;">
          <div class="painel-cabecalho">
            <div>
              <h2>${t.titulo}</h2>
              <span>${formatarDataBr(t.data)} · ${t.duracaoMin} min · ${t.seriesConcluidas} séries</span>
            </div>
            <button type="button" class="app-botao-icone" onclick="abrirModalDetalhesTreino('${t.id}')" aria-label="Ver detalhes de ${t.titulo}">
              ${icones.arrowRight}
            </button>
          </div>
          <div class="grade-dupla">
            <div>
              <span style="font-size:11px; color:var(--text-secondary);">Volume total</span>
              <p style="font-size:20px; font-weight:700; color:var(--brand-primary); margin-top:2px;">
                ${t.volumeTotalKg.toLocaleString('pt-BR')} <small style="font-size:11px;">kg</small>
              </p>
            </div>
            <div>
              <span style="font-size:11px; color:var(--text-secondary);">Gasto estimado</span>
              <p style="font-size:20px; font-weight:700; color:var(--text-primary); margin-top:2px;">
                ${t.calorias} <small style="font-size:11px;">kcal</small>
              </p>
            </div>
          </div>
          <button type="button" class="botao-secundario largura-total" style="margin-top:12px;" onclick="abrirModalCardsCompartilhaveis()">
            ${icones.share} Compartilhar Card Pós-Treino
          </button>
        </article>
      `).join('')}

      <!-- PLACEHOLDER NEUTRO DO COMPONENTE CONGELADO -->
      <div class="container-componente-congelado">
        <span class="etiqueta-congelado">Componente existente preservado</span>
        <p class="placeholder-descricao">Cards compartilháveis pós-treino (modelos Tipográfico, Foto e Editorial) mantidos sem alteração.</p>
      </div>
    `}
  `;
}

/* ==========================================================================
   TELA 6: CONFIGURAÇÕES
   ========================================================================== */
function renderizarTelaConfiguracoes() {
  return `
    <div class="linha-data-rede">
      <span>Preferências e Conta</span>
      <span class="estado-rede"><i class="ponto-rede"></i>Online</span>
    </div>
    
    <h1 class="titulo-pagina">Configurações</h1>

    <div class="formulario">
      <section class="painel-card" style="padding:16px;">
        <div class="painel-cabecalho" style="margin-bottom:8px;">
          <h2>Conta e Acesso</h2>
          <span>Perfil</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
          Acesse com sua conta ou cadastre-se para sincronizar seus dados em múltiplos aparelhos.
        </p>
        <button type="button" class="botao-secundario largura-total" onclick="abrirModalConta()">
          Gerenciar Conta e Acesso
        </button>
      </section>

      <section class="painel-card" style="padding:16px;">
        <div class="painel-cabecalho" style="margin-bottom:8px;">
          <h2>Backup e Restauração</h2>
          <span>Segurança</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
          Exporte um arquivo criptografado ou restaure seus dados mantendo o controle total da sua privacidade.
        </p>
        <div class="grade-dupla">
          <button type="button" class="botao-secundario" onclick="abrirModalBackup()">Criar Backup</button>
          <button type="button" class="botao-secundario" onclick="abrirModalImportarBackup()">Restaurar</button>
        </div>
      </section>

      <section class="painel-card" style="padding:16px;">
        <div class="painel-cabecalho" style="margin-bottom:8px;">
          <h2>Privacidade e Armazenamento</h2>
          <span>Seus dados</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
          Consulte itens na lixeira (retenção de 30 dias), limpe dados antigos do navegador ou exclua sua conta.
        </p>
        <button type="button" class="botao-secundario largura-total" onclick="abrirModalPrivacidade()">
          Privacidade e Lixeira
        </button>
      </section>

      <section class="painel-card" style="padding:16px;">
        <div class="painel-cabecalho" style="margin-bottom:8px;">
          <h2>Aparência e Tema</h2>
          <span>Interface</span>
        </div>
        <div class="grade-dupla">
          <button type="button" class="botao-secundario ${estado.tema === 'dark' ? 'ativo' : ''}" onclick="definirTema('dark')">Tema Escuro</button>
          <button type="button" class="botao-secundario ${estado.tema === 'light' ? 'ativo' : ''}" onclick="definirTema('light')">Tema Claro</button>
        </div>
      </section>
    </div>
  `;
}

/* ==========================================================================
   FLUXO DE FICHAS: CRIAR, EDITAR, REORDENAR, DUPLICAR, EXCLUIR
   ========================================================================== */
function abrirModalNovaFicha() {
  estado.fichaEmEdicao = {
    id: 'f-' + Date.now(),
    nome: '',
    obs: 'Criada no protótipo',
    itens: []
  };
  document.getElementById('titulo-editor-ficha').textContent = 'Nova Ficha';
  document.getElementById('editor-ficha-nome').value = '';
  document.getElementById('busca-exercicio-ficha').value = '';
  renderizarItensEditorFicha();
  filtrarExerciciosParaFicha('');
  abrirModal('modal-editor-ficha');
}

function abrirEditorFicha(id) {
  const f = estado.fichas.find(item => item.id === id);
  if (!f) return;
  estado.fichaEmEdicao = JSON.parse(JSON.stringify(f));
  document.getElementById('titulo-editor-ficha').textContent = 'Editar Ficha';
  document.getElementById('editor-ficha-nome').value = f.nome;
  document.getElementById('busca-exercicio-ficha').value = '';
  renderizarItensEditorFicha();
  filtrarExerciciosParaFicha('');
  abrirModal('modal-editor-ficha');
}

function renderizarItensEditorFicha() {
  const container = document.getElementById('editor-ficha-itens');
  if (!container || !estado.fichaEmEdicao) return;

  if (estado.fichaEmEdicao.itens.length === 0) {
    container.innerHTML = `<p class="nota-explicativa" style="text-align:center; padding:12px;">Nenhum exercício adicionado a esta ficha ainda. Busque e adicione abaixo.</p>`;
    return;
  }

  container.innerHTML = estado.fichaEmEdicao.itens.map((item, idx) => {
    const ex = estado.exerciciosCatalogo.find(e => e.id === item.exercicioId);
    return `
      <div class="item-ficha-card">
        <div class="item-ficha-cabecalho">
          <div>
            <strong style="font-size:13px; color:var(--text-primary);">${idx + 1}. ${ex ? ex.nome : 'Exercício'}</strong>
            <small style="display:block; font-size:11px; color:var(--text-secondary);">${ex ? ex.grupo : ''}</small>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:11px; color:var(--text-secondary);">Séries:</label>
            <input type="number" min="1" max="10" value="${item.seriesPlanejadas}" style="width:48px; text-align:center; min-height:44px;" class="campo-input" onchange="estado.fichaEmEdicao.itens[${idx}].seriesPlanejadas = parseInt(this.value) || 3;" />
            <label style="font-size:11px; color:var(--text-secondary);">Descanso:</label>
            <input type="number" step="15" min="15" max="300" value="${item.descansoSegundos}" style="width:58px; text-align:center; min-height:44px;" class="campo-input" onchange="estado.fichaEmEdicao.itens[${idx}].descansoSegundos = parseInt(this.value) || 90;" />
          </div>
        </div>
        <div class="item-ficha-acoes">
          <button type="button" class="botao-secundario" ${idx === 0 ? 'disabled' : ''} onclick="moverExercicioEditorFicha(${idx}, -1)">Subir</button>
          <button type="button" class="botao-secundario" ${idx === estado.fichaEmEdicao.itens.length - 1 ? 'disabled' : ''} onclick="moverExercicioEditorFicha(${idx}, 1)">Descer</button>
          <button type="button" class="botao-destrutivo" onclick="removerExercicioEditorFicha(${idx})">Retirar</button>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarExerciciosParaFicha(termo) {
  const container = document.getElementById('lista-exercicios-disponiveis-ficha');
  if (!container || !estado.fichaEmEdicao) return;
  const termoLower = termo.toLowerCase().trim();
  const itensJaAdicionados = new Set(estado.fichaEmEdicao.itens.map(i => i.exercicioId));

  const disponiveis = estado.exerciciosCatalogo.filter(ex => {
    const jaAdicionado = itensJaAdicionados.has(ex.id);
    const matchTermo = !termoLower || ex.nome.toLowerCase().includes(termoLower) || ex.grupo.toLowerCase().includes(termoLower);
    return !jaAdicionado && matchTermo;
  });

  if (disponiveis.length === 0) {
    container.innerHTML = `<p style="padding:10px; font-size:12px; color:var(--text-tertiary); text-align:center;">Nenhum exercício disponível para adicionar.</p>`;
    return;
  }

  container.innerHTML = disponiveis.map(ex => `
    <div class="item-exercicio-catalogo-escolha">
      <div>
        <strong style="font-size:13px; color:var(--text-primary); display:block;">${ex.nome}</strong>
        <small style="font-size:11px; color:var(--text-secondary);">${ex.grupo} · ${ex.equipamento}</small>
      </div>
      <button type="button" class="botao-secundario" onclick="adicionarExercicioAoEditorFicha('${ex.id}')">
        + Adicionar
      </button>
    </div>
  `).join('');
}

function adicionarExercicioAoEditorFicha(exercicioId) {
  if (!estado.fichaEmEdicao) return;
  const ex = estado.exerciciosCatalogo.find(e => e.id === exercicioId);
  estado.fichaEmEdicao.itens.push({
    id: 'fi-' + Date.now() + Math.random(),
    exercicioId,
    seriesPlanejadas: 3,
    descansoSegundos: ex ? ex.descansoPadrao : 90
  });
  renderizarItensEditorFicha();
  filtrarExerciciosParaFicha(document.getElementById('busca-exercicio-ficha').value);
}

function removerExercicioEditorFicha(idx) {
  if (!estado.fichaEmEdicao) return;
  estado.fichaEmEdicao.itens.splice(idx, 1);
  renderizarItensEditorFicha();
  filtrarExerciciosParaFicha(document.getElementById('busca-exercicio-ficha').value);
}

function moverExercicioEditorFicha(idx, dir) {
  if (!estado.fichaEmEdicao) return;
  const novoIdx = idx + dir;
  if (novoIdx < 0 || novoIdx >= estado.fichaEmEdicao.itens.length) return;
  const item = estado.fichaEmEdicao.itens.splice(idx, 1)[0];
  estado.fichaEmEdicao.itens.splice(novoIdx, 0, item);
  renderizarItensEditorFicha();
}

function salvarEditorFicha() {
  if (!estado.fichaEmEdicao) return;
  const nomeInput = document.getElementById('editor-ficha-nome');
  const nome = nomeInput ? nomeInput.value.trim() : '';
  if (!nome) {
    exibirToastGeral('Por favor, informe o nome da ficha.');
    if (nomeInput) nomeInput.focus();
    return;
  }

  estado.fichaEmEdicao.nome = nome;
  const idxExistente = estado.fichas.findIndex(f => f.id === estado.fichaEmEdicao.id);
  if (idxExistente >= 0) {
    estado.fichas[idxExistente] = estado.fichaEmEdicao;
  } else {
    estado.fichas.push(estado.fichaEmEdicao);
  }

  fecharModais();
  renderizarTela();
  exibirToastGeral(`Ficha "${nome}" salva com sucesso!`);
}

function abrirOpcoesFicha(id) {
  const f = estado.fichas.find(item => item.id === id);
  if (!f) return;
  estado.fichaOpcoesAtivaId = id;
  const idx = estado.fichas.findIndex(item => item.id === id);
  const corpo = document.getElementById('corpo-opcoes-ficha');
  if (!corpo) return;

  corpo.innerHTML = `
    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:6px;">Opções para <strong>${f.nome}</strong>:</p>
    <button type="button" class="botao-secundario largura-total" onclick="fecharModais(); abrirEditorFicha('${f.id}')">Editar Ficha</button>
    <button type="button" class="botao-secundario largura-total" ${idx === 0 ? 'disabled' : ''} onclick="fecharModais(); moverFichaLista('${f.id}', -1)">Subir na Lista</button>
    <button type="button" class="botao-secundario largura-total" ${idx === estado.fichas.length - 1 ? 'disabled' : ''} onclick="fecharModais(); moverFichaLista('${f.id}', 1)">Descer na Lista</button>
    <button type="button" class="botao-secundario largura-total" onclick="fecharModais(); duplicarFicha('${f.id}')">Duplicar Ficha</button>
    <button type="button" class="botao-destrutivo largura-total" onclick="fecharModais(); excluirFicha('${f.id}')">Excluir Ficha</button>
  `;

  abrirModal('modal-opcoes-ficha');
}

function moverFichaLista(id, dir) {
  const idx = estado.fichas.findIndex(f => f.id === id);
  if (idx < 0) return;
  const novoIdx = idx + dir;
  if (novoIdx < 0 || novoIdx >= estado.fichas.length) return;
  const f = estado.fichas.splice(idx, 1)[0];
  estado.fichas.splice(novoIdx, 0, f);
  renderizarTela();
  exibirToastGeral(`Ficha reordenada com sucesso.`);
}

function duplicarFicha(id) {
  const f = estado.fichas.find(item => item.id === id);
  if (!f) return;
  const copia = JSON.parse(JSON.stringify(f));
  copia.id = 'f-' + Date.now();
  copia.nome = `${f.nome} (Cópia)`;
  estado.fichas.push(copia);
  renderizarTela();
  exibirToastGeral(`Ficha "${copia.nome}" duplicada.`);
}

function excluirFicha(id) {
  const idx = estado.fichas.findIndex(item => item.id === id);
  if (idx < 0) return;
  const removida = estado.fichas.splice(idx, 1)[0];
  
  estado.desfazerTreinoRemocao = {
    texto: `Ficha "${removida.nome}" removida.`,
    executar: () => {
      estado.fichas.splice(idx, 0, removida);
      renderizarTela();
    }
  };

  renderizarTela();
  exibirToastGeral(`Ficha "${removida.nome}" removida.`);
}

function executarDesfazerTreinoRemocao() {
  if (estado.desfazerTreinoRemocao) {
    estado.desfazerTreinoRemocao.executar();
    estado.desfazerTreinoRemocao = null;
    exibirToastGeral('Ação desfeita com sucesso.');
  }
}

/* ==========================================================================
   FLUXO DE TREINO: INICIAR FICHA, TREINO LIVRE, CONTROLES DE SÉRIES, FINALIZAR
   ========================================================================== */
function iniciarTreinoFicha(fichaId) {
  const f = estado.fichas.find(item => item.id === fichaId);
  if (!f) return;

  const itensTreino = f.itens.map(item => {
    const ex = estado.exerciciosCatalogo.find(e => e.id === item.exercicioId);
    const series = [];
    for (let i = 1; i <= item.seriesPlanejadas; i++) {
      series.push({
        id: 's-' + Date.now() + Math.random(),
        numero: i,
        tipo: 'normal',
        reps: 10,
        peso: 50,
        modoCarga: 'total',
        pesoBarra: 20,
        rpe: 0,
        concluida: false,
        opcoesAbertas: false
      });
    }
    return {
      id: 'ti-' + Date.now() + Math.random(),
      exercicioId: item.exercicioId,
      nome: ex ? ex.nome : 'Exercício',
      grupo: ex ? ex.grupo : '',
      descansoSegundos: item.descansoSegundos,
      series
    };
  });

  estado.treinoAtivo = {
    id: 't-' + Date.now(),
    titulo: f.nome,
    fichaId: f.id,
    data: '2026-10-22',
    inicioSegundos: Date.now(),
    observacao: '',
    itens: itensTreino
  };

  iniciarCronometroTreino();
  abrirModalModoTreino();
}

function iniciarTreinoLivre() {
  estado.treinoAtivo = {
    id: 't-' + Date.now(),
    titulo: 'Treino livre',
    fichaId: null,
    data: '2026-10-22',
    inicioSegundos: Date.now(),
    observacao: '',
    itens: []
  };

  iniciarCronometroTreino();
  abrirModalModoTreino();
}

function iniciarCronometroTreino() {
  clearInterval(estado.treinoTimerInterval);
  estado.treinoTempoSegundos = 0;
  estado.treinoTimerInterval = setInterval(() => {
    estado.treinoTempoSegundos++;
    const tempoEl = document.getElementById('treino-tempo-decorrido');
    if (tempoEl) tempoEl.textContent = formatarTempoSegundos(estado.treinoTempoSegundos);
  }, 1000);
}

function abrirModalModoTreino() {
  if (!estado.treinoAtivo) return;
  const modal = document.getElementById('modal-modo-treino');
  if (!modal) return;

  document.getElementById('titulo-modo-treino').textContent = estado.treinoAtivo.titulo;
  const btnNomear = document.getElementById('btn-nomear-treino-livre');
  if (btnNomear) btnNomear.hidden = !!estado.treinoAtivo.fichaId;

  renderizarExerciciosTreinoAtivo();
  atualizarProgressoTreinoAtivo();
  filtrarExerciciosParaTreinoAtivo('');
  abrirModal('modal-modo-treino');
}

function renderizarExerciciosTreinoAtivo() {
  const container = document.getElementById('treino-exercicios-container');
  if (!container || !estado.treinoAtivo) return;

  if (estado.treinoAtivo.itens.length === 0) {
    container.innerHTML = `
      <div class="painel-card" style="text-align:center; padding:24px 16px;">
        <strong style="display:block; font-size:14px; color:var(--text-primary); margin-bottom:4px;">Nenhum exercício neste treino</strong>
        <p style="font-size:12px; color:var(--text-secondary);">Use a seção abaixo para buscar e adicionar exercícios ao seu treino do dia.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = estado.treinoAtivo.itens.map((item, exIdx) => {
    const totalSeries = item.series.length;
    const feitas = item.series.filter(s => s.concluida).length;

    return `
      <details class="exercicio-treino" open>
        <summary>
          <div>
            <strong style="font-size:14px; color:var(--text-primary); display:block;">${item.nome}</strong>
            <small style="font-size:11px; color:var(--text-secondary);">${feitas} de ${totalSeries} séries concluídas · Descanso ${item.descansoSegundos}s</small>
          </div>
          <button type="button" class="botao-secundario" style="min-height:36px; padding:4px 10px; font-size:11px;" onclick="event.stopPropagation(); abrirAjudaExercicio('${item.exercicioId}')">Como fazer</button>
        </summary>
        <div class="conteudo-exercicio-treino">
          <div class="cabecalho-series">
            <span>SÉRIE</span>
            <span>REPS</span>
            <span>KG</span>
            <span>CONCLUIR</span>
            <span>OPÇÕES</span>
          </div>
          <div class="lista-series-itens">
            ${item.series.map((s, sIdx) => `
              <div class="linha-serie ${s.concluida ? 'concluida' : ''}">
                <button type="button" class="tipo-serie-btn ${s.tipo}" onclick="ciclarTipoSerie(${exIdx}, ${sIdx})" aria-label="Tipo da série ${s.numero}">
                  ${s.tipo === 'normal' ? s.numero : s.tipo === 'aquecimento' ? 'A' : s.tipo === 'dropset' ? 'D' : 'F'}
                </button>
                <button type="button" class="valor-serie-btn" onclick="alterarRepsSeriePrompt(${exIdx}, ${sIdx})" aria-label="Repetições: ${s.reps}">
                  ${s.reps}
                </button>
                <button type="button" class="valor-serie-btn" onclick="alterarPesoSeriePrompt(${exIdx}, ${sIdx})" aria-label="Carga: ${s.peso} kg">
                  ${s.peso.toLocaleString('pt-BR')}
                </button>
                <button type="button" class="concluir-serie-btn ${s.concluida ? 'feita' : ''}" onclick="alternarConclusaoSerie(${exIdx}, ${sIdx})" aria-label="${s.concluida ? 'Desfazer conclusão' : 'Concluir série'}">
                  ${s.concluida ? 'Feita' : 'Concluir'}
                </button>
                <button type="button" class="menu-serie-btn" onclick="alternarOpcoesSerie(${exIdx}, ${sIdx})" aria-label="Opções da série ${s.numero}">
                  ${icones.ellipsis}
                </button>
              </div>

              ${s.opcoesAbertas ? `
                <div class="opcoes-serie-painel">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-secondary); font-weight:600;">Modo de Carga:</span>
                    <button type="button" class="botao-secundario" style="min-height:36px; padding:4px 10px; font-size:11px;" onclick="alternarModoCargaSerie(${exIdx}, ${sIdx})">
                      ${s.modoCarga === 'total' ? 'Total (Barra + Anilhas)' : 'Por Lado'}
                    </button>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-secondary); font-weight:600;">Peso da Barra:</span>
                    <input type="number" step="0.5" value="${s.pesoBarra}" style="width:70px; min-height:36px; text-align:center;" class="campo-input" onchange="s.pesoBarra = parseFloat(this.value) || 20;" />
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-secondary); font-weight:600;">Esforço (RPE 1-10):</span>
                    <input type="number" min="0" max="10" step="0.5" value="${s.rpe}" style="width:70px; min-height:36px; text-align:center;" class="campo-input" onchange="s.rpe = parseFloat(this.value) || 0;" />
                  </div>
                </div>
              ` : ''}
            `).join('')}
          </div>

          <div class="acoes-exercicio-linha">
            <button type="button" class="botao-secundario" onclick="adicionarSerieExtra(${exIdx})">+ Série Extra</button>
            <button type="button" class="botao-secundario" ${exIdx === 0 ? 'disabled' : ''} onclick="moverExercicioTreinoAtivo(${exIdx}, -1)">Subir</button>
            <button type="button" class="botao-destrutivo" onclick="removerExercicioTreinoAtivo(${exIdx})">Remover do Dia</button>
          </div>
        </div>
      </details>
    `;
  }).join('');
}

function filtrarExerciciosParaTreinoAtivo(termo) {
  const container = document.getElementById('lista-exercicios-disponiveis-treino');
  if (!container || !estado.treinoAtivo) return;
  const termoLower = termo.toLowerCase().trim();
  const itensJaAdicionados = new Set(estado.treinoAtivo.itens.map(i => i.exercicioId));

  const disponiveis = estado.exerciciosCatalogo.filter(ex => {
    const matchTermo = !termoLower || ex.nome.toLowerCase().includes(termoLower) || ex.grupo.toLowerCase().includes(termoLower);
    return !itensJaAdicionados.has(ex.id) && matchTermo;
  });

  if (disponiveis.length === 0) {
    container.innerHTML = `<p style="padding:10px; font-size:12px; color:var(--text-tertiary); text-align:center;">Nenhum outro exercício encontrado.</p>`;
    return;
  }

  container.innerHTML = disponiveis.map(ex => `
    <div class="item-exercicio-catalogo-escolha">
      <div>
        <strong style="font-size:13px; color:var(--text-primary); display:block;">${ex.nome}</strong>
        <small style="font-size:11px; color:var(--text-secondary);">${ex.grupo} · ${ex.equipamento}</small>
      </div>
      <button type="button" class="botao-secundario" onclick="adicionarExercicioAoTreinoAtivo('${ex.id}')">
        + Adicionar ao Treino
      </button>
    </div>
  `).join('');
}

function adicionarExercicioAoTreinoAtivo(exercicioId) {
  if (!estado.treinoAtivo) return;
  const ex = estado.exerciciosCatalogo.find(e => e.id === exercicioId);
  const series = [
    { id: 's-' + Date.now() + '-1', numero: 1, tipo: 'normal', reps: 10, peso: 40, modoCarga: 'total', pesoBarra: 20, rpe: 0, concluida: false, opcoesAbertas: false },
    { id: 's-' + Date.now() + '-2', numero: 2, tipo: 'normal', reps: 10, peso: 40, modoCarga: 'total', pesoBarra: 20, rpe: 0, concluida: false, opcoesAbertas: false },
    { id: 's-' + Date.now() + '-3', numero: 3, tipo: 'normal', reps: 8, peso: 45, modoCarga: 'total', pesoBarra: 20, rpe: 0, concluida: false, opcoesAbertas: false }
  ];

  estado.treinoAtivo.itens.push({
    id: 'ti-' + Date.now(),
    exercicioId,
    nome: ex ? ex.nome : 'Exercício',
    grupo: ex ? ex.grupo : '',
    descansoSegundos: ex ? ex.descansoPadrao : 90,
    series
  });

  renderizarExerciciosTreinoAtivo();
  atualizarProgressoTreinoAtivo();
  filtrarExerciciosParaTreinoAtivo(document.getElementById('busca-exercicio-treino-ativo').value);
  exibirToastGeral(`"${ex ? ex.nome : 'Exercício'}" adicionado ao treino.`);
}

function removerExercicioTreinoAtivo(idx) {
  if (!estado.treinoAtivo) return;
  const removido = estado.treinoAtivo.itens.splice(idx, 1)[0];
  renderizarExerciciosTreinoAtivo();
  atualizarProgressoTreinoAtivo();
  filtrarExerciciosParaTreinoAtivo(document.getElementById('busca-exercicio-treino-ativo').value);

  estado.desfazerTreinoRemocao = {
    texto: `"${removido.nome}" removido do dia.`,
    executar: () => {
      estado.treinoAtivo.itens.splice(idx, 0, removido);
      renderizarExerciciosTreinoAtivo();
      atualizarProgressoTreinoAtivo();
    }
  };
  exibirToastGeral(`"${removido.nome}" removido do dia.`);
}

function moverExercicioTreinoAtivo(idx, dir) {
  if (!estado.treinoAtivo) return;
  const novoIdx = idx + dir;
  if (novoIdx < 0 || novoIdx >= estado.treinoAtivo.itens.length) return;
  const item = estado.treinoAtivo.itens.splice(idx, 1)[0];
  estado.treinoAtivo.itens.splice(novoIdx, 0, item);
  renderizarExerciciosTreinoAtivo();
}

function adicionarSerieExtra(exIdx) {
  if (!estado.treinoAtivo) return;
  const item = estado.treinoAtivo.itens[exIdx];
  const ultima = item.series[item.series.length - 1];
  item.series.push({
    id: 's-' + Date.now() + Math.random(),
    numero: item.series.length + 1,
    tipo: 'normal',
    reps: ultima ? ultima.reps : 10,
    peso: ultima ? ultima.peso : 40,
    modoCarga: ultima ? ultima.modoCarga : 'total',
    pesoBarra: ultima ? ultima.pesoBarra : 20,
    rpe: 0,
    concluida: false,
    opcoesAbertas: false
  });
  renderizarExerciciosTreinoAtivo();
  atualizarProgressoTreinoAtivo();
}

function alternarConclusaoSerie(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  s.concluida = !s.concluida;
  renderizarExerciciosTreinoAtivo();
  atualizarProgressoTreinoAtivo();

  if (s.concluida) {
    const item = estado.treinoAtivo.itens[exIdx];
    iniciarDescansoTimer(item.descansoSegundos || 90);
  }
}

function ciclarTipoSerie(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  const tipos = ['normal', 'aquecimento', 'falha', 'dropset'];
  const curIdx = tipos.indexOf(s.tipo);
  s.tipo = tipos[(curIdx + 1) % tipos.length];
  renderizarExerciciosTreinoAtivo();
}

function alterarRepsSeriePrompt(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  s.reps = s.reps >= 15 ? 8 : s.reps + 2;
  renderizarExerciciosTreinoAtivo();
}

function alterarPesoSeriePrompt(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  s.peso = s.peso >= 100 ? 40 : s.peso + 5;
  renderizarExerciciosTreinoAtivo();
}

function alternarOpcoesSerie(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  s.opcoesAbertas = !s.opcoesAbertas;
  renderizarExerciciosTreinoAtivo();
}

function alternarModoCargaSerie(exIdx, sIdx) {
  if (!estado.treinoAtivo) return;
  const s = estado.treinoAtivo.itens[exIdx].series[sIdx];
  s.modoCarga = s.modoCarga === 'total' ? 'por_lado' : 'total';
  renderizarExerciciosTreinoAtivo();
}

function atualizarProgressoTreinoAtivo() {
  if (!estado.treinoAtivo) return;
  const total = estado.treinoAtivo.itens.reduce((acc, item) => acc + item.series.length, 0);
  const feitas = estado.treinoAtivo.itens.reduce((acc, item) => acc + item.series.filter(s => s.concluida).length, 0);

  const texto = document.getElementById('treino-progresso-texto');
  const barra = document.getElementById('treino-barra-progresso');
  if (texto) texto.textContent = `${feitas} de ${total} séries concluídas`;
  if (barra) {
    barra.max = Math.max(1, total);
    barra.value = feitas;
  }
}

function iniciarDescansoTimer(segundos) {
  clearInterval(estado.descansoTimerInterval);
  estado.descansoTempoRestante = segundos;
  atualizarDisplayDescanso();

  estado.descansoTimerInterval = setInterval(() => {
    estado.descansoTempoRestante--;
    atualizarDisplayDescanso();
    if (estado.descansoTempoRestante <= 0) {
      clearInterval(estado.descansoTimerInterval);
      exibirToastGeral('Tempo de descanso concluído!');
    }
  }, 1000);
}

function atualizarDisplayDescanso() {
  const el = document.getElementById('descanso-cronometro');
  if (el) el.textContent = formatarTempoSegundos(Math.max(0, estado.descansoTempoRestante));
}

function adicionarTempoDescanso(delta) {
  estado.descansoTempoRestante += delta;
  atualizarDisplayDescanso();
}

function pularDescanso() {
  clearInterval(estado.descansoTimerInterval);
  estado.descansoTempoRestante = 0;
  atualizarDisplayDescanso();
}

function abrirModalNomearTreinoLivre() {
  if (!estado.treinoAtivo) return;
  const novoNome = (estado.treinoAtivo.titulo === 'Treino livre') ? 'Treino Livre do Dia' : estado.treinoAtivo.titulo;
  estado.treinoAtivo.titulo = novoNome;
  document.getElementById('titulo-modo-treino').textContent = novoNome;
  exibirToastGeral('Nome atualizado.');
}

function perguntarCancelarTreino() {
  if (confirm('Cancelar o treino atual? Ele, suas séries e o cardio vinculado ficarão fora do histórico e das estatísticas.')) {
    cancelarTreinoAtivo();
  }
}

function cancelarTreinoAtivo() {
  clearInterval(estado.treinoTimerInterval);
  clearInterval(estado.descansoTimerInterval);
  estado.treinoAtivo = null;
  fecharModais();
  renderizarTela();
  exibirToastGeral('Treino cancelado sem registrar no histórico.');
}

function abrirResumoFinalizacaoTreino() {
  if (!estado.treinoAtivo) return;
  const painel = document.getElementById('resumo-metricas-painel');
  if (!painel) return;

  const total = estado.treinoAtivo.itens.reduce((acc, item) => acc + item.series.length, 0);
  const feitas = estado.treinoAtivo.itens.reduce((acc, item) => acc + item.series.filter(s => s.concluida).length, 0);
  const volumeTotal = estado.treinoAtivo.itens.reduce((acc, item) => {
    return acc + item.series.filter(s => s.concluida).reduce((sAcc, s) => sAcc + (s.peso * s.reps), 0);
  }, 0);

  painel.innerHTML = `
    <h3 style="font-size:16px; margin-bottom:10px;">${estado.treinoAtivo.titulo}</h3>
    <div class="grade-dupla">
      <div class="cartao-metrica">
        <span class="cartao-metrica-rotulo">Séries Concluídas</span>
        <strong class="cartao-metrica-valor">${feitas} <small>/ ${total}</small></strong>
      </div>
      <div class="cartao-metrica">
        <span class="cartao-metrica-rotulo">Volume Estimado</span>
        <strong class="cartao-metrica-valor">${volumeTotal.toLocaleString('pt-BR')} <small>kg</small></strong>
      </div>
    </div>
  `;

  abrirModal('modal-resumo-finalizacao');
}

function fecharModalResumoFinalizacao() {
  fecharModal('modal-resumo-finalizacao');
}

function concluirTreinoDefinitivo() {
  if (!estado.treinoAtivo) return;
  clearInterval(estado.treinoTimerInterval);
  clearInterval(estado.descansoTimerInterval);

  const duracaoMin = Math.max(1, Math.round(estado.treinoTempoSegundos / 60));
  const feitas = estado.treinoAtivo.itens.reduce((acc, item) => acc + item.series.filter(s => s.concluida).length, 0);
  const volumeTotal = estado.treinoAtivo.itens.reduce((acc, item) => {
    return acc + item.series.filter(s => s.concluida).reduce((sAcc, s) => sAcc + (s.peso * s.reps), 0);
  }, 0);

  const pesoInput = document.getElementById('finalizacao-peso');
  const calInput = document.getElementById('finalizacao-calorias');
  const peso = (pesoInput && parseFloat(pesoInput.value)) || 72.500;
  const cal = (calInput && parseInt(calInput.value)) || 420;

  const novoHistorico = {
    id: 'h-' + Date.now(),
    data: '2026-10-22',
    titulo: estado.treinoAtivo.titulo,
    duracaoMin,
    seriesConcluidas: feitas,
    volumeTotalKg: volumeTotal,
    calorias: cal,
    pesoCorporal: peso
  };

  estado.historicoTreinos.push(novoHistorico);
  estado.ultimoTreinoFinalizadoId = novoHistorico.id;
  estado.treinoAtivo = null;

  fecharModais();
  navegarPara('evolucao');
  exibirToastGeral(`Parabéns! Treino finalizado e salvo na aba Evolução.`);
}

function abrirModalDetalhesTreino(id) {
  const t = estado.historicoTreinos.find(item => item.id === id) || estado.historicoTreinos[estado.historicoTreinos.length - 1];
  const corpo = document.getElementById('corpo-modal-detalhes-treino');
  if (!corpo || !t) return;

  corpo.innerHTML = `
    <div class="painel-card painel-card-destaque">
      <div class="painel-cabecalho">
        <div>
          <h2>${t.titulo}</h2>
          <span>${formatarDataBr(t.data)} · Duração ${t.duracaoMin} min</span>
        </div>
      </div>
      <div class="grade-dupla">
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Volume Total</span>
          <strong class="cartao-metrica-valor">${t.volumeTotalKg.toLocaleString('pt-BR')} <small>kg</small></strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Séries Feitas</span>
          <strong class="cartao-metrica-valor">${t.seriesConcluidas} <small>séries</small></strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Gasto Calórico</span>
          <strong class="cartao-metrica-valor">${t.calorias} <small>kcal</small></strong>
        </div>
        <div class="cartao-metrica">
          <span class="cartao-metrica-rotulo">Peso Corporal</span>
          <strong class="cartao-metrica-valor">${t.pesoCorporal.toFixed(3)} <small>kg</small></strong>
        </div>
      </div>
    </div>
    <button type="button" class="botao-principal largura-total" onclick="fecharModais(); abrirModalCardsCompartilhaveis()">
      ${icones.share} Ver Card Pós-Treino
    </button>
  `;

  abrirModal('modal-detalhes-treino');
}

/* ==========================================================================
   FLUXO DE MEDIDAS: EDITOR, COMPLEMENTAÇÃO E CONFIRMAÇÃO ANTES/DEPOIS
   ========================================================================== */
function abrirEditorMedidas(dataEscolhida) {
  const hoje = '2026-10-22';
  const data = dataEscolhida || hoje;
  const inputData = document.getElementById('input-medida-data');
  if (inputData) inputData.value = data;

  carregarValoresNoFormularioMedidas(data);
  abrirModal('modal-editor-medidas');
}

function aoMudarDataEditorMedidas(novaData) {
  carregarValoresNoFormularioMedidas(novaData);
}

function carregarValoresNoFormularioMedidas(data) {
  const reg = estado.medidas.find(m => m.data === data) || {};
  document.getElementById('input-medida-peso').value = reg.peso !== undefined ? reg.peso.toFixed(3) : '';
  document.getElementById('input-medida-cintura').value = reg.cintura !== undefined ? reg.cintura.toFixed(2) : '';
  document.getElementById('input-medida-busto').value = reg.busto !== undefined ? reg.busto.toFixed(2) : '';
  document.getElementById('input-medida-abdomen').value = reg.abdomen !== undefined ? reg.abdomen.toFixed(2) : '';
  document.getElementById('input-medida-quadril').value = reg.quadril !== undefined ? reg.quadril.toFixed(2) : '';
  document.getElementById('input-medida-braco-d').value = reg.braco_d !== undefined ? reg.braco_d.toFixed(2) : '';
  document.getElementById('input-medida-braco-e').value = reg.braco_e !== undefined ? reg.braco_e.toFixed(2) : '';
  document.getElementById('input-medida-antebraco-d').value = reg.antebraco_d !== undefined ? reg.antebraco_d.toFixed(2) : '';
  document.getElementById('input-medida-antebraco-e').value = reg.antebraco_e !== undefined ? reg.antebraco_e.toFixed(2) : '';
  document.getElementById('input-medida-coxa-d').value = reg.coxa_d !== undefined ? reg.coxa_d.toFixed(2) : '';
  document.getElementById('input-medida-coxa-e').value = reg.coxa_e !== undefined ? reg.coxa_e.toFixed(2) : '';
  document.getElementById('input-medida-panturrilha-d').value = reg.panturrilha_d !== undefined ? reg.panturrilha_d.toFixed(2) : '';
  document.getElementById('input-medida-panturrilha-e').value = reg.panturrilha_e !== undefined ? reg.panturrilha_e.toFixed(2) : '';
}

function acaoSalvarEditorMedidas() {
  const data = document.getElementById('input-medida-data').value;
  if (!data) {
    exibirToastGeral('Por favor, escolha uma data.');
    return;
  }

  const parseOrUndefined = id => {
    const v = document.getElementById(id).value.trim();
    if (!v) return undefined;
    const num = parseFloat(v.replace(',', '.'));
    return isNaN(num) ? undefined : num;
  };

  const novaMedida = {
    data,
    peso: parseOrUndefined('input-medida-peso'),
    cintura: parseOrUndefined('input-medida-cintura'),
    busto: parseOrUndefined('input-medida-busto'),
    abdomen: parseOrUndefined('input-medida-abdomen'),
    quadril: parseOrUndefined('input-medida-quadril'),
    braco_d: parseOrUndefined('input-medida-braco-d'),
    braco_e: parseOrUndefined('input-medida-braco-e'),
    antebraco_d: parseOrUndefined('input-medida-antebraco-d'),
    antebraco_e: parseOrUndefined('input-medida-antebraco-e'),
    coxa_d: parseOrUndefined('input-medida-coxa-d'),
    coxa_e: parseOrUndefined('input-medida-coxa-e'),
    panturrilha_d: parseOrUndefined('input-medida-panturrilha-d'),
    panturrilha_e: parseOrUndefined('input-medida-panturrilha-e')
  };

  const regExistente = estado.medidas.find(m => m.data === data);

  if (regExistente) {
    // Identificar alterações reais de valores
    const camposMap = [
      ['peso', 'Peso Corporal', 'kg', 3],
      ['cintura', 'Cintura', 'cm', 2],
      ['busto', 'Busto / Tórax', 'cm', 2],
      ['abdomen', 'Abdômen', 'cm', 2],
      ['quadril', 'Quadril', 'cm', 2],
      ['braco_d', 'Braço Direito', 'cm', 2],
      ['braco_e', 'Braço Esquerdo', 'cm', 2],
      ['antebraco_d', 'Antebraço Dir.', 'cm', 2],
      ['antebraco_e', 'Antebraço Esq.', 'cm', 2],
      ['coxa_d', 'Coxa Direita', 'cm', 2],
      ['coxa_e', 'Coxa Esquerda', 'cm', 2],
      ['panturrilha_d', 'Panturrilha Dir.', 'cm', 2],
      ['panturrilha_e', 'Panturrilha Esq.', 'cm', 2]
    ];

    const alteracoes = [];
    camposMap.forEach(([campo, nome, unidade, dec]) => {
      const vNovo = novaMedida[campo];
      const vAntigo = regExistente[campo];
      if (vNovo !== undefined && vAntigo !== undefined && Math.abs(vNovo - vAntigo) > 0.0001) {
        alteracoes.push({
          campo,
          nome,
          unidade,
          antigo: vAntigo.toFixed(dec),
          novo: vNovo.toFixed(dec)
        });
      }
    });

    if (alteracoes.length > 0) {
      estado.medidaPendenteConfirmacao = {
        data,
        anterior: regExistente,
        nova: novaMedida,
        alteracoes
      };

      const corpoConfirmacao = document.getElementById('corpo-confirmacao-medidas');
      if (corpoConfirmacao) {
        corpoConfirmacao.innerHTML = `
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
            Atualizar as medidas de <strong>${formatarDataBr(data)}</strong>?
          </p>
          <table class="tabela-antes-depois">
            <thead>
              <tr>
                <th>Medida</th>
                <th>Antes</th>
                <th>Depois</th>
              </tr>
            </thead>
            <tbody>
              ${alteracoes.map(alt => `
                <tr>
                  <td><strong>${alt.nome}</strong></td>
                  <td style="color:var(--text-tertiary);">${alt.antigo} ${alt.unidade}</td>
                  <td class="mudanca">${alt.novo} ${alt.unidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="font-size:11px; color:var(--text-tertiary);">As demais medidas e campos em branco continuam inalterados.</p>
        `;
      }

      abrirModal('modal-confirmacao-medidas');
      return;
    }

    // Se nenhum valor foi alterado, mescla os campos novos (preserva em branco)
    Object.keys(novaMedida).forEach(k => {
      if (novaMedida[k] !== undefined) regExistente[k] = novaMedida[k];
    });
  } else {
    // Novo registro para data inédita
    estado.medidas.push(novaMedida);
    estado.medidas.sort((a, b) => a.data.localeCompare(b.data));
  }

  fecharModais();
  renderizarTela();
  exibirToastGeral(`Medidas de ${formatarDataBr(data)} salvas com sucesso!`);
}

function fecharModalConfirmacaoMedidas() {
  fecharModal('modal-confirmacao-medidas');
}

function confirmarAlteracaoMedidas() {
  if (!estado.medidaPendenteConfirmacao) return;
  const { data, anterior, nova } = estado.medidaPendenteConfirmacao;

  Object.keys(nova).forEach(k => {
    if (nova[k] !== undefined) anterior[k] = nova[k];
  });

  estado.medidaPendenteConfirmacao = null;
  fecharModais();
  renderizarTela();
  exibirToastGeral(`Medidas de ${formatarDataBr(data)} atualizadas com sucesso!`);
}

/* ==========================================================================
   FLUXO DE BIBLIOTECA: NOVO EXERCÍCIO E AJUDA
   ========================================================================== */
function abrirModalNovoExercicio() {
  document.getElementById('novo-ex-nome').value = '';
  document.getElementById('novo-ex-nota').value = '';
  abrirModal('modal-novo-exercicio');
}

function salvarNovoExercicioCatalogo() {
  const nome = document.getElementById('novo-ex-nome').value.trim();
  if (!nome) {
    exibirToastGeral('Informe o nome do exercício.');
    return;
  }

  const grupo = document.getElementById('novo-ex-grupo').value;
  const equip = document.getElementById('novo-ex-equipamento').value;
  const descanso = parseInt(document.getElementById('novo-ex-descanso').value) || 90;
  const nota = document.getElementById('novo-ex-nota').value.trim();

  estado.exerciciosCatalogo.push({
    id: 'ex-' + Date.now(),
    nome,
    grupo,
    equipamento: equip,
    tipo: grupo === 'Cardio' ? 'cardio' : 'forca',
    descansoPadrao: descanso,
    nota: nota || 'Exercício personalizado cadastrado no app.'
  });

  fecharModais();
  renderizarTela();
  exibirToastGeral(`Exercício "${nome}" adicionado com sucesso!`);
}

function abrirAjudaExercicio(id) {
  const ex = estado.exerciciosCatalogo.find(e => e.id === id);
  if (!ex) return;
  const corpo = document.getElementById('corpo-modal-ajuda-exercicio');
  if (!corpo) return;

  corpo.innerHTML = `
    <div class="painel-card painel-card-destaque">
      <h3 style="font-size:18px; margin-bottom:4px;">${ex.nome}</h3>
      <span class="badge" style="background:var(--brand-surface); color:var(--brand-primary);">${ex.grupo} · ${ex.equipamento}</span>
    </div>

    <div style="margin-top:16px;">
      <h4 style="font-size:13px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Instruções e Nota Técnica</h4>
      <p style="font-size:14px; line-height:1.7; color:var(--text-primary); margin-top:6px;">
        ${ex.nota}
      </p>
    </div>

    <div style="margin-top:16px;">
      <h4 style="font-size:13px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Descanso Recomendado</h4>
      <p style="font-size:14px; font-weight:700; color:var(--brand-primary); margin-top:4px;">
        ${ex.descansoPadrao} segundos
      </p>
    </div>
  `;

  abrirModal('modal-ajuda-exercicio');
}

/* ==========================================================================
   FLUXO DE CARDIO: REGISTRAR E MODALIDADES
   ========================================================================== */
function abrirEditorCardio() {
  abrirModal('modal-editor-cardio');
}

function aoMudarModalidadeCardio(tipo) {
  const grupoDist = document.getElementById('grupo-distancia-cardio');
  if (!grupoDist) return;
  grupoDist.hidden = (tipo === 'eliptico' || tipo === 'natacao');
}

function salvarCardio() {
  const tipoSelect = document.getElementById('tipo-cardio-select');
  const tipoNome = tipoSelect ? tipoSelect.options[tipoSelect.selectedIndex].text : 'Cardio';
  const dur = parseFloat(document.getElementById('duracao-cardio-min').value) || 30;
  const dist = parseFloat(document.getElementById('distancia-cardio-km').value) || 0;
  const cal = parseInt(document.getElementById('calorias-cardio').value) || 300;
  const fc = parseInt(document.getElementById('fc-media-cardio').value) || 140;
  const obs = document.getElementById('obs-cardio').value.trim();

  estado.sessoesCardio.push({
    id: 'c-' + Date.now(),
    tipo: tipoNome,
    data: '2026-10-22',
    duracaoMin: dur,
    distanciaKm: dist,
    calorias: cal,
    fcMedia: fc,
    obs: obs || `Sessão de ${tipoNome} · ${dur} min`
  });

  fecharModais();
  renderizarTela();
  exibirToastGeral(`Sessão de cardio salva com sucesso!`);
}

/* ==========================================================================
   FLUXO DE BACKUP E RESTAURAÇÃO (JSON Criptografado e JSON Aberto)
   ========================================================================== */
function abrirModalBackup() {
  const corpo = document.getElementById('corpo-modal-backup');
  if (!corpo) return;

  corpo.innerHTML = `
    <p class="nota-explicativa">
      Seu backup criptografado usa derivação de chave segura e cifra AES-GCM (envelope JSON). Sem a senha, não é possível recuperar os dados.
    </p>

    <div class="formulario">
      <div class="campo-grupo">
        <label for="backup-senha-input">Senha de Criptografia</label>
        <input type="password" id="backup-senha-input" class="campo-input" placeholder="Mínimo de 12 caracteres" oninput="validarForcaSenhaBackup(this.value)" />
        <small id="backup-senha-ajuda" class="campo-ajuda">Pelo menos 12 caracteres</small>
      </div>

      <div class="campo-grupo">
        <label for="backup-confirmacao-input">Confirmar Senha</label>
        <input type="password" id="backup-confirmacao-input" class="campo-input" placeholder="Digite a mesma senha" oninput="validarCoincidenciaSenhaBackup()" />
        <small id="backup-confirmacao-ajuda" class="campo-ajuda"></small>
      </div>

      <label class="opcao-checkbox">
        <input type="checkbox" id="backup-incluir-fotos" checked />
        <span>Incluir fotos de exercícios</span>
      </label>

      <label class="opcao-checkbox">
        <input type="checkbox" id="backup-incluir-lixeira" />
        <span>Incluir itens na lixeira / removidos recentemente (desligado por padrão)</span>
      </label>

      <div class="aviso-banner aviso-destrutivo" style="margin-top:10px;">
        <strong>Atenção:</strong> Se perder esta senha, o arquivo de backup não poderá ser descriptografado em hipótese alguma.
      </div>

      <button type="button" id="btn-gerar-backup" class="botao-principal largura-total" disabled onclick="executarGeracaoBackup()">
        Gerar e Baixar Backup Criptografado (.json)
      </button>
    </div>
  `;

  abrirModal('modal-backup');
}

function validarForcaSenhaBackup(senha) {
  const ajuda = document.getElementById('backup-senha-ajuda');
  if (!ajuda) return;
  if (senha.length < 12) {
    ajuda.textContent = `Faltam ${12 - senha.length} caracteres para o mínimo exigido (12).`;
    ajuda.style.color = 'var(--text-tertiary)';
  } else {
    ajuda.textContent = 'Comprimento adequado (>= 12 caracteres).';
    ajuda.style.color = 'var(--brand-primary)';
  }
  validarCoincidenciaSenhaBackup();
}

function validarCoincidenciaSenhaBackup() {
  const senha = document.getElementById('backup-senha-input').value;
  const conf = document.getElementById('backup-confirmacao-input').value;
  const ajuda = document.getElementById('backup-confirmacao-ajuda');
  const btn = document.getElementById('btn-gerar-backup');
  if (!ajuda || !btn) return;

  if (!conf) {
    ajuda.textContent = '';
    btn.disabled = true;
    return;
  }

  if (senha === conf && senha.length >= 12) {
    ajuda.textContent = 'As senhas coincidem perfeitamente.';
    ajuda.style.color = 'var(--brand-primary)';
    btn.disabled = false;
  } else {
    ajuda.textContent = 'As senhas não coincidem ou têm menos de 12 caracteres.';
    ajuda.style.color = 'var(--destructive-text)';
    btn.disabled = true;
  }
}

function executarGeracaoBackup() {
  fecharModais();
  exibirToastGeral('Backup criptografado (.json) gerado com sucesso!');
}

function abrirModalImportarBackup() {
  const corpo = document.getElementById('corpo-modal-importar');
  if (!corpo) return;

  corpo.innerHTML = `
    <p class="nota-explicativa">
      Restaure registros a partir de um arquivo JSON criptografado ou JSON aberto/legível.
    </p>

    <div class="formulario">
      <div class="campo-grupo">
        <label for="import-tipo-arquivo">Tipo do Arquivo de Backup</label>
        <select id="import-tipo-arquivo" class="campo-input" onchange="aoMudarTipoArquivoImportacao(this.value)">
          <option value="json_criptografado" selected>JSON Criptografado (.json com envelope seguro)</option>
          <option value="json_legivel">JSON Aberto / Legível (.json em texto claro)</option>
        </select>
      </div>

      <div id="campo-senha-importacao" class="campo-grupo">
        <label for="import-senha-input">Senha de Descriptografia</label>
        <input type="password" id="import-senha-input" class="campo-input" placeholder="Senha usada na criação do backup" />
      </div>

      <div id="aviso-arquivo-legivel" class="aviso-banner aviso-destrutivo" hidden>
        <strong>Aviso de privacidade:</strong> Arquivos JSON abertos contêm seus dados de treino e saúde em texto claro.
      </div>

      <div class="campo-grupo">
        <span class="subtitulo-seletor">Modo de Restauração:</span>
        <label class="opcao-checkbox">
          <input type="radio" name="modo_import" value="mesclar" checked onchange="aoMudarModoImportacao('mesclar')" />
          <span>Mesclar com os dados atuais (preserva o que você já registrou)</span>
        </label>
        <label class="opcao-checkbox">
          <input type="radio" name="modo_import" value="substituir" onchange="aoMudarModoImportacao('substituir')" />
          <span>Substituir todos os dados (limpa o aparelho antes de importar)</span>
        </label>
      </div>

      <div id="aviso-substituir-sync" class="painel-card" style="background:var(--warning-bg); border-color:var(--warning-border); padding:12px;" hidden>
        <label class="opcao-checkbox" style="margin:0;">
          <input type="checkbox" id="aceite-pausa-sync" onchange="document.getElementById('btn-executar-importacao').disabled = !this.checked;" />
          <span style="font-size:12px; color:var(--warning-text); line-height:1.5;">
            Estou ciente de que a substituição de dados pausará a sincronização automática até minha revisão final.
          </span>
        </label>
      </div>

      <button type="button" id="btn-executar-importacao" class="botao-principal largura-total" onclick="executarImportacaoBackup()">
        Restaurar Dados
      </button>
    </div>
  `;

  abrirModal('modal-importar-backup');
}

function aoMudarTipoArquivoImportacao(tipo) {
  const campoSenha = document.getElementById('campo-senha-importacao');
  const avisoLegivel = document.getElementById('aviso-arquivo-legivel');
  if (campoSenha) campoSenha.hidden = (tipo === 'json_legivel');
  if (avisoLegivel) avisoLegivel.hidden = (tipo !== 'json_legivel');
}

function aoMudarModoImportacao(modo) {
  const avisoSubstituir = document.getElementById('aviso-substituir-sync');
  const btn = document.getElementById('btn-executar-importacao');
  if (!avisoSubstituir || !btn) return;

  if (modo === 'substituir') {
    avisoSubstituir.hidden = false;
    btn.disabled = !document.getElementById('aceite-pausa-sync').checked;
  } else {
    avisoSubstituir.hidden = true;
    btn.disabled = false;
  }
}

function executarImportacaoBackup() {
  fecharModais();
  renderizarTela();
  exibirToastGeral('Dados restaurados com sucesso a partir do arquivo JSON!');
}

/* ==========================================================================
   FLUXO DE PRIVACIDADE: LIXEIRA, ELIMINAÇÃO DEFINITIVA, LIMPEZA, EXCLUSÃO
   ========================================================================== */
function abrirModalPrivacidade() {
  renderizarConteudoModalPrivacidade();
  abrirModal('modal-privacidade');
}

function renderizarConteudoModalPrivacidade() {
  const corpo = document.getElementById('corpo-modal-privacidade');
  if (!corpo) return;

  corpo.innerHTML = `
    <!-- Seção Lixeira / Removidos -->
    <section class="painel-card">
      <div class="painel-cabecalho">
        <h2>Itens Removidos (Lixeira)</h2>
        <span>Retenção de 30 dias</span>
      </div>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
        Itens apagados permanecem retidos localmente por 30 dias antes da purga definitiva.
      </p>

      ${estado.itensRemovidos.length === 0 ? `
        <p style="font-size:12px; color:var(--text-tertiary); text-align:center; padding:10px;">A lixeira está vazia.</p>
      ` : estado.itensRemovidos.map(item => `
        <div style="padding:10px 0; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:13px; color:var(--text-primary); display:block;">${item.nome}</strong>
            <small style="font-size:11px; color:var(--text-secondary);">${item.tipo} · expira em ${item.diasRestantes} dias</small>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="botao-secundario" style="min-height:44px; padding:4px 10px; font-size:11px;" onclick="restaurarItemLixeira('${item.id}')">Restaurar</button>
            <button type="button" class="botao-destrutivo" style="min-height:44px; padding:4px 10px; font-size:11px;" onclick="abrirConfirmacaoEliminacaoDefinitiva('${item.id}')">Eliminar</button>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- Limpeza deste Aparelho -->
    <section class="painel-card">
      <div class="painel-cabecalho">
        <h2>Limpar Este Aparelho</h2>
        <span>Armazenamento</span>
      </div>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:10px;">
        Remove dados deste dispositivo. Existem atualmente <strong>${estado.filaPendenteSync} envios pendentes</strong> na fila local que ainda não foram sincronizados.
      </p>
      <div class="campo-grupo">
        <label for="input-apagar-aparelho">Para confirmar, digite <strong>APAGAR APARELHO</strong></label>
        <input type="text" id="input-apagar-aparelho" class="campo-input" placeholder="APAGAR APARELHO" oninput="validarTextoLimpezaAparelho(this.value)" />
      </div>
      <button type="button" id="btn-apagar-aparelho" class="botao-destrutivo largura-total" disabled onclick="executarLimpezaAparelho()">
        Limpar Dados Deste Aparelho
      </button>
    </section>

    <!-- Limpeza de Dados do Navegador (Legado) -->
    <section class="painel-card">
      <div class="painel-cabecalho">
        <h2>Dados Antigos do Navegador (Legado)</h2>
        <span>Múltiplos perfis</span>
      </div>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:10px;">
        Esta ação remove registros antigos de versões legadas ou de outros perfis armazenados neste navegador. Digite <strong>APAGAR LEGADO</strong> para executar.
      </p>
      <div class="campo-grupo">
        <label for="input-apagar-legado">Digite <strong>APAGAR LEGADO</strong></label>
        <input type="text" id="input-apagar-legado" class="campo-input" placeholder="APAGAR LEGADO" oninput="validarTextoLimpezaLegado(this.value)" />
      </div>
      <button type="button" id="btn-apagar-legado" class="botao-destrutivo largura-total" disabled onclick="executarLimpezaLegado()">
        Limpar Armazenamento Legado
      </button>
    </section>

    <!-- Exclusão Definitiva de Conta -->
    <section class="painel-card" style="border-color:var(--destructive-border);">
      <div class="painel-cabecalho">
        <h2 style="color:var(--destructive-text);">Excluir Minha Conta</h2>
        <span>Irreversível</span>
      </div>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:10px;">
        Exclui seus dados na nuvem e revoga acessos. Exige confirmação da senha e digitação do comando.
      </p>
      <div class="campo-grupo">
        <label for="input-senha-exclusao">Sua Senha Atual</label>
        <input type="password" id="input-senha-exclusao" class="campo-input" placeholder="Digite sua senha" />
      </div>
      <div class="campo-grupo">
        <label for="input-excluir-conta">Digite <strong>EXCLUIR MINHA CONTA</strong></label>
        <input type="text" id="input-excluir-conta" class="campo-input" placeholder="EXCLUIR MINHA CONTA" oninput="validarTextoExclusaoConta(this.value)" />
      </div>
      <label class="opcao-checkbox">
        <input type="checkbox" id="check-simular-falha-servidor" onchange="estado.simularFalhaExclusaoServidor = this.checked;" />
        <span style="font-size:12px; color:var(--text-secondary);">Simular falha de rede/servidor (para comprovar preservação dos dados locais)</span>
      </label>
      <button type="button" id="btn-excluir-conta" class="botao-destrutivo largura-total" disabled onclick="executarExclusaoConta()">
        Excluir Conta Definitivamente
      </button>
    </section>

    <!-- O que não é apagado -->
    <section class="painel-card" style="background:var(--bg-surface-sunken);">
      <h3 style="font-size:13px; color:var(--text-secondary); margin-bottom:6px;">O que não é apagado:</h3>
      <p style="font-size:11px; color:var(--text-tertiary); line-height:1.6; margin:0;">
        Backups e logs de segurança mantidos temporariamente pelo provedor de nuvem em cumprimento a obrigações legais, e cópias locais salvas em outros aparelhos não conectados.
      </p>
    </section>
  `;
}

function restaurarItemLixeira(id) {
  const idx = estado.itensRemovidos.findIndex(item => item.id === id);
  if (idx < 0) return;
  const item = estado.itensRemovidos.splice(idx, 1)[0];
  renderizarConteudoModalPrivacidade();
  exibirToastGeral(`"${item.nome}" restaurado com sucesso.`);
}

function abrirConfirmacaoEliminacaoDefinitiva(id) {
  const item = estado.itensRemovidos.find(i => i.id === id);
  if (!item) return;
  estado.itemPendenteEliminacao = item;
  const textoEl = document.getElementById('texto-item-a-eliminar');
  if (textoEl) textoEl.textContent = `Item: "${item.nome}" (${item.tipo})`;
  abrirModal('modal-confirmar-eliminacao');
}

function fecharModalConfirmarEliminacao() {
  estado.itemPendenteEliminacao = null;
  fecharModal('modal-confirmar-eliminacao');
}

function executarEliminacaoDefinitiva() {
  if (!estado.itemPendenteEliminacao) return;
  const id = estado.itemPendenteEliminacao.id;
  const idx = estado.itensRemovidos.findIndex(i => i.id === id);
  if (idx >= 0) {
    estado.itensRemovidos.splice(idx, 1);
  }
  estado.itemPendenteEliminacao = null;
  fecharModal('modal-confirmar-eliminacao');
  renderizarConteudoModalPrivacidade();
  exibirToastGeral('Item eliminado definitivamente da lixeira.');
}

function validarTextoLimpezaAparelho(v) {
  const btn = document.getElementById('btn-apagar-aparelho');
  if (btn) btn.disabled = (v.trim() !== 'APAGAR APARELHO');
}

function executarLimpezaAparelho() {
  fecharModais();
  exibirToastGeral('Armazenamento deste aparelho limpo com sucesso.');
}

function validarTextoLimpezaLegado(v) {
  const btn = document.getElementById('btn-apagar-legado');
  if (btn) btn.disabled = (v.trim() !== 'APAGAR LEGADO');
}

function executarLimpezaLegado() {
  fecharModais();
  exibirToastGeral('Registros do armazenamento legado removidos.');
}

function validarTextoExclusaoConta(v) {
  const btn = document.getElementById('btn-excluir-conta');
  if (btn) btn.disabled = (v.trim() !== 'EXCLUIR MINHA CONTA');
}

function executarExclusaoConta() {
  if (estado.simularFalhaExclusaoServidor) {
    exibirToastGeral('Falha de conexão com o servidor. Seus dados locais foram integralmente preservados no aparelho.');
    return;
  }
  fecharModais();
  exibirToastGeral('Conta excluída com sucesso dos servidores.');
}

/* ==========================================================================
   FLUXO DE CONTA E ACESSO: ENTRAR, CADASTRO COM CONFIRMAÇÃO, RECUPERAÇÃO
   ========================================================================== */
function abrirModalConta() {
  renderizarConteudoModalConta();
  abrirModal('modal-conta');
}

function renderizarConteudoModalConta() {
  const corpo = document.getElementById('corpo-modal-conta');
  if (!corpo) return;

  corpo.innerHTML = `
    <div class="abas-segmentadas" role="tablist">
      <button class="${estado.modoConta === 'entrar' ? 'ativo' : ''}" role="tab" onclick="estado.modoConta = 'entrar'; renderizarConteudoModalConta();">Entrar</button>
      <button class="${estado.modoConta === 'cadastro' ? 'ativo' : ''}" role="tab" onclick="estado.modoConta = 'cadastro'; renderizarConteudoModalConta();">Cadastrar</button>
      <button class="${estado.modoConta === 'recuperar' ? 'ativo' : ''}" role="tab" onclick="estado.modoConta = 'recuperar'; estado.etapaRecuperacao = 1; renderizarConteudoModalConta();">Recuperar</button>
    </div>

    ${estado.modoConta === 'cadastro' ? `
      <div class="formulario">
        <div class="campo-grupo">
          <label for="cadastro-nome">Nome ou como quer ser chamado</label>
          <input type="text" id="cadastro-nome" class="campo-input" placeholder="Ex.: Breno" required />
        </div>
        <div class="campo-grupo">
          <label for="cadastro-email">E-mail</label>
          <input type="email" id="cadastro-email" class="campo-input" placeholder="seu@email.com" required />
        </div>
        <div class="campo-grupo">
          <label for="cadastro-senha">Senha</label>
          <div class="campo-senha-container">
            <input type="password" id="cadastro-senha" class="campo-input" placeholder="Mínimo de 8 caracteres" oninput="validarSenhasCadastro()" />
            <button type="button" class="campo-senha-alternar" aria-label="Mostrar ou ocultar senha" onclick="alternarVisibilidadeSenha('cadastro-senha')">${icones.eye}</button>
          </div>
        </div>
        <div class="campo-grupo">
          <label for="cadastro-confirmar-senha">Confirmar Senha</label>
          <div class="campo-senha-container">
            <input type="password" id="cadastro-confirmar-senha" class="campo-input" placeholder="Repita a mesma senha" oninput="validarSenhasCadastro()" />
            <button type="button" class="campo-senha-alternar" aria-label="Mostrar ou ocultar confirmação" onclick="alternarVisibilidadeSenha('cadastro-confirmar-senha')">${icones.eye}</button>
          </div>
          <small id="cadastro-ajuda-senha" class="campo-ajuda"></small>
        </div>

        <details class="painel-card" style="margin-top:4px;">
          <summary style="font-size:12px; font-weight:600; cursor:pointer;">Perfil Inicial (Opcional)</summary>
          <div class="grade-dupla" style="padding-top:10px;">
            <div class="campo-grupo">
              <label for="cadastro-altura">Altura (cm)</label>
              <input type="number" id="cadastro-altura" class="campo-input" placeholder="Ex.: 178" />
            </div>
            <div class="campo-grupo">
              <label for="cadastro-peso">Peso Inicial (kg)</label>
              <input type="number" step="0.001" id="cadastro-peso" class="campo-input" placeholder="Ex.: 72,500" />
            </div>
          </div>
        </details>

        <button type="button" id="btn-submeter-cadastro" class="botao-principal largura-total" onclick="executarCadastroConta()">
          Criar Minha Conta
        </button>
      </div>
    ` : estado.modoConta === 'recuperar' ? `
      <div class="formulario">
        ${estado.etapaRecuperacao === 1 ? `
          <p class="nota-explicativa">Informe seu e-mail para receber o código de recuperação.</p>
          <div class="campo-grupo">
            <label for="recuperar-email">E-mail Cadastrado</label>
            <input type="email" id="recuperar-email" class="campo-input" placeholder="seu@email.com" />
          </div>
          <button type="button" class="botao-principal largura-total" onclick="estado.etapaRecuperacao = 2; renderizarConteudoModalConta();">
            Enviar Código de Recuperação
          </button>
        ` : `
          <p class="nota-explicativa">Código de 6 dígitos enviado para seu e-mail. Digite o código e a nova senha.</p>
          <div class="campo-grupo">
            <label for="recuperar-codigo">Código de 6 dígitos</label>
            <input type="text" id="recuperar-codigo" class="campo-input" maxlength="6" placeholder="Ex.: 491823" style="font-size:18px; text-align:center; font-family:var(--fonte-mono); font-weight:700;" />
          </div>
          <div class="campo-grupo">
            <label for="recuperar-nova-senha">Nova Senha</label>
            <input type="password" id="recuperar-nova-senha" class="campo-input" placeholder="Mínimo de 8 caracteres" />
          </div>
          <button type="button" class="botao-principal largura-total" onclick="executarConclusaoRecuperacao()">
            Salvar Nova Senha
          </button>
        `}
      </div>
    ` : `
      <!-- Modo Entrar -->
      <div class="formulario">
        <div class="campo-grupo">
          <label for="login-email">E-mail</label>
          <input type="email" id="login-email" class="campo-input" placeholder="seu@email.com" />
        </div>
        <div class="campo-grupo">
          <label for="login-senha">Senha</label>
          <div class="campo-senha-container">
            <input type="password" id="login-senha" class="campo-input" placeholder="Sua senha" />
            <button type="button" class="campo-senha-alternar" aria-label="Mostrar ou ocultar senha" onclick="alternarVisibilidadeSenha('login-senha')">${icones.eye}</button>
          </div>
        </div>
        <button type="button" class="botao-principal largura-total" onclick="fecharModais(); exibirToastGeral('Login efetuado com sucesso!');">
          Entrar no Vida em Dia
        </button>
        <button type="button" class="botao-secundario largura-total" style="border:0;" onclick="estado.modoConta = 'recuperar'; estado.etapaRecuperacao = 1; renderizarConteudoModalConta();">
          Esqueceu sua senha?
        </button>
      </div>
    `}
  `;
}

function validarSenhasCadastro() {
  const senha = document.getElementById('cadastro-senha').value;
  const conf = document.getElementById('cadastro-confirmar-senha').value;
  const ajuda = document.getElementById('cadastro-ajuda-senha');
  const btn = document.getElementById('btn-submeter-cadastro');
  if (!ajuda || !btn) return;

  if (senha.length < 8) {
    ajuda.textContent = `A senha precisa ter no mínimo 8 caracteres (faltam ${8 - senha.length}).`;
    ajuda.style.color = 'var(--text-tertiary)';
    btn.disabled = true;
    return;
  }

  if (!conf) {
    ajuda.textContent = 'Confirme sua senha.';
    btn.disabled = true;
    return;
  }

  if (senha === conf) {
    ajuda.textContent = 'As senhas coincidem.';
    ajuda.style.color = 'var(--brand-primary)';
    btn.disabled = false;
  } else {
    ajuda.textContent = 'As senhas não coincidem.';
    ajuda.style.color = 'var(--destructive-text)';
    btn.disabled = true;
  }
}

function executarCadastroConta() {
  fecharModais();
  exibirToastGeral('Conta criada com sucesso! Verifique seu e-mail para confirmação.');
}

function executarConclusaoRecuperacao() {
  fecharModais();
  exibirToastGeral('Senha redefinida com sucesso!');
}

function abrirModalCardsCompartilhaveis() {
  abrirModal('modal-cards-compartilhar');
}

/* ==========================================================================
   GERENCIAMENTO ACESSÍVEL DE MODAIS (INERT, RESTAURAÇÃO DE FOCO E TAB TRAP)
   ========================================================================== */
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (!modal) return;

  // Guarda elemento com foco atual se não houver modal anterior
  if (estado.pilhaModais.length === 0) {
    estado.ultimoFoco = document.activeElement;
    const moldura = document.getElementById('dispositivo-moldura');
    if (moldura) moldura.setAttribute('inert', '');
  } else {
    // Torna modal anterior inerte
    const anterior = estado.pilhaModais[estado.pilhaModais.length - 1];
    anterior.setAttribute('inert', '');
  }

  estado.pilhaModais.push(modal);
  // A ordem de criação no DOM não pode colocar um painel antigo por cima
  // de um formulário recém-aberto. A pilha também determina a camada visual.
  modal.style.zIndex = String(200 + estado.pilhaModais.length);
  modal.removeAttribute('inert');
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden', 'false');
  void modal.offsetWidth; // Força reflow
  modal.classList.add('aberto');

  // Foco no primeiro elemento focável
  const focavel = modal.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
  if (focavel) focavel.focus();
}

function fecharModal(idModal) {
  const modal = document.getElementById(idModal);
  if (!modal) return;

  modal.classList.remove('aberto');
  modal.setAttribute('hidden', '');
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('inert', '');

  const idx = estado.pilhaModais.indexOf(modal);
  if (idx >= 0) estado.pilhaModais.splice(idx, 1);

  if (estado.pilhaModais.length > 0) {
    // Restaura o modal anterior
    const topo = estado.pilhaModais[estado.pilhaModais.length - 1];
    topo.removeAttribute('inert');
    const focavel = topo.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
    if (focavel) focavel.focus();
  } else {
    // Remove inert do app principal e restaura foco original
    const moldura = document.getElementById('dispositivo-moldura');
    if (moldura) moldura.removeAttribute('inert');
    if (estado.ultimoFoco && typeof estado.ultimoFoco.focus === 'function') {
      estado.ultimoFoco.focus();
      estado.ultimoFoco = null;
    }
  }
}

function fecharModais() {
  while (estado.pilhaModais.length > 0) {
    const topo = estado.pilhaModais[estado.pilhaModais.length - 1];
    fecharModal(topo.id);
  }
}

function alternarVisibilidadeSenha(idInput) {
  const input = document.getElementById(idInput);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function adicionarOuvintesGlobais() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (estado.pilhaModais.length > 0) {
        const topo = estado.pilhaModais[estado.pilhaModais.length - 1];
        fecharModal(topo.id);
      }
    }

    // Contenção de foco por Tab / Shift+Tab dentro do modal ativo
    if (e.key === 'Tab' && estado.pilhaModais.length > 0) {
      const modalAtivo = estado.pilhaModais[estado.pilhaModais.length - 1];
      const focaveis = Array.from(modalAtivo.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'));
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        }
      } else {
        if (document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }
  });
}

// Utilitários de Notificação In-App
function exibirToastGeral(mensagem) {
  let toast = document.getElementById('toast-app-notificacao');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-app-notificacao';
    toast.className = 'notificacao-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('visivel');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visivel');
  }, 3500);
}

// Utilitários de Formatação
function formatarTempoSegundos(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatarDataBr(dataIso) {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarKg(val) {
  return (val !== undefined && val !== null) ? val.toFixed(3).replace('.', ',') : '—';
}

function formatarCm(val) {
  return (val !== undefined && val !== null) ? val.toFixed(2).replace('.', ',') : '—';
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', iniciarApp);
