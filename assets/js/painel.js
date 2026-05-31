const usuario  = sessionStorage.getItem('carecai_usuario');
const score    = parseInt(sessionStorage.getItem('carecai_score') || '0', 10);
const tipo     = sessionStorage.getItem('carecai_tipo');
const fotoPath = sessionStorage.getItem('carecai_foto_path');

if (!usuario || !tipo) window.location.href = 'login.html';

function setText(sel, val) {
  const el = document.querySelector(sel);
  if (el) el.textContent = val;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fmtDec(v) {
  return (Math.min(99, Math.max(1, v)) / 100).toFixed(2).replace('.', ',');
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Foto de perfil
setText('#painel-nome', usuario);

const photo       = document.querySelector('#painel-foto');
const placeholder = document.querySelector('#painel-foto-placeholder');

if (photo && fotoPath) {
  photo.src = fotoPath;
  photo.addEventListener('load',  () => { photo.hidden = false; if (placeholder) placeholder.hidden = true; });
  photo.addEventListener('error', () => { photo.hidden = true;  if (placeholder) placeholder.hidden = false; });
} else if (photo) {
  photo.hidden = true;
}

function calcMetrica(m) {
  const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const dec = v => (Math.min(99, Math.max(1, v)) / 100).toFixed(2).replace('.', ',');
  const s = m.sufixo || '';
  let val, bar;

  switch (m.tipo) {
    case 'rnd':
      bar = r(m.min, m.max);
      val = `${bar}${s}`;
      break;
    case 'rnd_dec':
      bar = r(m.min, m.max);
      val = dec(bar);
      break;
    case 'fixo':
      val = m.valor;
      bar = m.bar ?? 0;
      break;
    case 'fixo_bar_rnd':
      val = m.valor;
      bar = r(m.min, m.max);
      break;
    case 'score_cap':
      bar = Math.min(m.cap, score);
      val = `${bar}${s}`;
      break;
    case 'score_plus':
      bar = Math.min(m.cap, score + m.add);
      val = `${bar}${s}`;
      break;
    case 'score_plus_dec':
      bar = Math.min(m.cap, score + m.add);
      val = dec(bar);
      break;
    case 'score_inv':
      bar = Math.max(m.floor, 100 - score);
      val = `${bar}${s}`;
      break;
    case 'score_inv_pct':
      bar = Math.max(5, 100 - score);
      val = `${bar}${s}`;
      break;
    case 'score_threshold':
      val = score > m.threshold ? m.acima : m.abaixo;
      bar = score > m.threshold ? m.bar_acima : m.bar_abaixo;
      break;
    case 'score_plus_rnd':
      bar = Math.min(m.cap, score + r(m.rnd_min, m.rnd_max));
      val = `${bar}${s}`;
      break;
    case 'score_pct':
      bar = score;
      val = `${bar}${s}`;
      break;
    default:
      val = '?'; bar = 0;
  }
  return { val, bar };
}

async function renderMetrics() {
  const grid = document.querySelector('#metric-grid');
  if (!grid) return;
  try {
    const pool = await fetch(`assets/textos/metricas-${tipo}.json`).then(r => r.json());
    grid.innerHTML = shuffle(pool).slice(0, 6).map((m) => {
      const { val, bar } = calcMetrica(m);
      return `
        <article class="metric-tile metric-tile--${m.cor}">
          <span>${m.label}</span>
          <strong>${val}</strong>
          <i style="--progress: ${bar}%"></i>
        </article>`;
    }).join('');
  } catch { grid.innerHTML = ''; }
}

async function carregarDiagnostico() {
  try {
    const pool = await fetch(`assets/textos/painel-${tipo}.json`).then(r => r.json());
    if (!pool.length) return;
    const diag = pool[Math.floor(Math.random() * pool.length)];
    setText('#diagnosis-titulo', diag.titulo);
    setText('#diagnosis-texto',  diag.texto);
  } catch {
    setText('#diagnosis-titulo', 'Diagnostico indisponivel.');
    setText('#diagnosis-texto',  '');
  }
}

async function carregarPosicao() {
  if (tipo !== 'careca') return;
  try {
    const res  = await fetch('api/posicao.php');
    if (!res.ok) return;
    const data = await res.json();
    if (data.error) return;

    const { posicao, total } = data;

    const overlayPos = document.querySelector('#ranking-posicao');
    const overlayTot = document.querySelector('#ranking-total');

    if (overlayPos) overlayPos.textContent = posicao;
    if (overlayTot) overlayTot.textContent = total;
  } catch { /* mantém display padrão */ }
}

async function init() {
  if (tipo === 'careca') {
    // valores provisórios enquanto a API carrega
    const overlayPos = document.querySelector('#ranking-posicao');
    if (overlayPos) overlayPos.textContent = '...';
  } else {
    setText('#painel-score', `${score} pts`);
    const fill   = document.querySelector('#progresso-fill');
    const faltam = Math.max(80 - score, 0);
    setText('#faltam', faltam);
    if (fill) fill.style.width = `${Math.min((score / 80) * 100, 100)}%`;
  }
  await Promise.all([renderMetrics(), carregarDiagnostico(), carregarPosicao()]);
}

init();

document.querySelector('#sair-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});

// CERTIFICADO
const isCareca = tipo === 'careca';

function fundoGrad(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  if (isCareca) { g.addColorStop(0, '#1e0a7a'); g.addColorStop(1, '#5b38e8'); }
  else          { g.addColorStop(0, '#5a3a00'); g.addColorStop(1, '#b8860b'); }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function moldura(ctx, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, w - 48, h - 48);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, w - 64, h - 64);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

let fotoCertificado = null;

function carregarFotoCertificado() {
  if (!fotoPath || fotoCertificado) return Promise.resolve(fotoCertificado);

  return new Promise((resolve) => {
    const imagem = new Image();
    imagem.onload = () => {
      fotoCertificado = imagem;
      resolve(imagem);
    };
    imagem.onerror = () => resolve(null);
    imagem.src = fotoPath;
  });
}

function desenharFotoCertificado(ctx, imagem, x, y, tamanho) {
  if (!imagem) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, tamanho / 2, 0, Math.PI * 2);
  ctx.clip();

  const escala = Math.max(tamanho / imagem.width, tamanho / imagem.height);
  const largura = imagem.width * escala;
  const altura = imagem.height * escala;
  ctx.drawImage(imagem, x - largura / 2, y - altura / 2, largura, altura);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, tamanho / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function desenharFrente(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  fundoGrad(ctx, w, h);

  // circulos decorativos
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.1,  h * 0.88, 120, 0, Math.PI * 2); ctx.fill();

  moldura(ctx, w, h);
  ctx.textAlign = 'center';

  // eyebrow + brand
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CERTIFICADO CRANIANO OFICIAL', w / 2, 68);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial';
  ctx.fillText('CarecAI', w / 2, 130);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w * 0.25, 148); ctx.lineTo(w * 0.75, 148); ctx.stroke();

  // usuario + tipo
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '17px Arial';
  ctx.fillText('Certificamos que', w / 2, 192);

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Arial';
  ctx.fillText(`@${usuario}`, w / 2, 248);

  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '17px Arial';
  ctx.fillText('e oficialmente', w / 2, 288);

  ctx.fillStyle = isCareca ? '#c4b5fd' : '#fde68a';
  ctx.font = 'bold 34px Arial';
  ctx.fillText(isCareca ? '🏆 CARECA ELITE' : '🌱 CALVO EM EVOLUCAO', w / 2, 336);

  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px Arial';
  ctx.fillText(`Score craniano: ${score} / 100 pts`, w / 2, 374);

  // diagnostico da IA
  const diagTitulo = document.querySelector('#diagnosis-titulo')?.textContent || '';
  const diagTexto  = document.querySelector('#diagnosis-texto')?.textContent  || '';

  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w * 0.15, 396); ctx.lineTo(w * 0.85, 396); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = 'bold 11px Arial';
  ctx.fillText('DIAGNOSTICO DA IA', w / 2, 416);

  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 14px Arial';
  ctx.fillText(diagTitulo, w / 2, 438);

  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '12px Arial';
  ctx.fillText(diagTexto, w / 2, 458);

  // rodape
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(w * 0.2, 482); ctx.lineTo(w * 0.8, 482); ctx.stroke();

  const hoje = new Date().toLocaleDateString('pt-BR');
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '11px Arial';
  ctx.textAlign = 'left';  ctx.fillText(`Emitido em: ${hoje}`, w * 0.2, 510);
  ctx.textAlign = 'right'; ctx.fillText('Assinado: IA CarecAI™', w * 0.8, 510);
}

