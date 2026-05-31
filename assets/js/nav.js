(function () {
  const usuario  = sessionStorage.getItem('carecai_usuario');
  const tipo     = sessionStorage.getItem('carecai_tipo');
  const fotoPath = sessionStorage.getItem('carecai_foto_path');
  const link     = document.querySelector('.login-link');

  if (!link || !usuario || !tipo) return;

  const painelUrl = tipo === 'careca' ? 'painel-careca.html' : 'painel-calvo.html';
  const fallback  = tipo === 'careca' ? '🏆' : '🌱';

  const perfil = document.createElement('a');
  perfil.className = 'perfil-link';
  perfil.href = painelUrl;

  if (fotoPath) {
    const img = document.createElement('img');
    img.className = 'perfil-avatar';
    img.src = fotoPath;
    img.alt = usuario;
    img.onerror = () => { img.replaceWith(document.createTextNode(fallback)); };
    perfil.appendChild(img);
  } else {
    const emoji = document.createElement('span');
    emoji.className = 'perfil-emoji';
    emoji.textContent = fallback;
    perfil.appendChild(emoji);
  }

  const nome = document.createElement('span');
  nome.className = 'perfil-usuario';
  nome.textContent = `@${usuario}`;
  perfil.appendChild(nome);

  const sair = document.createElement('button');
  sair.type      = 'button';
  sair.className = 'theme-button nav-sair-btn';
  sair.textContent = 'Sair';
  sair.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  link.replaceWith(perfil);
  perfil.insertAdjacentElement('afterend', sair);
})();
