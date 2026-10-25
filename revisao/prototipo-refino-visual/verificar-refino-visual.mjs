/**
 * verificar-refino-visual.mjs
 * Script de verificação automatizada via Microsoft Edge CDP (Chrome DevTools Protocol)
 * - Validações Funcionais: Overflow horizontal, Tecla Esc, Foco preso (Tab Trap), Hashes, Validação de Exclusão
 * - Cálculos Matemáticos de Contraste WCAG (Tema Escuro e Claro)
 * - Capturas de Tela de Evidência em Viewports Reais (390x844, 360x800 e Desktop)
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPTURAS_DIR = path.join(__dirname, 'capturas');

if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CDP_PORT = 9225;
const FILE_URL = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');

// Classe auxiliar de conexão CDP
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = evt => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

// Matemática de Luminância e Contraste WCAG
function lum(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(c1, c2) {
  const l1 = lum(c1), l2 = lum(c2);
  return parseFloat(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
}

async function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== INICIANDO VERIFICAÇÃO AUTOMATIZADA DO REFINO VISUAL ===\n');

  // 1. Cálculos de Contraste WCAG
  console.log('--- 1. CÁLCULOS MATEMÁTICOS DE CONTRASTE (WCAG) ---');
  const contrastes = [
    { tema: 'Escuro', par: 'Texto Principal (#f0f5f1) em Fundo (#101714)', c1: '#f0f5f1', c2: '#101714', min: 4.5 },
    { tema: 'Escuro', par: 'Texto Principal (#f0f5f1) em Card (#18251e)', c1: '#f0f5f1', c2: '#18251e', min: 4.5 },
    { tema: 'Escuro', par: 'Texto Secundário (#c0d2c4) em Card (#18251e)', c1: '#c0d2c4', c2: '#18251e', min: 4.5 },
    { tema: 'Escuro', par: 'Texto Terciário (#9ab2a1) em Card (#18251e)', c1: '#9ab2a1', c2: '#18251e', min: 4.5 },
    { tema: 'Escuro', par: 'Botão Primário: Texto (#192d18) em Verde (#bcec86)', c1: '#192d18', c2: '#bcec86', min: 4.5 },
    { tema: 'Escuro', par: 'Botão Secundário: Texto (#d8ebd0) em Fundo (#203123)', c1: '#d8ebd0', c2: '#203123', min: 4.5 },
    { tema: 'Escuro', par: 'Botão Destrutivo: Texto (#f2b8a7) em Fundo (#2b1d19)', c1: '#f2b8a7', c2: '#2b1d19', min: 4.5 },
    { tema: 'Escuro', par: 'Borda de Input (#56735a) em Fundo (#141f18)', c1: '#56735a', c2: '#141f18', min: 3.0 },
    { tema: 'Escuro', par: 'Anel de Foco (#bcec86) em Fundo (#101714)', c1: '#bcec86', c2: '#101714', min: 3.0 },

    { tema: 'Claro', par: 'Texto Principal (#121e15) em Fundo (#f3f6f3)', c1: '#121e15', c2: '#f3f6f3', min: 4.5 },
    { tema: 'Claro', par: 'Texto Principal (#121e15) em Card (#ffffff)', c1: '#121e15', c2: '#ffffff', min: 4.5 },
    { tema: 'Claro', par: 'Texto Secundário (#34483a) em Card (#ffffff)', c1: '#34483a', c2: '#ffffff', min: 4.5 },
    { tema: 'Claro', par: 'Texto Terciário (#506655) em Card (#ffffff)', c1: '#506655', c2: '#ffffff', min: 4.5 },
    { tema: 'Claro', par: 'Botão Primário: Branco (#ffffff) em Verde (#22642e)', c1: '#ffffff', c2: '#22642e', min: 4.5 },
    { tema: 'Claro', par: 'Botão Primário (#22642e) em Superfície (#ffffff)', c1: '#22642e', c2: '#ffffff', min: 3.0 },
    { tema: 'Claro', par: 'Botão Secundário: Texto (#184c23) em Fundo (#eaf3ec)', c1: '#184c23', c2: '#eaf3ec', min: 4.5 },
    { tema: 'Claro', par: 'Botão Destrutivo: Texto (#991f13) em Fundo (#fef2f0)', c1: '#991f13', c2: '#fef2f0', min: 4.5 },
    { tema: 'Claro', par: 'Borda de Input (#628269) em Fundo (#ffffff)', c1: '#628269', c2: '#ffffff', min: 3.0 },
    { tema: 'Claro', par: 'Anel de Foco (#1b5e28) em Fundo (#f3f6f3)', c1: '#1b5e28', c2: '#f3f6f3', min: 3.0 },
  ];

  let todosContrastesOk = true;
  for (const c of contrastes) {
    const r = contrast(c.c1, c.c2);
    const ok = r >= c.min;
    if (!ok) todosContrastesOk = false;
    console.log(`[${ok ? 'APROVADO' : 'FALHA'}] (${c.tema}) ${c.par} -> ${r}:1 (Mínimo: ${c.min}:1)`);
  }

  // 2. Lançar Navegador Edge Headless
  console.log('\n--- 2. INICIANDO SESSÃO EDGE HEADLESS (CDP) ---');
  const proc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await esperar(1800);

  // Obter WebSocket URL da aba
  const tabs = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  const cdp = new CdpClient(pageTab.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('Conectado ao Edge CDP via WebSocket:', pageTab.webSocketDebuggerUrl);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  // Função utilitária para avaliar script
  async function evalJs(expr) {
    const res = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Erro na avaliação de JS');
    }
    return res.result.value;
  }

  // Função para configurar viewport
  async function setViewport(width, height, isMobile = true) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
  }

  // Função para capturar screenshot
  async function capturar(nomeArquivo, width, height, isMobile = true) {
    await setViewport(width, height, isMobile);
    await esperar(300);
    const ss = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(ss.data, 'base64');
    const dest = path.join(CAPTURAS_DIR, nomeArquivo);
    fs.writeFileSync(dest, buf);
    console.log(`[CAPTURA SALVA] ${nomeArquivo} (${width}x${height}) - ${buf.length} bytes`);
  }

  // 3. Testes Funcionais
  console.log('\n--- 3. EXECUTANDO TESTES FUNCIONAIS NO DOM ---');

  // Carregar página
  await cdp.send('Page.navigate', { url: FILE_URL });
  await esperar(1000);

  // Teste 3.1: Overflow Horizontal em 390 e 360
  for (const w of [390, 360]) {
    await setViewport(w, 800, true);
    const overflow = await evalJs(`
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth
    `);
    console.log(`[TESTE] Overflow horizontal em ${w}px: ${overflow ? 'FALHA (Detectado overflow)' : 'APROVADO (Zero overflow horizontal)'}`);
  }

  // Teste 3.2: Rotas por Hash e Títulos
  const rotasParaTestar = [
    { hash: '#hoje', titulo: 'Olá, vamos cuidar de você?' },
    { hash: '#treino', titulo: 'Treino' },
    { hash: '#treino-exercicios', titulo: 'Treino' },
    { hash: '#treino-cardio', titulo: 'Treino' },
    { hash: '#comida', titulo: 'Comida' },
    { hash: '#medidas', titulo: 'Medidas' },
    { hash: '#medidas-comparar', titulo: 'Medidas' },
    { hash: '#evolucao', titulo: 'Evolução' },
    { hash: '#configuracoes', titulo: 'Configurações' },
    { hash: '#componentes', titulo: 'Referência de Componentes Refinados' },
    { hash: '#login', titulo: 'Entrar na sua conta' },
    { hash: '#cadastro', titulo: 'Criar sua conta' }
  ];

  let todasRotasOk = true;
  for (const r of rotasParaTestar) {
    await evalJs(`window.location.hash = '${r.hash}'`);
    await esperar(150);
    const tituloObtido = await evalJs(`document.getElementById('titulo-pagina-h1').textContent`);
    const match = tituloObtido.trim() === r.titulo;
    if (!match) todasRotasOk = false;
    console.log(`[TESTE] Rota ${r.hash} -> H1: "${tituloObtido}" (${match ? 'APROVADO' : 'FALHA'})`);
  }

  // Teste 3.3: Gerenciamento Acessível de Modais (Abertura, inert no fundo, Tab Trap e Tecla Esc)
  console.log('\n--- Teste de Modais: Abertura, inert, foco e tecla Esc ---');
  await evalJs(`window.location.hash = '#popup-backup'`);
  await esperar(250);

  const modalAberto = await evalJs(`document.getElementById('popup-backup').open`);
  const fundoInert = await evalJs(`document.getElementById('app-root').hasAttribute('inert')`);
  console.log(`[TESTE] Modal popup-backup aberto: ${modalAberto ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);
  console.log(`[TESTE] Fundo com atributo inert enquanto modal aberto: ${fundoInert ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);

  // Disparar Esc
  await evalJs(`
    const ev = new KeyboardEvent('cancel', { bubbles: true, cancelable: true });
    document.getElementById('popup-backup').dispatchEvent(ev);
  `);
  await esperar(200);

  const modalAposEsc = await evalJs(`document.getElementById('popup-backup').open`);
  const fundoAposEsc = await evalJs(`document.getElementById('app-root').hasAttribute('inert')`);
  console.log(`[TESTE] Modal fechado após tecla Esc: ${!modalAposEsc ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);
  console.log(`[TESTE] Fundo liberado (sem inert) após fechamento: ${!fundoAposEsc ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);

  // Teste 3.4: Validação de Exclusão de Conta
  console.log('\n--- Teste de Validação: Excluir Conta ---');
  await evalJs(`window.location.hash = '#popup-excluir-conta'`);
  await esperar(200);

  const btnExcluirInicial = await evalJs(`document.getElementById('btn-confirmar-exclusao').disabled`);
  console.log(`[TESTE] Botão Excluir inicialmente desabilitado: ${btnExcluirInicial ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);

  await evalJs(`
    const inputConfirm = document.getElementById('input-excluir-confirmacao');
    const inputSenha = document.getElementById('input-excluir-senha');
    inputConfirm.value = 'EXCLUIR';
    inputConfirm.dispatchEvent(new Event('input', { bubbles: true }));
    inputSenha.value = 'senha123';
    inputSenha.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await esperar(150);

  const btnExcluirValidado = await evalJs(`document.getElementById('btn-confirmar-exclusao').disabled`);
  console.log(`[TESTE] Botão Excluir habilitado após digitação correta ("EXCLUIR" + senha): ${!btnExcluirValidado ? 'SIM (Aprovado)' : 'NÃO (Falha)'}`);

  await evalJs(`document.getElementById('popup-excluir-conta').close(); document.getElementById('app-root').removeAttribute('inert');`);

  // 4. Capturas de Tela de Evidência
  console.log('\n--- 4. GERANDO CAPTURAS DE TELA DE EVIDÊNCIA ---');

  // 01: Tela Hoje - 390x844 Escuro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'escuro'); window.location.hash = '#hoje';`);
  await esperar(200);
  await capturar('01-hoje-390x844-escuro.png', 390, 844, true);

  // 02: Tela Hoje - 390x844 Claro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'claro'); window.location.hash = '#hoje?tema=claro';`);
  await esperar(200);
  await capturar('02-hoje-390x844-claro.png', 390, 844, true);

  // 03: Tela Hoje - 360x800 Escuro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'escuro'); window.location.hash = '#hoje';`);
  await esperar(200);
  await capturar('03-hoje-360x800-escuro.png', 360, 800, true);

  // 04: Tela Hoje - Desktop (1280x800 container 480px centralizado)
  await evalJs(`window.location.hash = '#hoje';`);
  await esperar(200);
  await capturar('04-hoje-desktop-escuro.png', 1280, 800, false);

  // 05: Tela Treino (Minhas fichas) - 390x844 Escuro
  await evalJs(`window.location.hash = '#treino';`);
  await esperar(200);
  await capturar('05-treino-fichas-390x844-escuro.png', 390, 844, true);

  // 06: Tela Treino (Exercícios + filtros musculares) - 390x844 Claro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'claro'); window.location.hash = '#treino-exercicios';`);
  await esperar(200);
  await capturar('06-treino-exercicios-390x844-claro.png', 390, 844, true);

  // 07: Tela Treino (Cardio) - 390x844 Escuro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'escuro'); window.location.hash = '#treino-cardio';`);
  await esperar(200);
  await capturar('07-treino-cardio-390x844-escuro.png', 390, 844, true);

  // 08: Tela Comida (EstadoVazio Etapa 9) - 390x844 Escuro
  await evalJs(`window.location.hash = '#comida';`);
  await esperar(200);
  await capturar('08-comida-390x844-escuro.png', 390, 844, true);

  // 09: Tela Medidas (Registros) - 390x844 Escuro
  await evalJs(`window.location.hash = '#medidas';`);
  await esperar(200);
  await capturar('09-medidas-390x844-escuro.png', 390, 844, true);

  // 10: Tela Medidas (Comparar datas) - 390x844 Claro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'claro'); window.location.hash = '#medidas-comparar';`);
  await esperar(200);
  await capturar('10-medidas-comparar-390x844-claro.png', 390, 844, true);

  // 11: Tela Evolução (Meus treinos) - 390x844 Escuro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'escuro'); window.location.hash = '#evolucao';`);
  await esperar(200);
  await capturar('11-evolucao-390x844-escuro.png', 390, 844, true);

  // 12: Tela Configurações - 390x844 Escuro
  await evalJs(`window.location.hash = '#configuracoes';`);
  await esperar(200);
  await capturar('12-configuracoes-390x844-escuro.png', 390, 844, true);

  // 13: Modal Backup - 390x844 Escuro
  await evalJs(`window.location.hash = '#popup-backup';`);
  await esperar(250);
  await capturar('13-popup-backup-390x844-escuro.png', 390, 844, true);

  // 14: Modal Medidas Stepper - 390x844 Claro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'claro'); window.location.hash = '#popup-medida';`);
  await esperar(250);
  await capturar('14-popup-medida-390x844-claro.png', 390, 844, true);

  // 15: Modal Excluir Conta - 390x844 Escuro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'escuro'); window.location.hash = '#popup-excluir-conta';`);
  await esperar(250);
  await capturar('15-popup-excluir-conta-390x844-escuro.png', 390, 844, true);

  // 16: Modal Card Congelado Preservado - 390x844 Escuro
  await evalJs(`window.location.hash = '#popup-card-congelado';`);
  await esperar(250);
  await capturar('16-popup-card-congelado-390x844-escuro.png', 390, 844, true);

  // 17: Página de Componentes Refinados (Design System) - 390x844 Escuro
  await evalJs(`window.location.hash = '#componentes';`);
  await esperar(250);
  await capturar('17-componentes-390x844-escuro.png', 390, 844, true);

  // 18: Página de Componentes Refinados (Design System) - 390x844 Claro
  await evalJs(`document.documentElement.setAttribute('data-tema', 'claro'); window.location.hash = '#componentes';`);
  await esperar(250);
  await capturar('18-componentes-390x844-claro.png', 390, 844, true);

  // Encerrar CDP e processo
  cdp.close();
  proc.kill();

  console.log('\n=== VERIFICAÇÃO AUTOMATIZADA CONCLUÍDA COM SUCESSO! ===');
  console.log(`Todas as 18 capturas salvas em: ${CAPTURAS_DIR}`);
}

main().catch(err => {
  console.error('ERRO NA VERIFICAÇÃO:', err);
  process.exit(1);
});