function desenharVerso(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  fundoGrad(ctx, w, h);
  moldura(ctx, w, h);
  ctx.textAlign = 'center';

  // header
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = 'bold 13px Arial';
  ctx.fillText('ANALISE DETALHADA', w / 2, 62);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = 'bold 18px Arial';
  ctx.fillText('CarecAI', w / 2, 86);

  desenharFotoCertificado(ctx, fotoCertificado, w / 2, 142, 82);

  // ler metricas do DOM
  const tiles = Array.from(document.querySelectorAll('.metric-tile')).slice(0, 6);
  const metricas = tiles.map((t) => ({
    label:    t.querySelector('span')?.textContent  || '',
    valor:    t.querySelector('strong')?.textContent || '',
    progress: parseFloat(t.querySelector('i')?.style.getPropertyValue('--progress') || '0'),
  }));

  const cols = 3, rows = 2;
  const mX = 48, mY = 186;
  const cellW = (w - mX * 2) / cols;
  const cellH = (h - mY - 54) / rows;
  const pad = 8;

  metricas.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = mX + col * cellW;
    const y = mY + row * cellH;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, x + pad, y + pad, cellW - pad * 2, cellH - pad * 2, 10);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(m.label.toUpperCase(), x + cellW / 2, y + pad + 22);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Arial';
    ctx.fillText(m.valor, x + cellW / 2, y + pad + 54);

    // barra
    const bx = x + pad + 14, by = y + cellH - pad - 18;
    const bw = cellW - pad * 2 - 28, bh = 5;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, bx, by, bw, bh, 3); ctx.fill();

    const pct = Math.min(100, Math.max(0, m.progress)) / 100;
    if (pct > 0) {
      ctx.fillStyle = isCareca ? '#a78bfa' : '#fbbf24';
      roundRect(ctx, bx, by, bw * pct, bh, 3); ctx.fill();
    }
  });

  // rodape
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`@${usuario}  •  ${score} pts  •  ${new Date().toLocaleDateString('pt-BR')}`, w / 2, h - 34);
}

