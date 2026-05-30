const TAPAS_API = 'api/tapas.php';
const SLAPPED_KEY = 'carecai_slapped';
const ICONE = { careca: 'TP', calvo: 'MQ' };
const ROTULO = { careca: 'tapas', calvo: 'maquinadas' };

let todasFotos = [];
let filtroAtivo = 'todos';

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}

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
  const element = document.createElement('span');
  element.className = 'tapa-hand';
  element.textContent = ICONE[tipo] || 'TP';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  container.appendChild(element);
  element.addEventListener('animationend', () => element.remove());
}

async function onInteracao(event, id, tipo) {
  const fotoElement = event.currentTarget;
  if (fotoElement.classList.contains('slapped')) return;

  const rect = fotoElement.getBoundingClientRect();
  spawnEmoji(event.clientX - rect.left, event.clientY - rect.top, fotoElement, tipo);
  fotoElement.classList.add('slapping', 'slapped');
  fotoElement.addEventListener('animationend', () => fotoElement.classList.remove('slapping'), { once: true });
  markSlapped(id);

  const numberElement = document.querySelector(`#tapas-${id} .tapa-num`);
  if (numberElement) numberElement.textContent = parseInt(numberElement.textContent, 10) + 1;

  try {
    await fetch(TAPAS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto_id: id }),
    });
  } catch { /* A animacao local continua mesmo se a rede oscilar. */ }
}

function buildCard(foto) {
  const card = document.createElement('article');
  const slapped = hasSlapped(foto.id);
  const icone = ICONE[foto.tipo] || 'TP';
  const rotulo = ROTULO[foto.tipo] || 'tapas';
  const image = foto.foto || 'assets/images/placeholder.svg';

  card.className = `galeria-card galeria-card--${foto.tipo}`;
  card.dataset.tipo = foto.tipo;
  card.innerHTML = `
    <div class="galeria-foto${slapped ? ' slapped' : ''}" data-id="${foto.id}">
      <img src="${escapeHtml(image)}" alt="Foto de ${escapeHtml(foto.usuario)}" loading="lazy">
      <div class="score-badge">${escapeHtml(foto.score)}</div>
      <div class="tipo-badge tipo-badge--${escapeHtml(foto.tipo)}">
        ${foto.tipo === 'careca' ? 'Careca Elite' : 'Calvo em evolucao'}
      </div>
    </div>
    <div class="galeria-info">
      <strong class="galeria-usuario">@${escapeHtml(foto.usuario)}</strong>
      <span class="tapa-counter" id="tapas-${foto.id}">
        ${icone} <span class="tapa-num">${escapeHtml(foto.tapas)}</span> ${rotulo}
      </span>
    </div>`;

  card.querySelector('.galeria-foto').addEventListener('click', (event) =>
    onInteracao(event, foto.id, foto.tipo)
  );
  return card;
}

function aplicarFiltro() {
  const grid = document.querySelector('#galeria-grid');
  const filtradas = filtroAtivo === 'todos'
    ? todasFotos
    : todasFotos.filter((foto) => foto.tipo === filtroAtivo);

  grid.innerHTML = '';

  if (!filtradas.length) {
    grid.innerHTML = '<p class="galeria-loading">Nenhuma foto cadastrada ainda.</p>';
    return;
  }

  filtradas.forEach((foto) => grid.appendChild(buildCard(foto)));
}

async function loadGaleria() {
  try {
    const response = await fetch(TAPAS_API);
    if (!response.ok) throw new Error();
    todasFotos = await response.json();
    aplicarFiltro();
  } catch {
    document.querySelector('#galeria-grid').innerHTML =
      '<p class="galeria-loading">Nao foi possivel carregar a galeria.</p>';
  }
}

document.querySelectorAll('.filtro-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    filtroAtivo = button.dataset.tipo;
    aplicarFiltro();
  });
});

const themeButton = document.querySelector('#theme-button');
themeButton.addEventListener('click', () => {
  const isBaldMode = document.documentElement.classList.toggle('bald-mode');
  themeButton.textContent = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});

loadGaleria();
