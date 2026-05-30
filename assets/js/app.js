const themeButton = document.querySelector("#theme-button");
const analyzeButton = document.querySelector("#analyze-button");
const photoInput = document.querySelector("#photo");
const feedback = document.querySelector("#feedback");

themeButton.addEventListener("click", () => {
  const isBaldMode = document.documentElement.classList.toggle("bald-mode");
  themeButton.textContent = isBaldMode ? "Recuperar visao" : "Ativar Bald Mode";
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  feedback.textContent = file ? `Foto selecionada: ${file.name}` : "";
});

analyzeButton.addEventListener("click", () => {
  if (!photoInput.files.length) {
    feedback.textContent = "Escolha uma foto antes de iniciar a analise.";
    return;
  }

  analyzeButton.disabled = true;
  feedback.textContent = "Calculando coeficiente aerodinamico...";

  window.setTimeout(() => {
    feedback.textContent =
      "Analise concluida: brilho 97%, aerodinamica 92% e penteabilidade 0%.";
    analyzeButton.disabled = false;
  }, 1200);
});
