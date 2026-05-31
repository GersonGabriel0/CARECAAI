const TAPAS_API = 'api/interacoes.php';
const ICONE  = { careca: '👋', calvo: '🪒' };
const ROTULO = { careca: 'tapas', calvo: 'maquinadas' };

let todasFotos    = [];
let filtroAtivo   = 'todos';
let frasesGaleria = [];

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
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
  const jaSlapped   = fotoElement.classList.contains('slapped');
  const numEl       = document.querySelector(`#tapas-${id} .tapa-num`);
  const atual       = numEl ? parseInt(numEl.textContent, 10) : 0;

  // otimismo: aplica o estado invertido imediatamente
  if (jaSlapped) {
    fotoElement.classList.remove('slapped');
    if (numEl) numEl.textContent = Math.max(0, atual - 1);
  } else {
    const rect = fotoElement.getBoundingClientRect();
    spawnEmoji(event.clientX - rect.left, event.clientY - rect.top, fotoElement, tipo);
    fotoElement.classList.add('slapping', 'slapped');
    fotoElement.addEventListener('animationend', () => fotoElement.classList.remove('slapping'), { once: true });
    if (numEl) numEl.textContent = atual + 1;
  }

  try {
    const res = await fetch(TAPAS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto_id: id }),
    });

    if (res.status === 401) {
      // nao logado: desfaz o otimismo
      if (jaSlapped) {
        fotoElement.classList.add('slapped');
        if (numEl) numEl.textContent = atual;
      } else {
        fotoElement.classList.remove('slapped');
        if (numEl) numEl.textContent = atual;
      }
      return;
    }

    const data = await res.json().catch(() => ({}));
    // confirma o estado pelo retorno da API
    if (data.acao === 'adicionada') {
      fotoElement.classList.add('slapped');
    } else if (data.acao === 'removida') {
      fotoElement.classList.remove('slapped');
    }
  } catch { /* animacao local permanece */ }
}

function buildCard(foto) {
  const card = document.createElement('article');
  const slapped = !!foto.ja_tapou;
  const icone = ICONE[foto.tipo] || '👋';
  const rotulo = ROTULO[foto.tipo] || 'tapas';
  const image = foto.foto || 'assets/images/placeholder.svg';

  card.className = `galeria-card galeria-card--${foto.tipo}`;
  card.dataset.tipo = foto.tipo;
  const pool  = (frasesGaleria[foto.tipo] || []);
  const frase = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';

  card.innerHTML = `
    <div class="galeria-foto${slapped ? ' slapped' : ''}" data-id="${foto.id}">
      <img src="${escapeHtml(image)}" alt="Foto de ${escapeHtml(foto.usuario)}" loading="lazy">
      <div class="score-badge">${escapeHtml(foto.score)}</div>
      <div class="tipo-badge tipo-badge--${escapeHtml(foto.tipo)}">
        ${foto.tipo === 'careca' ? 'Careca Elite' : 'Calvo em evolucao'}
      </div>
    </div>
    <div class="galeria-info">
      <div class="galeria-usuario-wrap">
        <strong class="galeria-usuario">@${escapeHtml(foto.usuario)}</strong>
        ${frase ? `<small class="galeria-frase">${escapeHtml(frase)}</small>` : ''}
      </div>
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
    const [fotosRes, frasesRes] = await Promise.all([
      fetch(TAPAS_API),
      fetch('assets/textos/galeria.json'),
    ]);
    if (!fotosRes.ok) throw new Error();
    todasFotos    = await fotosRes.json();
    frasesGaleria = frasesRes.ok ? await frasesRes.json() : [];
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
  const icon = themeButton.querySelector('.theme-icon');
  if (icon) {
    icon.src = isBaldMode ? 'assets/Cabeludo.svg' : 'assets/Careca.svg';
    icon.alt = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
  }
  themeButton.title = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});

loadGaleria();
