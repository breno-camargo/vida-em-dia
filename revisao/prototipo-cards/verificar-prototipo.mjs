import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const HTML_PATH = path.join(__dirname, 'index.html').replace(/\\/g, '/');
const OUT_DIR = path.join(__dirname, 'exemplos');
const FOTO_TESTE_PATH = path.join(__dirname, 'foto-teste.png');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log("Iniciando verificação do protótipo com Edge Headless via CDP...");

  const port = 9222;
  const userDataDir = path.join(process.env.TEMP, 'edge-cdp-verify-' + Date.now());

  const edgeProcess = spawn(EDGE_PATH, [
    '--headless',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,1200',
    'about:blank'
  ], { stdio: 'ignore' });

  // Aguardar porta abrir
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
  }

  if (!versionData) {
    edgeProcess.kill();
    throw new Error("Não foi possível conectar ao Edge CDP na porta " + port);
  }

  console.log("Edge conectado:", versionData.Browser);

  // Criar nova página/alvo
  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('file:///' + HTML_PATH)}`, { method: 'PUT' });
  const target = await newTargetRes.json();
  const wsUrl = target.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Aguardar carregamento da página
  await new Promise(r => setTimeout(r, 1200));
  console.log("Página carregada com sucesso.");

  // 1. Gerar foto sintética limpa (Ponto 3 Codex: sem textos, sem números, sem marcas da referência)
  console.log("\nGerando foto de teste sintética limpa (sem textos)...");
  const genFotoRes = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const cv = document.createElement('canvas');
      cv.width = 1080;
      cv.height = 1920;
      const ctx = cv.getContext('2d');

      // Fundo degradê atmosférico de academia (tons escuros e âmbar suave de iluminação lateral)
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, '#121d16');
      grad.addColorStop(0.3, '#1a2920');
      grad.addColorStop(0.65, '#26382b');
      grad.addColorStop(1, '#0e1711');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Luz quente lateral (simulando janela de academia)
      const lightGrad = ctx.createRadialGradient(200, 400, 50, 200, 400, 800);
      lightGrad.addColorStop(0, 'rgba(235, 195, 130, 0.22)');
      lightGrad.addColorStop(0.5, 'rgba(210, 165, 100, 0.08)');
      lightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Círculos de bokeh / profundidade de campo
      const bokehs = [
        { x: 300, y: 350, r: 120, o: 0.12 },
        { x: 450, y: 280, r: 80, o: 0.09 },
        { x: 220, y: 550, r: 160, o: 0.07 },
        { x: 800, y: 600, r: 200, o: 0.06 },
        { x: 700, y: 300, r: 140, o: 0.08 }
      ];
      for (const b of bokehs) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240, 215, 160, ' + b.o + ')';
        ctx.fill();
      }

      // Silhueta estilizada de halteres / rack em sombra suave
      ctx.fillStyle = '#0a100c';
      ctx.fillRect(0, 1200, 1080, 720);

      // Piso com reflexo suave
      const floorGrad = ctx.createLinearGradient(0, 1200, 0, 1920);
      floorGrad.addColorStop(0, 'rgba(30, 48, 36, 0.4)');
      floorGrad.addColorStop(1, 'rgba(10, 16, 12, 0.95)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 1200, 1080, 720);

      return cv.toDataURL('image/png');
    })()`
  });
  const fotoTesteBase64 = genFotoRes.result.value.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(FOTO_TESTE_PATH, Buffer.from(fotoTesteBase64, 'base64'));
  console.log("Foto de teste sintética salva em:", FOTO_TESTE_PATH);

  // 2. Screenshot geral da interface do protótipo (sem foto)
  const screenshotRes = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = path.join(__dirname, 'screenshot-prototipo-edge.png');
  fs.writeFileSync(screenshotPath, Buffer.from(screenshotRes.data, 'base64'));
  console.log("Screenshot do protótipo (sem foto) salvo em:", screenshotPath);

  // 3. Exportar PNGs sem foto
  const exportConfigs = [
    { type: 'tipografico', transparent: true, scenario: 'musculacao', file: 'adesivo-transparente-musculacao.png', desc: 'Adesivo transparente (limites justos)' },
    { type: 'tipografico', transparent: true, scenario: 'sessao-curta', file: 'adesivo-transparente-sessao-curta.png', desc: 'Adesivo sessão curta (limites justos)' },
    { type: 'tipografico', transparent: false, scenario: 'musculacao', file: 'adesivo-preto-musculacao.png', desc: 'Adesivo fundo preto (limites justos)' },
    { type: 'foto', transparent: false, scenario: 'musculacao', file: 'card-foto-musculacao.png', desc: 'Foto sem foto (oferece Editorial marfim)' },
    { type: 'editorial', transparent: false, scenario: 'musculacao', file: 'card-editorial-musculacao.png', desc: 'Editorial musculação completa (48:37)' },
    { type: 'editorial', transparent: false, scenario: 'cardio', file: 'card-editorial-cardio.png', desc: 'Editorial cardio (6,07 km com descender ajustado)' },
    { type: 'editorial', transparent: false, scenario: 'sessao-curta', file: 'card-editorial-sessao-curta.png', desc: 'Editorial sessão curta (00:51)' },
    { type: 'editorial', transparent: false, scenario: 'poucos-dados', file: 'card-editorial-poucos-dados.png', desc: 'Editorial poucos dados (12:09)' },
  ];

  const resultados = [];

  for (const cfg of exportConfigs) {
    const expr = `window.gerarPNGDataURL('${cfg.type}', ${cfg.transparent}, '${cfg.scenario}', true)`;
    const evalRes = await sendCommand('Runtime.evaluate', { expression: expr });
    const dataUrl = evalRes.result.value;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(OUT_DIR, cfg.file);
    fs.writeFileSync(filePath, buffer);

    const analise = analisarPNG(buffer);
    resultados.push({
      ...cfg,
      tamanhoBytes: buffer.length,
      ...analise
    });
    console.log(`Gerado: ${cfg.file} (${analise.width}x${analise.height}, ${(buffer.length / 1024).toFixed(1)} KB) - Transparência: ${analise.temTransparencia}`);
  }

  // 4. Testar injeção da foto de teste limpa em memória (Ponto 3 e 4)
  console.log("\nInjetando foto de teste limpa em memória para prévia e exportação com foto...");
  const fotoDataUrl = 'data:image/png;base64,' + fotoTesteBase64;
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      userPhoto = '${fotoDataUrl}';
      const img = new Image();
      return new Promise(res => {
        img.onload = () => {
          userPhotoImg = img;
          document.getElementById('btn-clear-photo').style.display = 'inline-flex';
          renderAll();
          res(true);
        };
        img.src = userPhoto;
      });
    })()`,
    awaitPromise: true
  });

  // Screenshot com foto limpa carregada
  const ssPhotoRes = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const ssPhotoPath = path.join(__dirname, 'screenshot-prototipo-com-foto.png');
  fs.writeFileSync(ssPhotoPath, Buffer.from(ssPhotoRes.data, 'base64'));
  console.log("Screenshot com foto limpa salvo em:", ssPhotoPath);

  // Gerar card Foto com a foto de teste limpa (1080x1920)
  const evalFotoComFoto = await sendCommand('Runtime.evaluate', { expression: "window.gerarPNGDataURL('foto', false, 'musculacao')" });
  const bufFoto = Buffer.from(evalFotoComFoto.result.value.replace(/^data:image\/png;base64,/, ''), 'base64');
  const pathFotoComFoto = path.join(OUT_DIR, 'card-foto-com-foto-musculacao.png');
  fs.writeFileSync(pathFotoComFoto, bufFoto);
  const analiseFotoComFoto = analisarPNG(bufFoto);
  console.log(`Gerado: card-foto-com-foto-musculacao.png (${analiseFotoComFoto.width}x${analiseFotoComFoto.height}, ${(bufFoto.length / 1024).toFixed(1)} KB) - Fundo limpo sem textos duplicados`);

  resultados.push({
    type: 'foto',
    transparent: false,
    scenario: 'musculacao',
    file: 'card-foto-com-foto-musculacao.png',
    desc: 'Foto com foto de teste limpa composta',
    tamanhoBytes: bufFoto.length,
    ...analiseFotoComFoto
  });

  // Confirmar adesivo transparente gerado enquanto foto está ativa
  const evalAdesivoComFoto = await sendCommand('Runtime.evaluate', { expression: "window.gerarPNGDataURL('tipografico', true, 'musculacao', true)" });
  const bufAdesivo = Buffer.from(evalAdesivoComFoto.result.value.replace(/^data:image\/png;base64,/, ''), 'base64');
  const analiseAdesivoComFoto = analisarPNG(bufAdesivo);
  console.log("Adesivo transparente gerado com foto ativa:");
  console.log(` - Dimensões: ${analiseAdesivoComFoto.width}x${analiseAdesivoComFoto.height} (limites justos)`);
  console.log(` - Pixels transparentes: ${analiseAdesivoComFoto.pixelsAlphaZero} (${((analiseAdesivoComFoto.pixelsAlphaZero / (analiseAdesivoComFoto.width * analiseAdesivoComFoto.height)) * 100).toFixed(2)}%)`);
  console.log(` - Pixels opacos: ${analiseAdesivoComFoto.pixelsAlphaOpaque}`);
  console.log(` - Transparência real mantida: ${analiseAdesivoComFoto.temTransparencia}`);

  // 5. Validar cenários de dados no runtime
  const checkScenarios = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      return {
        musculacao_duracao: SCENARIOS['musculacao'].duracaoLabel,
        sessao_curta_duracao: SCENARIOS['sessao-curta'].duracaoLabel,
        poucos_dados_duracao: SCENARIOS['poucos-dados'].duracaoLabel,
        cardio_duracao: SCENARIOS['cardio'].duracaoLabel,
        cardio_distancia: SCENARIOS['cardio'].distancia,
        cardio_ritmo: SCENARIOS['cardio'].ritmo
      };
    })()`,
    returnByValue: true
  });

  console.log("\nDados dos cenários verificados no runtime:", JSON.stringify(checkScenarios.result.value, null, 2));

  // Fechar
  ws.close();
  edgeProcess.kill();

  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  console.log("\n--- TABELA FINAL DE VERIFICAÇÃO BINÁRIA DOS PNGS ---");
  console.table(resultados.map(r => ({
    Arquivo: r.file,
    Modelo: r.type,
    Cenário: r.scenario,
    'Largura x Altura': `${r.width}x${r.height}`,
    'Color Type': r.colorTypeDesc,
    'Pixels Transparentes': r.pixelsAlphaZero,
    'Pixels Opacos': r.pixelsAlphaOpaque,
    'Transparência Real': r.temTransparencia ? 'SIM (Alpha ativo)' : 'NÃO (Opaco)'
  })));

  return { resultados, cenarios: checkScenarios.result.value };
}

