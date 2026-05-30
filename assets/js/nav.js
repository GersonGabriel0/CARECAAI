(function () {
  const usuario = sessionStorage.getItem('carecai_usuario');
  const tipo    = sessionStorage.getItem('carecai_tipo');
  const link    = document.querySelector('.login-link');

  if (!link || !usuario || !tipo) return;

  const painelUrl = tipo === 'careca' ? 'painel-careca.html' : 'painel-calvo.html';
  const emoji     = tipo === 'careca' ? '🏆' : '🌱';

  const perfil = document.createElement('a');
  perfil.className = 'perfil-link';
  perfil.href = painelUrl;
  perfil.innerHTML = `<span class="perfil-emoji">${emoji}</span><span class="perfil-usuario">@${usuario}</span>`;

  link.replaceWith(perfil);
})();
