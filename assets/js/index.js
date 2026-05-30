const themeButton = document.querySelector('#theme-button');
themeButton.addEventListener('click', () => {
  const isBaldMode = document.documentElement.classList.toggle('bald-mode');
  themeButton.textContent = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});
