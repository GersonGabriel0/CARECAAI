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

const form        = document.querySelector('#login-form');
const photoInput  = document.querySelector('#photo-login');
const uploadLabel = document.querySelector('#upload-label');
const uploadTexto = document.querySelector('#upload-texto');
const preview     = document.querySelector('#foto-preview');
const previewWrap = document.querySelector('#foto-preview-wrap');
const msg         = document.querySelector('#login-message');
const resultado   = document.querySelector('#resultado');
const baldOffer   = document.querySelector('#bald-offer');
const baldButton  = document.querySelector('#bald-filter-button');
const continueLink = document.querySelector('#continue-link');
const analysisProvider = document.querySelector('#analysis-provider');
const filterProvider = document.querySelector('#filter-provider');

let savedFotoPath = '';

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  uploadTexto.textContent = file.name;
  uploadLabel.classList.add('com-foto');
  preview.src = URL.createObjectURL(file);
  previewWrap.hidden = false;
});

const MENSAGENS_ANALISE = [
  'Medindo brilho craniano...',
  'Calculando aerodinamica...',
  'Verificando refletividade...',
  'Consultando o Gemini...',
  'Classificando resultado...',
];

async function rodarAnalise() {
  for (const texto of MENSAGENS_ANALISE) {
    msg.textContent = texto;
    await esperar(260);
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usuario = document.querySelector('#usuario').value.trim();
  const submitButton = form.querySelector('button[type="submit"]');

  if (!usuario) {
    msg.textContent = 'Informe seu usuario.';
    return;
  }

  if (!photoInput.files.length) {
    msg.textContent = 'Envie uma foto para identificacao.';
    return;
  }

  submitButton.disabled = true;
  await rodarAnalise();

  const formData = new FormData();
  formData.append('usuario', usuario);
  formData.append('photo', photoInput.files[0]);
  formData.append('provider', analysisProvider.value);

  let analise;

  try {
    const response = await fetch('api/analisar.php', {
      method: 'POST',
      body: formData,
    });
    analise = await response.json();

    if (!response.ok) {
      throw new Error(analise.error || 'Nao foi possivel analisar a foto.');
    }
  } catch (error) {
    msg.textContent = error.message;
    submitButton.disabled = false;
    return;
  }

  savedFotoPath = analise.foto_path || '';

  sessionStorage.setItem('carecai_usuario',   usuario);
  sessionStorage.setItem('carecai_score',     analise.score);
  sessionStorage.setItem('carecai_tipo',      analise.tipo);
  sessionStorage.setItem('carecai_foto_path', savedFotoPath);

  msg.textContent = '';
  resultado.hidden = false;
  baldOffer.hidden = !analise.needs_bald_filter;

  document.querySelector('#resultado-score').textContent = `${analise.score} pts`;
  document.querySelector('#resultado-tipo').textContent =
    analise.tipo === 'careca' ? 'CARECA VERIFICADO' : 'CALVO EM EVOLUCAO';
  document.querySelector('#resultado-desc').textContent = analise.message;
  continueLink.href =
    analise.tipo === 'careca' ? 'painel-careca.html' : 'painel-calvo.html';

  if (!analise.needs_bald_filter) {
    await esperar(1800);
    window.location.href = continueLink.href;
  }
});

baldButton.addEventListener('click', async () => {
  baldButton.disabled = true;
  msg.textContent = 'Aplicando upgrade aerodinamico com IA...';

  const formData = new FormData();
  formData.append('foto_path', savedFotoPath);
  formData.append('provider', filterProvider.value);

  try {
    const response = await fetch('api/aplicar-filtro.php', {
      method: 'POST',
      body: formData,
    });
    const filtro = await response.json();

    if (!response.ok) {
      throw new Error(filtro.error || 'Nao foi possivel aplicar o filtro.');
    }

    preview.src = filtro.image;

    // Atualiza sessionStorage com novo status
    if (filtro.tipo) {
      sessionStorage.setItem('carecai_tipo',      filtro.tipo);
      sessionStorage.setItem('carecai_score',     String(filtro.score ?? 0));
      if (filtro.foto_path) {
        sessionStorage.setItem('carecai_foto_path', filtro.foto_path);
        savedFotoPath = filtro.foto_path;
      }

      // Atualiza card de resultado na tela
      document.querySelector('#resultado-score').textContent = `${filtro.score} pts`;
      document.querySelector('#resultado-tipo').textContent  =
        filtro.tipo === 'careca' ? 'CARECA VERIFICADO' : 'CALVO EM EVOLUCAO';
      if (filtro.message) {
        document.querySelector('#resultado-desc').textContent = filtro.message;
      }
      continueLink.href = filtro.tipo === 'careca' ? 'painel-careca.html' : 'painel-calvo.html';
    }

    msg.textContent = 'Upgrade aplicado: menos cabelo, mais velocidade de cruzeiro.';
  } catch (error) {
    msg.textContent = `${error.message} A foto original foi mantida.`;
  } finally {
    baldButton.disabled = false;
  }
});
