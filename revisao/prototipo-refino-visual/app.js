/**
 * app.js — Controlador do Segundo Protótipo (Refino Visual Fiel ao App)
 * - Roteamento completo por Hash (#hoje, #treino, #comida, #medidas, #evolucao, #configuracoes, #componentes, popups)
 * - Suporte a temas Claro/Escuro via data-tema e hash (?tema=claro|escuro)
 * - Suporte a modos Visitante e Usuário (?modo=visitante)
 * - Gerenciamento acessível de modais (inert no fundo, foco preso, Esc fecha, foco restaurado)
 * - Simulações interativas sem alert()
 * - Alvos de toque >= 44px e campos de texto >= 16px
 */

(function () {
  'use strict';

  // Estado da aplicação simulada
  const estado = {
    tema: 'escuro',
    visitante: true,
    abaAtual: 'Hoje',
    subAbaTreino: 'fichas',
    visaoMedidas: 'resumo',
    subAbaMedidas: 'registros',
    subAbaEvolucao: 'historico',
    modalAberto: null,
    ultimoFoco: null
  };

  // Elementos principais do DOM
  const appRoot = document.getElementById('app-root');
  const btnTema = document.getElementById('btn-tema');
  const btnTemaIcone = document.getElementById('btn-tema-icone');
  const navBotoes = document.querySelectorAll('.navegacao button');
  const paginas = document.querySelectorAll('.tela-pagina');
  const modais = document.querySelectorAll('dialog.painel-modal');

  function init() {
    configurarTema();
    configurarNavegacao();
    configurarMedidasAbas();
    configurarModais();
    configurarAcoesInterativas();

    window.addEventListener('hashchange', processarHash);
    processarHash();
  }

  function configurarTema() {
    btnTema?.addEventListener('click', () => {
      const novoTema = estado.tema === 'escuro' ? 'claro' : 'escuro';
      definirTema(novoTema, true);
    });
  }

  function definirTema(tema, atualizarHash = false) {
    estado.tema = tema;
    document.documentElement.setAttribute('data-tema', tema);
    if (btnTemaIcone) {
      btnTemaIcone.textContent = tema === 'escuro' ? '☀️' : '🌙';
    }
    if (atualizarHash) {
      const hashAtual = window.location.hash.split('?')[0] || '#hoje';
      window.location.hash = `${hashAtual}?tema=${tema}`;
    }
  }

  function configurarNavegacao() {
    navBotoes.forEach(btn => {
      btn.addEventListener('click', () => {
        const rota = btn.getAttribute('data-rota');
        if (rota) window.location.hash = rota;
      });
    });

    const btnConfigCabecalho = document.getElementById('btn-cabecalho-config');
    btnConfigCabecalho?.addEventListener('click', () => {
      if (window.location.hash.startsWith('#configuracoes')) {
        window.location.hash = '#hoje';
      } else {
        window.location.hash = '#configuracoes';
      }
    });

    // Abas de Treino
    const abasTreino = document.querySelectorAll('#abas-treino-secao button');
    abasTreino.forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-sub');
        if (sub) {
          window.location.hash = sub === 'fichas' ? '#treino' : sub === 'biblioteca' ? '#treino-exercicios' : '#treino-cardio';
        }
      });
    });

    // Abas de Evolução
    const abasEvolucao = document.querySelectorAll('#abas-evolucao-secao button');
    abasEvolucao.forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-sub');
        if (sub) {
          window.location.hash = sub === 'historico' ? '#evolucao' : '#evolucao-exercicios';
        }
      });
    });
  }

  function configurarMedidasAbas() {
    const btnResumo = document.getElementById('aba-medidas-resumo');
    const btnEvolucao = document.getElementById('aba-medidas-evolucao');
    const btnHistorico = document.getElementById('aba-medidas-historico');

    const secResumo = document.getElementById('visao-medidas-resumo');
    const secHistorico = document.getElementById('visao-medidas-historico');

    function alternarVisao(visao) {
      estado.visaoMedidas = visao;
      btnResumo?.setAttribute('aria-pressed', visao === 'resumo' ? 'true' : 'false');
      btnEvolucao?.setAttribute('aria-pressed', visao === 'evolucao' ? 'true' : 'false');
      btnHistorico?.setAttribute('aria-pressed', visao === 'historico' ? 'true' : 'false');

      if (secResumo) secResumo.style.display = visao === 'resumo' ? 'block' : 'none';
      if (secHistorico) secHistorico.style.display = visao === 'historico' ? 'block' : 'none';
    }

    btnResumo?.addEventListener('click', () => {
      window.location.hash = '#medidas';
      alternarVisao('resumo');
    });

    btnHistorico?.addEventListener('click', () => {
      window.location.hash = '#medidas-historico';
      alternarVisao('historico');
    });

    btnEvolucao?.addEventListener('click', () => {
      alternarVisao('resumo'); // Visualização padrão
    });

    // Sub-abas de Histórico: Registros vs Comparar datas
    const btnSubRegistros = document.getElementById('sub-historico-registros');
    const btnSubComparar = document.getElementById('sub-historico-comparar');
    const subRegistros = document.getElementById('medidas-sub-registros');
    const subComparar = document.getElementById('medidas-sub-comparar');

    btnSubRegistros?.addEventListener('click', () => {
      window.location.hash = '#medidas-historico';
      btnSubRegistros.setAttribute('aria-pressed', 'true');
      btnSubComparar?.setAttribute('aria-pressed', 'false');
      if (subRegistros) subRegistros.style.display = 'grid';
      if (subComparar) subComparar.style.display = 'none';
    });

    btnSubComparar?.addEventListener('click', () => {
      window.location.hash = '#medidas-comparar';
      btnSubRegistros?.setAttribute('aria-pressed', 'false');
      btnSubComparar.setAttribute('aria-pressed', 'true');
      if (subRegistros) subRegistros.style.display = 'none';
      if (subComparar) subComparar.style.display = 'block';
    });
  }

  function processarHash() {
    const hashCompleto = window.location.hash || '#hoje';
    const [rotaLimpa, queryString] = hashCompleto.split('?');

    if (queryString) {
      const params = new URLSearchParams(queryString);
      if (params.has('tema')) {
        definirTema(params.get('tema'), false);
      }
      if (params.has('modo')) {
        estado.visitante = params.get('modo') === 'visitante';
        const aviso = document.querySelector('.aviso-modo-visitante');
        if (aviso) aviso.style.display = estado.visitante ? 'block' : 'none';
      }
    }

    if (rotaLimpa.startsWith('#popup-')) {
      abrirModalPorId(rotaLimpa.replace('#', ''));
      return;
    } else {
      fecharModalAtivo(false);
    }

    const btnConfigCabecalho = document.getElementById('btn-cabecalho-config');
    if (btnConfigCabecalho) {
      btnConfigCabecalho.setAttribute('aria-expanded', rotaLimpa.startsWith('#configuracoes') ? 'true' : 'false');
    }

    let telaId = 'tela-hoje';
    let tituloH1 = 'Olá, vamos cuidar de você?';
    let abaPrincipal = 'Hoje';

    if (rotaLimpa === '#hoje') {
      telaId = 'tela-hoje';
      tituloH1 = 'Olá, vamos cuidar de você?';
      abaPrincipal = 'Hoje';
    } else if (rotaLimpa === '#treino-andamento' || rotaLimpa === '#modo-treino') {
      telaId = 'tela-treino-andamento';
      tituloH1 = 'Treino em andamento';
      abaPrincipal = 'Treino';
    } else if (rotaLimpa.startsWith('#treino')) {
      telaId = 'tela-treino';
      tituloH1 = 'Treino';
      abaPrincipal = 'Treino';
      estado.subAbaTreino = rotaLimpa === '#treino-exercicios' ? 'biblioteca' : rotaLimpa === '#treino-cardio' ? 'cardio' : 'fichas';
      atualizarSubAbaTreino();
    } else if (rotaLimpa === '#comida') {
      telaId = 'tela-comida';
      tituloH1 = 'Comida';
      abaPrincipal = 'Comida';
    } else if (rotaLimpa.startsWith('#medidas')) {
      telaId = 'tela-medidas';
      tituloH1 = 'Medidas';
      abaPrincipal = 'Medidas';
      atualizarRotaMedidas(rotaLimpa);
    } else if (rotaLimpa.startsWith('#evolucao')) {
      telaId = 'tela-evolucao';
      tituloH1 = 'Evolução';
      abaPrincipal = 'Evolução';
      estado.subAbaEvolucao = rotaLimpa === '#evolucao-exercicios' ? 'exercicios' : 'historico';
      atualizarSubAbaEvolucao();
    } else if (rotaLimpa.startsWith('#configuracoes')) {
      telaId = 'tela-configuracoes';
      tituloH1 = 'Configurações';
      abaPrincipal = '';
      if (rotaLimpa.includes('-')) {
        const secao = rotaLimpa.replace('#configuracoes-', '');
        abrirSecaoConfig(secao);
      }
    } else if (rotaLimpa === '#componentes') {
      telaId = 'tela-componentes';
      tituloH1 = 'Referência de Componentes Refinados';
      abaPrincipal = '';
    } else if (rotaLimpa === '#login' || rotaLimpa === '#cadastro' || rotaLimpa === '#recuperar-senha' || rotaLimpa === '#confirmar-email') {
      telaId = 'tela-entrada';
      tituloH1 = rotaLimpa === '#login' ? 'Entrar na sua conta' : rotaLimpa === '#cadastro' ? 'Criar sua conta' : 'Recuperar acesso';
      abaPrincipal = '';
      mostrarSubEntrada(rotaLimpa.replace('#', ''));
    }

    paginas.forEach(p => {
      p.style.display = p.id === telaId ? 'block' : 'none';
    });

    const h1El = document.getElementById('titulo-pagina-h1');
    if (h1El) h1El.textContent = tituloH1;

    navBotoes.forEach(btn => {
      const nomeAba = btn.querySelector('span')?.textContent;
      if (nomeAba === abaPrincipal) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function atualizarRotaMedidas(rota) {
    const btnResumo = document.getElementById('aba-medidas-resumo');
    const btnHistorico = document.getElementById('aba-medidas-historico');
    const secResumo = document.getElementById('visao-medidas-resumo');
    const secHistorico = document.getElementById('visao-medidas-historico');
    const btnSubRegistros = document.getElementById('sub-historico-registros');
    const btnSubComparar = document.getElementById('sub-historico-comparar');
    const subRegistros = document.getElementById('medidas-sub-registros');
    const subComparar = document.getElementById('medidas-sub-comparar');

    if (rota === '#medidas-comparar') {
      btnResumo?.setAttribute('aria-pressed', 'false');
      btnHistorico?.setAttribute('aria-pressed', 'true');
      if (secResumo) secResumo.style.display = 'none';
      if (secHistorico) secHistorico.style.display = 'block';
      btnSubRegistros?.setAttribute('aria-pressed', 'false');
      btnSubComparar?.setAttribute('aria-pressed', 'true');
      if (subRegistros) subRegistros.style.display = 'none';
      if (subComparar) subComparar.style.display = 'block';
    } else if (rota === '#medidas-historico') {
      btnResumo?.setAttribute('aria-pressed', 'false');
      btnHistorico?.setAttribute('aria-pressed', 'true');
      if (secResumo) secResumo.style.display = 'none';
      if (secHistorico) secHistorico.style.display = 'block';
      btnSubRegistros?.setAttribute('aria-pressed', 'true');
      btnSubComparar?.setAttribute('aria-pressed', 'false');
      if (subRegistros) subRegistros.style.display = 'grid';
      if (subComparar) subComparar.style.display = 'none';
    } else {
      // #medidas padrão
      btnResumo?.setAttribute('aria-pressed', 'true');
      btnHistorico?.setAttribute('aria-pressed', 'false');
      if (secResumo) secResumo.style.display = 'block';
      if (secHistorico) secHistorico.style.display = 'none';
    }
  }

  function atualizarSubAbaTreino() {
    const secoes = {
      fichas: document.getElementById('treino-secao-fichas'),
      biblioteca: document.getElementById('treino-secao-biblioteca'),
      cardio: document.getElementById('treino-secao-cardio')
    };
    for (const [chave, el] of Object.entries(secoes)) {
      if (el) el.style.display = chave === estado.subAbaTreino ? 'block' : 'none';
    }
    const btns = document.querySelectorAll('#abas-treino-secao button');
    btns.forEach(b => {
      b.setAttribute('aria-pressed', b.getAttribute('data-sub') === estado.subAbaTreino ? 'true' : 'false');
    });
  }

  function atualizarSubAbaEvolucao() {
    const secHistorico = document.getElementById('evolucao-secao-historico');
    const secExercicios = document.getElementById('evolucao-secao-exercicios');
    if (secHistorico) secHistorico.style.display = estado.subAbaEvolucao === 'historico' ? 'block' : 'none';
    if (secExercicios) secExercicios.style.display = estado.subAbaEvolucao === 'exercicios' ? 'block' : 'none';
    const btns = document.querySelectorAll('#abas-evolucao-secao button');
    btns.forEach(b => {
      b.setAttribute('aria-pressed', b.getAttribute('data-sub') === estado.subAbaEvolucao ? 'true' : 'false');
    });
  }

  function abrirSecaoConfig(secaoId) {
    const secoes = document.querySelectorAll('.secao-config');
    secoes.forEach(s => {
      const botao = s.querySelector('button[id^="titulo-config-"]');
      const conteudo = s.querySelector('.conteudo-config');
      const match = s.getAttribute('data-secao') === secaoId;
      if (match) {
        s.classList.add('expandida');
        botao?.setAttribute('aria-expanded', 'true');
        if (conteudo) conteudo.hidden = false;
      } else {
        s.classList.remove('expandida');
        botao?.setAttribute('aria-expanded', 'false');
        if (conteudo) conteudo.hidden = true;
      }
    });
  }

  function mostrarSubEntrada(modo) {
    const grupos = document.querySelectorAll('.subtela-entrada');
    grupos.forEach(g => {
      g.style.display = g.getAttribute('data-modo') === modo ? 'block' : 'none';
    });
  }

  function configurarModais() {
    modais.forEach(modal => {
      const btnFechar = modal.querySelector('.botao-fechar-modal');
      btnFechar?.addEventListener('click', () => fecharModalAtivo(true));

      modal.addEventListener('cancel', e => {
        e.preventDefault();
        fecharModalAtivo(true);
      });

      modal.addEventListener('click', e => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) fecharModalAtivo(true);
      });
    });

    document.querySelectorAll('[data-abre-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-abre-modal');
        estado.ultimoFoco = btn;
        window.location.hash = `#${modalId}`;
      });
    });
  }

  function abrirModalPorId(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (estado.modalAberto && estado.modalAberto !== modal) {
      fecharModalAtivo(false);
    }

    estado.modalAberto = modal;
    if (appRoot) appRoot.setAttribute('inert', '');
    modal.showModal();

    const primeiroFocavel = modal.querySelector('button, [href], input, select, textarea');
    if (primeiroFocavel) setTimeout(() => primeiroFocavel.focus(), 50);
  }

  function fecharModalAtivo(voltarHash = true) {
    if (!estado.modalAberto) return;

    estado.modalAberto.close();
    estado.modalAberto = null;

    if (appRoot) appRoot.removeAttribute('inert');

    if (estado.ultimoFoco) {
      estado.ultimoFoco.focus();
      estado.ultimoFoco = null;
    }

    if (voltarHash && window.location.hash.startsWith('#popup-')) {
      window.history.back();
    }
  }

  function configurarAcoesInterativas() {
    // 1. Mostrar/Ocultar Senha
    document.querySelectorAll('.botao-mostrar-senha').forEach(btn => {
      btn.addEventListener('click', () => {
        const container = btn.closest('.campo-senha-container');
        const input = container?.querySelector('input');
        if (!input) return;
        const estaVisivel = input.type === 'text';
        input.type = estaVisivel ? 'password' : 'text';
        btn.setAttribute('aria-label', estaVisivel ? 'Mostrar senha' : 'Ocultar senha');
      });
    });

    // 2. Filtros Musculares
    const pillsFiltro = document.querySelectorAll('.pill-filtro');
    pillsFiltro.forEach(pill => {
      pill.addEventListener('click', () => {
        pillsFiltro.forEach(p => p.setAttribute('aria-pressed', 'false'));
        pill.setAttribute('aria-pressed', 'true');
        const grupo = pill.getAttribute('data-grupo');
        const itens = document.querySelectorAll('.item-exercicio-lista');
        itens.forEach(item => {
          const match = grupo === 'todos' || item.getAttribute('data-grupo') === grupo;
          item.style.display = match ? 'flex' : 'none';
        });
      });
    });

    // 3. Stepper de Medidas
    const inputPeso = document.getElementById('medida-input-peso');
    const inputCintura = document.getElementById('medida-input-cintura');
    const btnSalvar = document.getElementById('btn-salvar-medida');
    const avisoConfirmacao = document.getElementById('aviso-confirmacao-medida');

    document.querySelectorAll('[data-step-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-step-target');
        const delta = parseFloat(btn.getAttribute('data-step-delta') || '0');
        const input = document.getElementById(targetId);
        if (!input) return;
        const valAtual = parseFloat(input.value.replace(',', '.') || '0');
        const novoVal = Math.max(0, valAtual + delta).toFixed(1);
        input.value = novoVal.replace('.', ',');

        if (avisoConfirmacao) {
          avisoConfirmacao.style.display = 'block';
          avisoConfirmacao.innerHTML = `<strong>Alteração detectada:</strong> De ${valAtual} para ${novoVal}. Confirme ao salvar.`;
        }
      });
    });

    btnSalvar?.addEventListener('click', () => {
      const pesoDigitado = inputPeso?.value || '72,4';
      const elResumoPeso = document.getElementById('resumo-peso-valor');
      if (elResumoPeso) elResumoPeso.innerHTML = `${pesoDigitado}<small> kg</small>`;
      fecharModalAtivo(true);
    });

    // 4. Validação de Excluir Conta
    const inputConfirm = document.getElementById('input-excluir-confirmacao');
    const inputSenha = document.getElementById('input-excluir-senha');
    const btnExcluir = document.getElementById('btn-confirmar-exclusao');

    function validarExclusao() {
      const texto = inputConfirm?.value.trim() || '';
      const senha = inputSenha?.value.trim() || '';
      if (btnExcluir) btnExcluir.disabled = !(texto === 'EXCLUIR' && senha.length >= 6);
    }
    inputConfirm?.addEventListener('input', validarExclusao);
    inputSenha?.addEventListener('input', validarExclusao);

    btnExcluir?.addEventListener('click', () => {
      if (btnExcluir.disabled) return;
      btnExcluir.textContent = 'Excluindo conta…';
      setTimeout(() => {
        fecharModalAtivo(true);
        window.location.hash = '#hoje?modo=visitante';
      }, 800);
    });

    // 5. Limpeza de Aparelho
    const chkAceite = document.getElementById('chk-limpar-aceite');
    const btnConfirmarLimpeza = document.getElementById('btn-confirmar-limpeza');

    chkAceite?.addEventListener('change', () => {
      if (btnConfirmarLimpeza) btnConfirmarLimpeza.disabled = !chkAceite.checked;
    });

    btnConfirmarLimpeza?.addEventListener('click', () => {
      if (!chkAceite?.checked) return;
      btnConfirmarLimpeza.textContent = 'Apagando dados locais…';
      setTimeout(() => {
        fecharModalAtivo(true);
        window.location.hash = '#hoje?modo=visitante';
      }, 700);
    });

    // 6. Apagar Legado
    const btnApagarLegado = document.getElementById('btn-apagar-legado-acao');
    const avisoLegado = document.getElementById('aviso-legado-sucesso');
    btnApagarLegado?.addEventListener('click', () => {
      btnApagarLegado.textContent = 'Apagando dados antigos…';
      btnApagarLegado.disabled = true;
      setTimeout(() => {
        if (avisoLegado) avisoLegado.style.display = 'block';
        setTimeout(() => {
          fecharModalAtivo(true);
          btnApagarLegado.textContent = 'Apagar legado definitivamente';
          btnApagarLegado.disabled = false;
          if (avisoLegado) avisoLegado.style.display = 'none';
        }, 900);
      }, 600);
    });

    // 7. Preparação de Backup
    const btnPreparar = document.getElementById('btn-preparar-backup');
    const blocoPronto = document.getElementById('bloco-backup-pronto');
    const inputSenhaBackup = document.getElementById('input-senha-backup');
    const inputRepetidaBackup = document.getElementById('input-repetida-backup');
    const erroBackup = document.getElementById('erro-backup-senha');

    btnPreparar?.addEventListener('click', () => {
      const s = inputSenhaBackup?.value.trim() || '';
      const r = inputRepetidaBackup?.value.trim() || '';

      if (s.length < 12) {
        if (erroBackup) {
          erroBackup.style.display = 'block';
          erroBackup.textContent = 'A senha do backup deve ter no mínimo 12 caracteres.';
        }
        return;
      }
      if (s !== r) {
        if (erroBackup) {
          erroBackup.style.display = 'block';
          erroBackup.textContent = 'As senhas informadas não conferem.';
        }
        return;
      }

      if (erroBackup) erroBackup.style.display = 'none';
      btnPreparar.textContent = 'Criptografando e preparando…';
      btnPreparar.disabled = true;

      setTimeout(() => {
        btnPreparar.textContent = 'Gerar novo backup';
        btnPreparar.disabled = false;
        if (blocoPronto) blocoPronto.style.display = 'flex';
      }, 700);
    });

    // 8. Seções de Configurações Expansíveis
    document.querySelectorAll('.secao-config button[id^="titulo-config-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const secao = btn.closest('.secao-config');
        const expandida = secao?.classList.contains('expandida');
        const conteudo = secao?.querySelector('.conteudo-config');
        if (expandida) {
          secao.classList.remove('expandida');
          btn.setAttribute('aria-expanded', 'false');
          if (conteudo) conteudo.hidden = true;
        } else {
          secao?.classList.add('expandida');
          btn.setAttribute('aria-expanded', 'true');
          if (conteudo) conteudo.hidden = false;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