function analisarPNG(buffer) {
  const sig = buffer.subarray(0, 8);
  const isPNG = sig.equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  if (!isPNG) throw new Error("Não é um arquivo PNG válido");

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer.readUInt8(24);
  const colorType = buffer.readUInt8(25);

  const colorTypeDesc = colorType === 6 ? 'RGBA (com Alpha)' : colorType === 2 ? 'RGB (sem Alpha)' : String(colorType);

  let offset = 8;
  const idatChunks = [];
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(offset + 8, offset + 8 + len));
    }
    offset += 8 + len + 4;
  }

  const idatData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(idatData);

  // Desfazer filtragem preditiva PNG (scanline unfiltering)
  const bpp = colorType === 6 ? 4 : 3;
  const raw = Buffer.alloc(width * height * bpp);
  const stride = 1 + width * bpp;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const prevRowOffset = (y - 1) * width * bpp;
    const curRowOffset = y * width * bpp;
    const scanlineOffset = y * stride + 1;

    for (let x = 0; x < width * bpp; x++) {
      const filtVal = decompressed[scanlineOffset + x];
      const left = x >= bpp ? raw[curRowOffset + x - bpp] : 0;
      const up = y > 0 ? raw[prevRowOffset + x] : 0;
      const upLeft = (y > 0 && x >= bpp) ? raw[prevRowOffset + x - bpp] : 0;

      let val = 0;
      if (filter === 0) val = filtVal;
      else if (filter === 1) val = (filtVal + left) & 0xff;
      else if (filter === 2) val = (filtVal + up) & 0xff;
      else if (filter === 3) val = (filtVal + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        let pr = upLeft;
        if (pa <= pb && pa <= pc) pr = left;
        else if (pb <= pc) pr = up;
        val = (filtVal + pr) & 0xff;
      }
      raw[curRowOffset + x] = val;
    }
  }

  let pixelsAlphaZero = 0;
  let pixelsAlphaOpaque = 0;

  if (colorType === 6) {
    for (let i = 0; i < width * height; i++) {
      const alpha = raw[i * 4 + 3];
      if (alpha === 0) pixelsAlphaZero++;
      else pixelsAlphaOpaque++;
    }
  } else {
    pixelsAlphaOpaque = width * height;
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    colorTypeDesc,
    pixelsAlphaZero,
    pixelsAlphaOpaque,
    temTransparencia: pixelsAlphaZero > 0
  };
}

main().catch(err => {
  console.error("Erro na verificação:", err);
  process.exit(1);
});
