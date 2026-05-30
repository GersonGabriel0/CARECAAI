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

// Pools de metricas
const CORES = ['purple', 'blue', 'slate', 'orange', 'green', 'red'];

const POOL_CARECA = [
  { label: 'Brilho Craniano',           cor: 'purple', val: () => `${rnd(88, 100)}%`,    bar: () => rnd(88, 100) },
  { label: 'Coeficiente Aerodinamico',  cor: 'blue',   val: () => fmtDec(rnd(85, 98)),   bar: () => rnd(85, 98)  },
  { label: 'Nivel de Penteabilidade',   cor: 'slate',  val: () => '0%',                  bar: () => 0            },
  { label: 'Indice de Polimento',       cor: 'orange', val: () => `${rnd(80, 99)}%`,    bar: () => rnd(80, 99)  },
  { label: 'Autoestima Craniana',       cor: 'green',  val: () => `${rnd(85, 100)}%`,   bar: () => rnd(85, 100) },
  { label: 'Perigo de Reflexo Solar',   cor: 'red',    val: () => 'ALTO',                bar: () => rnd(78, 95)  },
  { label: 'Economia em Shampoo',       cor: 'green',  val: () => '100%',                bar: () => 100          },
  { label: 'Resistencia ao Vento',      cor: 'blue',   val: () => `${rnd(88, 100)}%`,   bar: () => rnd(88, 100) },
  { label: 'Taxa de Intimidacao',       cor: 'purple', val: () => `${rnd(75, 98)}%`,    bar: () => rnd(75, 98)  },
  { label: 'Uso de Condicionador',      cor: 'slate',  val: () => '0%',                  bar: () => 0            },
];

const POOL_CALVO = [
  { label: 'Entradas Triunfais',        cor: 'orange', val: () => `${Math.min(79, score)}%`,          bar: () => Math.min(79, score)         },
  { label: 'Potencial Aerodinamico',    cor: 'blue',   val: () => fmtDec(Math.min(79, score + 8)),    bar: () => Math.min(79, score + 8)     },
  { label: 'Fios Sobreviventes',        cor: 'purple', val: () => `${Math.max(8, 100 - score)}%`,     bar: () => Math.max(8, 100 - score)    },
  { label: 'Indice de Desapego',        cor: 'orange', val: () => `${rnd(25, 68)}%`,                  bar: () => rnd(25, 68)                 },
  { label: 'Esperanca Craniana',        cor: 'green',  val: () => `${Math.min(98, score + 24)}%`,     bar: () => Math.min(98, score + 24)    },
  { label: 'Risco de Pente Emprestado', cor: 'red',    val: () => score > 50 ? 'MEDIO' : 'BAIXO',     bar: () => score > 50 ? 52 : 20        },
  { label: 'Taxa de Negacao',           cor: 'orange', val: () => `${rnd(20, 75)}%`,                  bar: () => rnd(20, 75)                 },
  { label: 'Foliculos em Greve',        cor: 'red',    val: () => `${Math.min(95, score + rnd(5,20))}%`, bar: () => Math.min(95, score + 15) },
  { label: 'Progresso para Pista',      cor: 'blue',   val: () => `${score}%`,                        bar: () => score                       },
];

function renderMetrics(pool) {
  const grid = document.querySelector('#metric-grid');
  if (!grid) return;

  const selecionadas = shuffle(pool).slice(0, 6);

  grid.innerHTML = selecionadas.map((m) => {
    const barVal = m.bar();
    return `
      <article class="metric-tile metric-tile--${m.cor}">
        <span>${m.label}</span>
        <strong>${m.val()}</strong>
        <i style="--progress: ${barVal}%"></i>
      </article>`;
  }).join('');
}

if (tipo === 'careca') {
  setText('#ranking-percentual', Math.max(1, 102 - score));
  renderMetrics(POOL_CARECA);
} else {
  setText('#painel-score', `${score} pts`);
  renderMetrics(POOL_CALVO);

  const fill   = document.querySelector('#progresso-fill');
  const faltam = Math.max(80 - score, 0);
  setText('#faltam', faltam);
  if (fill) fill.style.width = `${Math.min((score / 80) * 100, 100)}%`;
}

// Diagnostico aleatorio do JSON
async function carregarDiagnostico() {
  try {
    const res  = await fetch('assets/js/json_textos.json');
    const data = await res.json();
    const pool = data[tipo] || [];
    if (!pool.length) return;

    const diag = pool[Math.floor(Math.random() * pool.length)];
    setText('#diagnosis-titulo', diag.titulo);
    setText('#diagnosis-texto',  diag.texto);
  } catch {
    setText('#diagnosis-titulo', 'Diagnostico indisponivel.');
    setText('#diagnosis-texto',  '');
  }
}

carregarDiagnostico();

document.querySelector('#sair-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