let flipado = false;

function virar(canvas) {
  canvas.classList.add('cert-girando');
  canvas.addEventListener('animationend', () => {
    canvas.classList.remove('cert-girando');
    flipado ? desenharVerso(canvas) : desenharFrente(canvas);
  }, { once: true });
}

async function gerarCertificado() {
  const canvas = document.querySelector('#cert-canvas');
  await carregarFotoCertificado();
  flipado = false;
  desenharFrente(canvas);
  document.querySelector('#cert-modal').hidden = false;
}

async function baixarPDF() {
  await carregarFotoCertificado();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW  = pdf.internal.pageSize.getWidth();
  const pageH  = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgH   = pageH - margin * 2;
  const imgW   = imgH * (800 / 560);
  const imgX   = (pageW - imgW) / 2;

  const cf = document.createElement('canvas');
  cf.width = 800; cf.height = 560;
  desenharFrente(cf);

  const cv = document.createElement('canvas');
  cv.width = 800; cv.height = 560;
  desenharVerso(cv);

  pdf.addImage(cf.toDataURL('image/jpeg', 0.95), 'JPEG', imgX, margin, imgW, imgH);
  pdf.addPage();
  pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', imgX, margin, imgW, imgH);

  pdf.save('certificado-carecai.pdf');
}

const certBtn      = document.querySelector('#cert-btn');
const certModal    = document.querySelector('#cert-modal');
const certFechar   = document.querySelector('#cert-fechar');
const certCanvas   = document.querySelector('#cert-canvas');
const certDownload = document.querySelector('#cert-download');

const themeBtn = document.querySelector('#theme-button');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isBaldMode = document.documentElement.classList.toggle('bald-mode');
    const icon = themeBtn.querySelector('.theme-icon');
    if (icon) {
      icon.src = isBaldMode ? 'assets/Cabeludo.svg' : 'assets/Careca.svg';
      icon.alt = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
    }
    themeBtn.title = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
  });
}

if (certBtn)      certBtn.addEventListener('click', gerarCertificado);
if (certFechar)   certFechar.addEventListener('click', () => { certModal.hidden = true; });
if (certModal)    certModal.addEventListener('click', (e) => { if (e.target === certModal) certModal.hidden = true; });
if (certCanvas)   certCanvas.addEventListener('click', () => { flipado = !flipado; virar(certCanvas); });
if (certDownload) certDownload.addEventListener('click', baixarPDF);
