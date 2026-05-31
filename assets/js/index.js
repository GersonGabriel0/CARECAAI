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

function animarNumero(el, alvo, duracao) {
  const inicio = performance.now();
  const step = (agora) => {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const easing = 1 - Math.pow(1 - progresso, 3);
    const atual = Math.round(easing * alvo);
    el.textContent = atual.toLocaleString('pt-BR');
    if (progresso < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function carregarStats() {
  try {
    const res  = await fetch('api/stats.php');
    if (!res.ok) return;
    const data = await res.json();
    if (data.error) return;

    const mapa = {
      analises: data.analises,
      carecas:  data.carecas,
      tapas:    data.tapas,
      calvos:   data.calvos,
    };

    document.querySelectorAll('.stat-num').forEach((el) => {
      const chave = el.dataset.stat;
      if (chave && mapa[chave] !== undefined) {
        animarNumero(el, mapa[chave], 1200);
      }
    });
  } catch { /* mantém valores padrão */ }
}

carregarStats();
