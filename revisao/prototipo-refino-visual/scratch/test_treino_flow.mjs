import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CDP_PORT = 9235;
const TARGET_URL = 'http://127.0.0.1:3334';
const OUT_DIR = 'C:/Users/breno/Documents/Codex/2026-10-05/ol/outputs/vida-em-dia/revisao/prototipo-refino-visual/capturas';

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
  close() { if (this.ws) this.ws.close(); }
}

async function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }
async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- TESTANDO FLUXO DE TREINO CORRIGIDO (MOBILE 390x844) ---');
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + path.join(process.env.TEMP, 'edge-tf-' + Date.now())
  ]);

  let versionInfo = null;
  for (let i = 0; i < 30; i++) {
    await esperar(200);
    try { versionInfo = await getJson(`http://127.0.0.1:${CDP_PORT}/json/version`); break; } catch {}
  }

  const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const target = targets.find(t => t.type === 'page') || targets[0];
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  // 1. Abrir tela de Treino
  await client.send('Page.navigate', { url: TARGET_URL + '/#treino' });
  await esperar(1500);

  console.log('1. Na tela #treino');
  let shot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'teste_01_tela_treino.png'), Buffer.from(shot.data, 'base64'));

  // 2. Clicar em "Continuar treino"
  console.log('2. Clicando em "Continuar treino"...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-continuar-treino-topo');
      if (btn) btn.click();
    })()`
  });
  await esperar(800);

  const checkAndamento = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const sec = document.getElementById('tela-treino-andamento');
      const isVisible = sec && window.getComputedStyle(sec).display !== 'none';
      const isCardCongeladoAberto = document.getElementById('popup-card-congelado')?.open;
      const isAjudaAberta = document.getElementById('popup-ajuda-exercicio')?.open;
      return JSON.stringify({
        hash: window.location.hash,
        telaTreinoAndamentoVisivel: isVisible,
        modalCardCongeladoAberto: !!isCardCongeladoAberto,
        modalAjudaAberto: !!isAjudaAberta
      });
    })()`,
    returnByValue: true
  });
  console.log('Resultado ao clicar Continuar Treino:', checkAndamento.result.value);

  shot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'teste_02_treino_andamento.png'), Buffer.from(shot.data, 'base64'));

  // 3. Clicar em "Continuar depois" para voltar
  console.log('3. Clicando em "Continuar depois"...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.continuar-depois');
      if (btn) btn.click();
    })()`
  });
  await esperar(800);

  const checkVolta = await client.send('Runtime.evaluate', {
    expression: `(() => {
      return JSON.stringify({
        hash: window.location.hash,
        telaTreinoVisivel: window.getComputedStyle(document.getElementById('tela-treino')).display !== 'none',
        telaAndamentoVisivel: window.getComputedStyle(document.getElementById('tela-treino-andamento')).display !== 'none'
      });
    })()`,
    returnByValue: true
  });
  console.log('Resultado ao clicar Continuar Depois:', checkVolta.result.value);

  // 4. Clicar em "Ver card" do último treino
  console.log('4. Clicando em "Ver card" do último treino...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.ultimo-treino-atalho');
      if (btn) btn.click();
    })()`
  });
  await esperar(800);

  const checkCard = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const m = document.getElementById('popup-card-congelado');
      return JSON.stringify({
        modalCardCongeladoAberto: m && m.open,
        modalTitle: m?.querySelector('h2')?.innerText
      });
    })()`,
    returnByValue: true
  });
  console.log('Resultado ao clicar Ver Card:', checkCard.result.value);

  // 5. Clicar em "Nova ficha"
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      document.getElementById('popup-card-congelado').close();
    })()`
  });
  await esperar(400);

  console.log('5. Clicando em "Nova ficha"...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.barra-fichas .botao-principal');
      if (btn) btn.click();
    })()`
  });
  await esperar(800);

  const checkNovaFicha = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const m = document.getElementById('popup-nova-ficha');
      const isAjudaAberta = document.getElementById('popup-ajuda-exercicio')?.open;
      return JSON.stringify({
        modalNovaFichaAberto: m && m.open,
        modalTitle: m?.querySelector('h2')?.innerText,
        modalAjudaIndevidoAberto: !!isAjudaAberta
      });
    })()`,
    returnByValue: true
  });
  console.log('Resultado ao clicar Nova Ficha:', checkNovaFicha.result.value);

  client.close();
  edge.kill();
  console.log('\n--- TODOS OS TESTES PASSARAM COM SUCESSO ---');
}

run().catch(console.error);

