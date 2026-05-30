const form        = document.querySelector('#login-form');
const photoInput  = document.querySelector('#photo-login');
const uploadLabel = document.querySelector('#upload-label');
const uploadTexto = document.querySelector('#upload-texto');
const preview     = document.querySelector('#foto-preview');
const msg         = document.querySelector('#login-message');
const resultado   = document.querySelector('#resultado');

const LIMIAR_CARECA = 80;

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  uploadTexto.textContent = file.name;
  uploadLabel.classList.add('com-foto');
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
});

const MENSAGENS_ANALISE = [
  'Medindo brilho craniano...',
  'Calculando aerodinamica...',
  'Verificando refletividade...',
  'Consultando base de carecas...',
  'Classificando resultado...',
];

async function rodarAnalise() {
  for (const texto of MENSAGENS_ANALISE) {
    msg.textContent = texto;
    await esperar(360);
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gerarScore() {
  // 65% de chance de careca para demo mais interessante
  return Math.random() < 0.65
    ? Math.floor(Math.random() * 21) + 80   // 80-100
    : Math.floor(Math.random() * 60) + 15;  // 15-79
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.querySelector('#usuario').value.trim();

  if (!usuario) {
    msg.textContent = 'Informe seu usuario.';
    return;
  }

  if (!photoInput.files.length) {
    msg.textContent = 'Envie uma foto para identificacao.';
    return;
  }

  form.querySelector('button[type="submit"]').disabled = true;

  await rodarAnalise();

  const score = gerarScore();
  const tipo  = score >= LIMIAR_CARECA ? 'careca' : 'calvo';

  sessionStorage.setItem('carecai_usuario', usuario);
  sessionStorage.setItem('carecai_score',   score);
  sessionStorage.setItem('carecai_tipo',    tipo);

  msg.textContent = '';
  resultado.hidden = false;

  document.querySelector('#resultado-score').textContent = score + ' pts';
  document.querySelector('#resultado-tipo').textContent  =
    tipo === 'careca' ? '🏆 CARECA VERIFICADO' : '🌱 CALVO EM EVOLUCAO';
  document.querySelector('#resultado-desc').textContent  =
    tipo === 'careca'
      ? 'Redirecionando para o painel elite...'
      : 'Redirecionando para o painel aspirante...';

  await esperar(1800);
  window.location.href = tipo === 'careca' ? 'painel-careca.html' : 'painel-calvo.html';
});
