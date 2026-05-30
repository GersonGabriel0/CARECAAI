const TAPAS_API  = 'api/tapas.php';
const SLAPPED_KEY = 'carecai_slapped';

const MOCK_FOTOS = [
  { id: 1, usuario: 'gerson',        score: 97, tapas: 42, tipo: 'careca' },
  { id: 2, usuario: 'gui',           score: 89, tapas: 31, tipo: 'careca' },
  { id: 3, usuario: 'kety',          score: 72, tapas: 18, tipo: 'calvo'  },
  { id: 4, usuario: 'thomaz',        score: 34, tapas: 7,  tipo: 'calvo'  },
  { id: 5, usuario: 'gabriel_nunes', score: 95, tapas: 38, tipo: 'careca' },
  { id: 6, usuario: 'giokozz',       score: 88, tapas: 25, tipo: 'careca' },
  { id: 7, usuario: 'lojhan',        score: 61, tapas: 12, tipo: 'calvo'  },
];

const ICONE   = { careca: '👋', calvo: '🪒' };
const ROTULO  = { careca: 'tapas', calvo: 'maquinadas' };

let todasFotos = [];
let filtroAtivo = 'todos';

function getSlapped() {
  try { return JSON.parse(localStorage.getItem(SLAPPED_KEY) || '[]'); }
  catch { return []; }
}

function markSlapped(id) {
  const list = getSlapped();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(SLAPPED_KEY, JSON.stringify(list));
  }
}

function hasSlapped(id) {
  return getSlapped().includes(id);
}

function spawnEmoji(x, y, container, tipo) {
  const el = document.createElement('span');
  el.className = 'tapa-hand';
  el.textContent = ICONE[tipo] || '👋';
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

async function onInteracao(e, id, tipo) {
  const fotoEl = e.currentTarget;
  if (fotoEl.classList.contains('slapped')) return;

  const rect = fotoEl.getBoundingClientRect();
  spawnEmoji(e.clientX - rect.left, e.clientY - rect.top, fotoEl, tipo);

  fotoEl.classList.add('slapping', 'slapped');
  fotoEl.addEventListener('animationend', () => fotoEl.classList.remove('slapping'), { once: true });
  markSlapped(id);

  const numEl = document.querySelector(`#tapas-${id} .tapa-num`);
  if (numEl) {
    numEl.textContent = parseInt(numEl.textContent, 10) + 1;
    numEl.classList.add('tapa-bounce');
    numEl.addEventListener('animationend', () => numEl.classList.remove('tapa-bounce'), { once: true });
  }

  try {
    await fetch(TAPAS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto_id: id }),
    });
  } catch { /* contador ja atualizado localmente */ }
}

function buildCard(foto) {
  const slapped = hasSlapped(foto.id);
  const icone   = ICONE[foto.tipo]  || '👋';
  const rotulo  = ROTULO[foto.tipo] || 'tapas';

  const card = document.createElement('article');
  card.className = `galeria-card galeria-card--${foto.tipo}`;
  card.dataset.tipo = foto.tipo;

  card.innerHTML = `
    <div class="galeria-foto${slapped ? ' slapped' : ''}" data-id="${foto.id}">
      <img
        src="https://picsum.photos/seed/${foto.usuario}/400/400"
        alt="Foto de ${foto.usuario}"
        loading="lazy"
      >
      <div class="score-badge">${foto.score}</div>
      <div class="tipo-badge tipo-badge--${foto.tipo}">
        ${foto.tipo === 'careca' ? '🏆 Careca' : '🌱 Calvo'}
      </div>
    </div>
    <div class="galeria-info">
      <strong class="galeria-usuario">@${foto.usuario}</strong>
      <span class="tapa-counter" id="tapas-${foto.id}">
        ${icone} <span class="tapa-num">${foto.tapas}</span> ${rotulo}
      </span>
    </div>
  `;

  card.querySelector('.galeria-foto').addEventListener('click', (e) =>
    onInteracao(e, foto.id, foto.tipo)
  );
  return card;
}

function aplicarFiltro() {
  const grid = document.querySelector('#galeria-grid');
  const filtradas = filtroAtivo === 'todos'
    ? todasFotos
    : todasFotos.filter((f) => f.tipo === filtroAtivo);

  grid.innerHTML = '';

  if (!filtradas.length) {
    grid.innerHTML = '<p class="galeria-loading">Nenhuma foto nessa categoria ainda.</p>';
    return;
  }

  filtradas.forEach((foto) => grid.appendChild(buildCard(foto)));
}

// TODO: substituir por fetch(TAPAS_API) quando o banco estiver configurado
function loadGaleria() {
  todasFotos = MOCK_FOTOS;
  aplicarFiltro();
}

// Filtros
document.querySelectorAll('.filtro-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtivo = btn.dataset.tipo;
    aplicarFiltro();
  });
});

// Bald Mode
const themeButton = document.querySelector('#theme-button');
themeButton.addEventListener('click', () => {
  const isBaldMode = document.documentElement.classList.toggle('bald-mode');
  themeButton.textContent = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});

loadGaleria();
