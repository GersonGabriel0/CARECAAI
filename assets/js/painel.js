const usuario = sessionStorage.getItem('carecai_usuario');
const score   = parseInt(sessionStorage.getItem('carecai_score') || '0', 10);
const tipo    = sessionStorage.getItem('carecai_tipo');

if (!usuario || !tipo) {
  window.location.href = 'login.html';
}

const nomeEl  = document.querySelector('#painel-nome');
const scoreEl = document.querySelector('#painel-score');

if (nomeEl)  nomeEl.textContent  = usuario;
if (scoreEl) scoreEl.textContent = score + ' pts';

// barra de progresso — so existe no painel-calvo
const fill    = document.querySelector('#progresso-fill');
const faltam  = document.querySelector('#faltam');

if (fill) {
  const pct = Math.min((score / 80) * 100, 100);
  fill.style.width = pct + '%';
}

if (faltam) {
  const diff = Math.max(80 - score, 0);
  faltam.textContent = diff;
}

document.querySelector('#sair-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
