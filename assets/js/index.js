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
