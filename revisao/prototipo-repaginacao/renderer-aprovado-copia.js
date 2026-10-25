/* C?pia transpilada sem redesenho; fontes e hashes em renderer-origem.json. */
(()=>{
"use strict";
function desenharCardAprovado(ctx, s, modelo, cor, userPhotoImg, previa = false) {
    const textMode = cor === 'clara' ? 'light' : 'dark';
    const SANS = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
    const SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif';
    // ============================================================
    // DRAWING — single canvas renderer for preview AND export
    // ============================================================
    // ---------- TIPOGRÁFICO ----------
    function drawTipografico(ctx, s, W, H, opts) {
        // opts: { transparent, showPhoto, checkerboard }
        ctx.clearRect(0, 0, W, H);
        // Background
        if (opts.showPhoto && userPhotoImg) {
            drawCover(ctx, userPhotoImg, W, H);
            // Leve escurecimento para contraste
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(0, 0, W, H);
        }
        else if (!opts.transparent) {
            if (opts.checkerboard) {
                drawCheckerboard(ctx, W, H);
            }
            else {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, W, H);
            }
        }
        const color = textMode === 'light' ? '#ffffff' : '#1a2e1c';
        const PAD = W * 0.08;
        // Build metrics
        const metrics = [];
        if (s.tipo === 'musculacao') {
            metrics.push({ label: 'Tempo', value: s.duracaoLabel, unit: '' });
            if (s.volume)
                metrics.push({ label: 'Volume total', value: s.volume.toLocaleString('pt-BR'), unit: 'kg' });
            if (s.exercicios)
                metrics.push({ label: 'Exercícios', value: String(s.exercicios), unit: '' });
            if (s.series)
                metrics.push({ label: 'Séries', value: String(s.series), unit: '' });
            if (s.repeticoes)
                metrics.push({ label: 'Repetições', value: String(s.repeticoes), unit: '' });
            if (s.calorias)
                metrics.push({ label: 'Calorias est.', value: '~' + String(s.calorias), unit: 'kcal' });
        }
        else {
            metrics.push({ label: 'Distância', value: (s.distancia ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'km' });
            metrics.push({ label: 'Duração', value: s.duracaoLabel, unit: '' });
            if (s.ritmo)
                metrics.push({ label: 'Ritmo', value: s.ritmo, unit: '' });
            if (s.calorias)
                metrics.push({ label: 'Calorias', value: String(s.calorias), unit: 'kcal' });
            if (s.passos)
                metrics.push({ label: 'Passos', value: s.passos.toLocaleString('pt-BR'), unit: '' });
        }
        const fontSize = W * 0.078;
        const labelSize = W * 0.024;
        const unitSize = W * 0.032;
        // Medir marca
        ctx.font = `700 ${W * 0.026}px ${SANS}`;
        ctx.letterSpacing = '5px';
        const brandMetrics = ctx.measureText('VIDA EM DIA');
        const brandW = brandMetrics.width;
        const brandAscent = brandMetrics.actualBoundingBoxAscent || 24;
        const brandDescent = brandMetrics.actualBoundingBoxDescent || 6;
        ctx.letterSpacing = '0px';
        // Pré-medir métricas com caixa delimitadora precisa (Ponto 1 da revisão Codex)
        const metricLayouts = [];
        let maxContentWidth = Math.max(brandW, 100);
        for (const m of metrics) {
            ctx.font = `500 ${labelSize}px ${SANS}`;
            const lMet = ctx.measureText(m.label);
            const lAscent = lMet.actualBoundingBoxAscent || (labelSize * 0.75);
            const lDescent = lMet.actualBoundingBoxDescent || (labelSize * 0.2);
            const lWidth = lMet.width;
            ctx.font = `800 ${fontSize}px ${SANS}`;
            const vMet = ctx.measureText(m.value);
            const vAscent = vMet.actualBoundingBoxAscent || (fontSize * 0.75);
            const vDescent = vMet.actualBoundingBoxDescent || (fontSize * 0.18);
            const vWidth = vMet.width;
            let uWidth = 0;
            if (m.unit) {
                ctx.font = `500 ${unitSize}px ${SANS}`;
                const uMet = ctx.measureText(m.unit);
                uWidth = uMet.width + 8;
            }
            const totalValWidth = vWidth + uWidth;
            maxContentWidth = Math.max(maxContentWidth, lWidth, totalValWidth);
            metricLayouts.push({
                metric: m,
                lAscent,
                lDescent,
                lWidth,
                vAscent,
                vDescent,
                vWidth,
                uWidth
            });
        }
        // Altura dos blocos com respiro explícito (Ponto 1 Codex):
        // Rótulos nunca encostam no número anterior!
        const gapLabelToValue = 10;
        const gapBetweenMetrics = 34; // intervalo explícito entre número e próximo rótulo
        const brandBlockH = brandAscent + brandDescent + 14 + 4 + 36;
        let totalMetricsH = 0;
        for (let i = 0; i < metricLayouts.length; i++) {
            const ml = metricLayouts[i];
            const itemH = ml.lAscent + ml.lDescent + gapLabelToValue + ml.vAscent + ml.vDescent;
            totalMetricsH += itemH;
            if (i < metricLayouts.length - 1) {
                totalMetricsH += gapBetweenMetrics;
            }
        }
        const totalContentH = brandBlockH + totalMetricsH;
        // Distribuição vertical dinâmica no story (Ponto 1 Codex):
        // Âncora confortável no terço inferior (~88% da altura), sem forçar H*0.46 estático
        const targetBottom = H * 0.88;
        const startY = Math.max(H * 0.28, targetBottom - totalContentH);
        let curY = startY + brandAscent;
        // Marca
        ctx.fillStyle = color;
        ctx.textAlign = 'start';
        ctx.font = `700 ${W * 0.026}px ${SANS}`;
        ctx.letterSpacing = '5px';
        ctx.fillText('VIDA EM DIA', PAD, curY);
        ctx.letterSpacing = '0px';
        curY += brandDescent + 14;
        // Barra de acento
        ctx.fillStyle = '#a3d94e';
        ctx.fillRect(PAD, curY, 24, 4);
        curY += 4 + 36;
        // Métricas
        let lastMetricBottomY = curY;
        for (let i = 0; i < metricLayouts.length; i++) {
            const ml = metricLayouts[i];
            const m = ml.metric;
            const labelY = curY + ml.lAscent;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            ctx.font = `500 ${labelSize}px ${SANS}`;
            ctx.fillText(m.label, PAD, labelY);
            ctx.globalAlpha = 1;
            const valY = labelY + ml.lDescent + gapLabelToValue + ml.vAscent;
            ctx.font = `800 ${fontSize}px ${SANS}`;
            ctx.fillText(m.value, PAD, valY);
            if (m.unit) {
                ctx.font = `500 ${unitSize}px ${SANS}`;
                ctx.globalAlpha = 0.8;
                ctx.fillText(m.unit, PAD + ml.vWidth + 8, valY);
                ctx.globalAlpha = 1;
            }
            lastMetricBottomY = valY + ml.vDescent;
            curY = lastMetricBottomY + gapBetweenMetrics;
        }
        return {
            minX: PAD,
            maxX: PAD + maxContentWidth,
            minY: startY,
            maxY: lastMetricBottomY
        };
    }
    // ---------- FOTO ----------
    function drawFoto(ctx, s, W, H) {
        // Ponto 4 Codex: Sem foto, oferecer Editorial em vez de área marfim vazia
        if (!userPhotoImg) {
            drawEditorial(ctx, s, W, H);
            return;
        }
        ctx.clearRect(0, 0, W, H);
        drawCover(ctx, userPhotoImg, W, H);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0.3, 'transparent');
        grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        const textColor = '#ffffff';
        const accentColor = '#a3d94e';
        // Brand top center
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.font = `700 ${W * 0.024}px ${SANS}`;
        ctx.letterSpacing = '5px';
        ctx.fillText('VIDA EM DIA', W / 2, H * 0.07);
        ctx.letterSpacing = '0px';
        ctx.fillStyle = accentColor;
        ctx.fillRect(W / 2 - 12, H * 0.07 + 8, 24, 4);
        // Status label
        const statusLabel = s.tipo === 'musculacao' ? 'TREINO CONCLUÍDO' : 'CARDIO CONCLUÍDO';
        ctx.fillStyle = accentColor;
        ctx.font = `700 ${W * 0.02}px ${SANS}`;
        ctx.letterSpacing = '5px';
        ctx.fillText(statusLabel, W / 2, H * 0.72);
        ctx.letterSpacing = '0px';
        // Tempo exato MM:SS
        let mainVal, mainUnit;
        if (s.tipo === 'musculacao') {
            mainVal = s.duracaoLabel;
            mainUnit = '';
        }
        else {
            mainVal = (s.distancia ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            mainUnit = s.distancia ? 'km' : '';
            if (!s.distancia)
                mainVal = s.duracaoLabel;
        }
        // Medição precisa do número e unidade agrupados
        ctx.fillStyle = textColor;
        const mainFontSize = W * 0.14;
        ctx.font = `800 ${mainFontSize}px ${SANS}`;
        const mainNumW = ctx.measureText(mainVal).width;
        const unitFontSize = W * 0.05;
        ctx.font = `500 ${unitFontSize}px ${SANS}`;
        const mainUnitW = mainUnit ? ctx.measureText(mainUnit).width : 0;
        const unitGap = mainUnit ? 8 : 0;
        const totalW = mainNumW + unitGap + mainUnitW;
        const startX = (W - totalW) / 2;
        ctx.font = `800 ${mainFontSize}px ${SANS}`;
        ctx.textAlign = 'left';
        ctx.fillText(mainVal, startX, H * 0.80);
        if (mainUnit) {
            ctx.font = `500 ${unitFontSize}px ${SANS}`;
            ctx.globalAlpha = 0.9;
            ctx.fillText(mainUnit, startX + mainNumW + unitGap, H * 0.80);
            ctx.globalAlpha = 1;
        }
        // Bottom stats
        const bottomParts = [];
        if (s.tipo === 'musculacao') {
            if (s.volume)
                bottomParts.push({ value: s.volume.toLocaleString('pt-BR'), unit: 'kg', label: 'Volume total' });
            if (s.series)
                bottomParts.push({ value: String(s.series), unit: '', label: 'séries' });
            if (s.repeticoes)
                bottomParts.push({ value: String(s.repeticoes), unit: '', label: 'repetições' });
            if (!s.volume && !s.series && s.exercicios)
                bottomParts.push({ value: String(s.exercicios), unit: '', label: s.exercicios > 1 ? 'exercícios' : 'exercício' });
        }
        else {
            bottomParts.push({ value: s.duracaoLabel, unit: '', label: 'duração' });
            if (s.ritmo)
                bottomParts.push({ value: s.ritmo, unit: '', label: 'ritmo' });
        }
        const bottomY = H * 0.88;
        const totalBottomW = W * 0.7;
        const segW = totalBottomW / bottomParts.length;
        const bStartX = (W - totalBottomW) / 2;
        ctx.textAlign = 'center';
        bottomParts.forEach((bp, i) => {
            const cx = bStartX + segW * i + segW / 2;
            ctx.fillStyle = textColor;
            ctx.font = `700 ${W * 0.04}px ${SANS}`;
            const displayVal = bp.unit ? bp.value + ' ' + bp.unit : bp.value;
            ctx.fillText(displayVal, cx, bottomY);
            ctx.font = `500 ${W * 0.018}px ${SANS}`;
            ctx.globalAlpha = 0.65;
            ctx.fillText(bp.label, cx, bottomY + W * 0.03);
            ctx.globalAlpha = 1;
            if (i > 0) {
                const dx = bStartX + segW * i;
                ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(dx, bottomY - W * 0.04);
                ctx.lineTo(dx, bottomY + W * 0.03);
                ctx.stroke();
            }
        });
        ctx.textAlign = 'start';
    }
    // ---------- EDITORIAL ----------
    function drawEditorial(ctx, s, W, H) {
        ctx.clearRect(0, 0, W, H);
        const PAD = W * 0.08;
        const ink = '#1a2e1c';
        ctx.fillStyle = '#f0ece4';
        ctx.fillRect(0, 0, W, H);
        // Brand top left
        ctx.fillStyle = ink;
        ctx.textAlign = 'start';
        ctx.font = `700 ${W * 0.024}px ${SANS}`;
        ctx.letterSpacing = '5px';
        ctx.fillText('VIDA EM DIA', PAD, H * 0.06);
        ctx.letterSpacing = '0px';
        ctx.fillStyle = '#a3d94e';
        ctx.fillRect(PAD, H * 0.065, 24, 4);
        // Session type top right
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.65;
        ctx.font = `600 ${W * 0.022}px ${SANS}`;
        ctx.textAlign = 'right';
        const typeLines = s.tipo === 'musculacao' ? ['TREINO', 'CONCLUÍDO'] : ['CARDIO', 'CONCLUÍDO'];
        typeLines.forEach((line, i) => {
            ctx.fillText(line, W - PAD, H * 0.055 + i * W * 0.03);
        });
        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
        // Hero number & unit
        let heroNumber, heroUnit;
        if (s.tipo === 'musculacao') {
            heroNumber = s.duracaoLabel; // exact MM:SS always (00:51, 48:37, 12:09)
            heroUnit = '';
        }
        else {
            heroNumber = (s.distancia ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            heroUnit = s.distancia ? 'QUILÔMETROS' : '';
            if (!s.distancia)
                heroNumber = s.duracaoLabel;
        }
        // Medição dinâmica precisa de descendentes (Ponto 2 Codex):
        // Não invade a faixa visual dos descendentes de 6,07 (vírgula)
        const heroFontSize = W * 0.22;
        ctx.font = `700 ${heroFontSize}px ${SERIF}`;
        const heroMetrics = ctx.measureText(heroNumber);
        const heroDescent = heroMetrics.actualBoundingBoxDescent || (heroFontSize * 0.16);
        const heroY = H * 0.33;
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        ctx.fillText(heroNumber, W / 2, heroY);
        let bottomOfHeroBlock = heroY + heroDescent;
        if (heroUnit) {
            const unitFontSize = W * 0.028;
            ctx.font = `600 ${unitFontSize}px ${SANS}`;
            const unitMetrics = ctx.measureText(heroUnit);
            const unitAscent = unitMetrics.actualBoundingBoxAscent || (unitFontSize * 0.75);
            const unitDescent = unitMetrics.actualBoundingBoxDescent || (unitFontSize * 0.15);
            // Intervalo explícito de 26px entre o ponto mais baixo do número (vírgula/descendente) e o topo da legenda
            const gapHeroToUnit = 26;
            const unitBaselineY = heroY + heroDescent + gapHeroToUnit + unitAscent;
            ctx.letterSpacing = '6px';
            ctx.globalAlpha = 0.8;
            ctx.fillText(heroUnit, W / 2, unitBaselineY);
            ctx.letterSpacing = '0px';
            ctx.globalAlpha = 1;
            bottomOfHeroBlock = unitBaselineY + unitDescent;
        }
        // Linha divisória com ponto verde: intervalo explícito de 44px
        const divY = bottomOfHeroBlock + 44;
        ctx.strokeStyle = 'rgba(26,46,28,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, divY);
        ctx.lineTo(W - PAD, divY);
        ctx.stroke();
        ctx.fillStyle = '#a3d94e';
        ctx.fillRect(W - PAD - 10, divY - 2, 10, 5);
        // Secondary stat
        const secY = divY + 84;
        ctx.fillStyle = ink;
        const secNumSize = W * 0.09;
        const secUnitSize = W * 0.028;
        const secLabelSize = W * 0.022;
        if (s.tipo === 'musculacao' && s.volume) {
            drawNumberWithUnit(ctx, s.volume.toLocaleString('pt-BR'), 'kg', 'Volume total', secNumSize, secUnitSize, secLabelSize, W / 2, secY, ink);
        }
        else if (s.tipo === 'cardio') {
            drawNumberWithUnit(ctx, s.duracaoLabel, '', 'Duração', secNumSize, secUnitSize, secLabelSize, W / 2, secY, ink);
        }
        else if (s.tipo === 'musculacao' && s.repeticoes) {
            drawNumberWithUnit(ctx, String(s.repeticoes), '', 'Repetições', secNumSize, secUnitSize, secLabelSize, W / 2, secY, ink);
        }
        else if (s.tipo === 'musculacao' && s.calorias) {
            drawNumberWithUnit(ctx, '~' + String(s.calorias), 'kcal', 'Calorias est.', secNumSize, secUnitSize, secLabelSize, W / 2, secY, ink);
        }
        // Pair stats
        const pairY = secY + 114;
        const pairNumSize = W * 0.08;
        const pairSubSize = W * 0.018;
        if (s.tipo === 'musculacao') {
            const left = s.exercicios ? { v: String(s.exercicios), l: s.exercicios > 1 ? 'exercícios' : 'exercício' } : null;
            const right = s.series ? { v: String(s.series), l: 'séries' } : null;
            drawPairStats(ctx, left, right, pairNumSize, pairSubSize, pairY, W, ink);
        }
        else {
            const pairs = [];
            if (s.calorias)
                pairs.push({ v: String(s.calorias), l: 'kcal' });
            if (s.passos)
                pairs.push({ v: s.passos.toLocaleString('pt-BR'), l: 'passos' });
            drawPairStats(ctx, pairs[0] || null, pairs[1] || null, pairNumSize, pairSubSize, pairY, W, ink);
        }
        // Date footer
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.4;
        ctx.textAlign = 'center';
        ctx.font = `400 ${W * 0.018}px ${SANS}`;
        ctx.fillText(s.data, W / 2, H * 0.95);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'start';
    }
    // ---------- Shared helpers ----------
    function drawCover(ctx, img, W, H) {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const scale = Math.max(W / iw, H / ih);
        const dx = (W - iw * scale) / 2;
        const dy = (H - ih * scale) / 2;
        ctx.drawImage(img, dx, dy, iw * scale, ih * scale);
    }
    function drawCheckerboard(ctx, W, H) {
        const sz = 30;
        for (let y = 0; y < H; y += sz) {
            for (let x = 0; x < W; x += sz) {
                ctx.fillStyle = ((x / sz + y / sz) % 2 === 0) ? '#3a3a3a' : '#2a2a2a';
                ctx.fillRect(x, y, sz, sz);
            }
        }
    }
    function drawNumberWithUnit(ctx, numStr, unitStr, labelStr, numSize, unitSize, labelSize, cx, cy, ink) {
        ctx.font = `700 ${numSize}px ${SERIF}`;
        const numW = ctx.measureText(numStr).width;
        let unitW = 0, unitGap = 0;
        if (unitStr) {
            ctx.font = `500 ${unitSize}px ${SANS}`;
            unitW = ctx.measureText(unitStr).width;
            unitGap = 8;
        }
        const totalW = numW + unitGap + unitW;
        const startX = cx - totalW / 2;
        ctx.fillStyle = ink;
        ctx.textAlign = 'left';
        ctx.font = `700 ${numSize}px ${SERIF}`;
        ctx.fillText(numStr, startX, cy);
        if (unitStr) {
            ctx.font = `500 ${unitSize}px ${SANS}`;
            ctx.globalAlpha = 0.7;
            ctx.fillText(unitStr, startX + numW + unitGap, cy);
            ctx.globalAlpha = 1;
        }
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;
        ctx.font = `500 ${labelSize}px ${SANS}`;
        ctx.fillText(labelStr, cx, cy + numSize * 0.45);
        ctx.globalAlpha = 1;
    }
    function drawPairStats(ctx, left, right, numSize, subSize, pairY, W, ink) {
        if (!left && !right)
            return;
        const leftX = (left && right) ? W * 0.3 : W / 2;
        const rightX = W * 0.7;
        if (left) {
            ctx.fillStyle = ink;
            ctx.textAlign = 'center';
            ctx.font = `700 ${numSize}px ${SERIF}`;
            ctx.fillText(left.v, leftX, pairY);
            ctx.globalAlpha = 0.6;
            ctx.font = `500 ${subSize}px ${SANS}`;
            ctx.letterSpacing = '2px';
            ctx.fillText(left.l, leftX, pairY + numSize * 0.42);
            ctx.letterSpacing = '0px';
            ctx.globalAlpha = 1;
        }
        if (left && right) {
            ctx.strokeStyle = 'rgba(26,46,28,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(W / 2, pairY - numSize * 0.7);
            ctx.lineTo(W / 2, pairY + numSize * 0.5);
            ctx.stroke();
        }
        if (right) {
            ctx.fillStyle = ink;
            ctx.textAlign = 'center';
            ctx.font = `700 ${numSize}px ${SERIF}`;
            ctx.fillText(right.v, rightX, pairY);
            ctx.globalAlpha = 0.6;
            ctx.font = `500 ${subSize}px ${SANS}`;
            ctx.letterSpacing = '2px';
            ctx.fillText(right.l, rightX, pairY + numSize * 0.42);
            ctx.letterSpacing = '0px';
            ctx.globalAlpha = 1;
        }
        ctx.textAlign = 'start';
    }
    if (modelo === 'adesivo')
        return drawTipografico(ctx, s, 1080, 1920, { transparent: !previa, showPhoto: previa && !!userPhotoImg, checkerboard: previa && !userPhotoImg });
    if (modelo === 'foto')
        drawFoto(ctx, s, 1080, 1920);
    else
        drawEditorial(ctx, s, 1080, 1920);
    return undefined;
}
function horarioSessao(treino) {
    const data = new Date(treino.inicio);
    return Number.isFinite(data.getTime()) ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
}
function duracaoSessao(treino) {
    const segundos = treino.fim ? (Date.parse(treino.fim) - Date.parse(treino.inicio)) / 1000 : NaN;
    const total = Number.isFinite(segundos) && segundos >= 0 ? segundos : treino.duracao_minutos !== undefined && treino.duracao_minutos > 0 ? treino.duracao_minutos * 60 : NaN;
    if (!Number.isFinite(total) || total < 0)
        return 'Duração não informada';
    const inteiro = Math.floor(total);
    return `${String(Math.floor(inteiro / 60)).padStart(2, '0')}:${String(inteiro % 60).padStart(2, '0')}`;
}
function cenarioCard(treino, dados) {
    const data = new Date(`${treino.data}T12:00:00`).toLocaleDateString('pt-BR');
    if (dados.cardio) {
        const s = dados.cardio, segundos = Math.round(s.duracao_minutos * 60);
        const ritmoSeg = s.distancia_km && s.distancia_km > 0 ? Math.round(segundos / s.distancia_km) : undefined;
        return { tipo: 'cardio', data, duracaoLabel: `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`,
            distancia: s.distancia_km, calorias: s.calorias_informadas ?? s.calorias_estimadas, passos: s.passos,
            ritmo: ritmoSeg === undefined ? undefined : `${Math.floor(ritmoSeg / 60)}'${String(ritmoSeg % 60).padStart(2, '0')}"/km` };
    }
    return { tipo: 'musculacao', data, duracaoLabel: duracaoSessao(treino), volume: dados.volume,
        exercicios: dados.exercicios, series: dados.series, repeticoes: dados.repeticoesCorporais, calorias: treino.calorias };
}
function exportar(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível exportar o card.')), 'image/png'));
}
async function criarImagensCardAprovado(treino, dados, foto, opcoes = {}) {
    const modelo = opcoes.modelo === 'foto' ? 'foto' : opcoes.modelo === 'adesivo' ? 'adesivo' : 'minimalista';
    let imagem = null;
    if (foto && modelo !== 'minimalista') {
        const url = URL.createObjectURL(foto);
        try {
            imagem = new Image();
            imagem.src = url;
            await imagem.decode();
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }
    const s = cenarioCard(treino, dados);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Não foi possível criar o card.');
    const bounds = desenharCardAprovado(ctx, s, modelo, opcoes.cor ?? 'clara', imagem);
    let arquivo = canvas;
    if (bounds) {
        const pad = 36, x = Math.max(0, Math.floor(bounds.minX - pad)), y = Math.max(0, Math.floor(bounds.minY - pad));
        arquivo = document.createElement('canvas');
        arquivo.width = Math.min(1080 - x, Math.ceil(bounds.maxX - bounds.minX + pad * 2));
        arquivo.height = Math.min(1920 - y, Math.ceil(bounds.maxY - bounds.minY + pad * 2));
        const corte = arquivo.getContext('2d');
        if (!corte)
            throw new Error('Não foi possível criar o adesivo.');
        corte.drawImage(canvas, x, y, arquivo.width, arquivo.height, 0, 0, arquivo.width, arquivo.height);
    }
    const blob = await exportar(arquivo);
    if (modelo !== 'adesivo')
        return { blob, previa: blob };
    desenharCardAprovado(ctx, s, modelo, opcoes.cor ?? 'clara', imagem, true);
    return { blob, previa: await exportar(canvas) };
}

window.rendererPrototipoAprovado={criarImagensCardAprovado,desenharCardAprovado};
})();
