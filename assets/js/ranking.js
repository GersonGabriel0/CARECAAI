const RANKING_API = 'api/ranking.php';
const TEXTOS_URL = 'assets/js/json_textos.json';
const MEDALHAS = ['1', '2', '3'];

const themeButton = document.querySelector('#theme-button');
themeButton.addEventListener('click', () => {
  const isBaldMode = document.documentElement.classList.toggle('bald-mode');
  themeButton.textContent = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}

function escolherFrase(textos, item) {
  const opcoes = textos[item.tipo] || [];
  if (!opcoes.length) return 'Superficie craniana sob observacao.';

  return opcoes[Math.floor(Math.random() * opcoes.length)].titulo;
}

function renderLado(data, elementId, textos) {
  const list = document.querySelector(`#${elementId}`);

  if (!data.length) {
    list.innerHTML = '<li class="ranking-vazio">Nenhum usuario cadastrado ainda.</li>';
    return;
  }

  list.innerHTML = data
    .map((item, index) => {
      const posicao = MEDALHAS[index] || `${index + 1}`;
      const foto = item.foto || 'assets/images/placeholder.svg';
      const frase = escolherFrase(textos, item);

      return `
        <li class="ranking-item">
          <span class="ranking-pos">${posicao}</span>
          <img class="ranking-avatar" src="${escapeHtml(foto)}" alt="Foto de ${escapeHtml(item.usuario)}">
          <div class="ranking-info">
            <strong class="ranking-nome">${escapeHtml(item.usuario)}</strong>
            <small>@${escapeHtml(item.usuario)}</small>
            <em class="ranking-frase">${escapeHtml(frase)}</em>
          </div>
          <div class="ranking-score-wrap">
            <span class="ranking-score">${escapeHtml(item.score)} pts</span>
            <div class="ranking-bar">
              <div class="ranking-bar-fill" style="width:${Number(item.score)}%"></div>
            </div>
          </div>
        </li>`;
    })
    .join('');
}

async function loadRanking() {
  try {
    const [rankingResponse, textosResponse] = await Promise.all([
      fetch(RANKING_API),
      fetch(TEXTOS_URL),
    ]);

    if (!rankingResponse.ok || !textosResponse.ok) {
      throw new Error('Nao foi possivel carregar o ranking.');
    }

    const [ranking, textos] = await Promise.all([
      rankingResponse.json(),
      textosResponse.json(),
    ]);

    const carecas = ranking.filter((item) => item.tipo === 'careca');
    const calvos = ranking.filter((item) => item.tipo === 'calvo');

    renderLado(carecas, 'ranking-carecas', textos);
    renderLado(calvos, 'ranking-calvos', textos);
  } catch (error) {
    document.querySelector('#ranking-carecas').innerHTML =
      `<li class="ranking-vazio">${escapeHtml(error.message)}</li>`;
    document.querySelector('#ranking-calvos').innerHTML =
      '<li class="ranking-vazio">Confira a conexao com o banco.</li>';
  }
}

loadRanking();
