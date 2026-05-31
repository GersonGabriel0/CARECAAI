(function () {
  const FRASES_ENTRAR = [
    'Cabelo tampando sua visao, hein?',
    'Seus fios tomaram o controle.',
    'Protecao capilar ativada. Boa sorte.',
    'O cabelo assumiu o comando.',
    'Shampoo em excesso detectado.',
    'Fios rebeldes bloquearam a luz.',
    'Seu topete e mais poderoso que o sol.',
    'Densidade capilar: CRITICA.',
    'Visao obstruida por massa capilar nao autorizada.',
    'Cabelo 1 x 0 Visao. Placar atual.',
  ];

  const FRASES_SAIR = [
    'Careca refletiu d+. Volta pro escuro.',
    'O brilho craniano foi longe demais.',
    'Superficie craniana: luminosidade maxima.',
    'Reflexo solar em nivel critico.',
    'Sua careca iluminou a sala toda.',
    'Deu pra ver do espaco.',
    'Couro cabeludo: muito brilhante pra este mundo.',
    'A pista de pouso estava ativa demais.',
    'Visao: restaurada. Arrependimento: em andamento.',
    'Brilho desativado. A humanidade agradece.',
  ];

  function rnd(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function mostrarPopup(mensagem) {
    const anterior = document.querySelector('.bald-popup');
    if (anterior) anterior.remove();

    const popup = document.createElement('div');
    popup.className = 'bald-popup';
    popup.textContent = mensagem;
    document.body.appendChild(popup);

    // Forca reflow para transicao funcionar
    void popup.offsetHeight;
    popup.classList.add('bald-popup--visible');

    setTimeout(() => {
      popup.classList.remove('bald-popup--visible');
      popup.addEventListener('transitionend', () => popup.remove(), { once: true });
    }, 3000);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'class') {
        const isBald = document.documentElement.classList.contains('bald-mode');
        mostrarPopup(isBald ? rnd(FRASES_ENTRAR) : rnd(FRASES_SAIR));
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });
})();
