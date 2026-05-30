const themeButton = document.querySelector("#theme-button");
const analyzeButton = document.querySelector("#analyze-button");
const photoInput = document.querySelector("#photo");
const feedback = document.querySelector("#feedback");
const preview = document.querySelector("#analysis-preview");
const previewImage = document.querySelector("#analysis-image");
const baldOffer = document.querySelector("#analysis-bald-offer");
const baldButton = document.querySelector("#analysis-bald-button");
const analysisProvider = document.querySelector("#analysis-provider");
const filterProvider = document.querySelector("#filter-provider");

themeButton.addEventListener("click", () => {
  const isBaldMode = document.documentElement.classList.toggle("bald-mode");
  themeButton.textContent = isBaldMode ? "Recuperar visao" : "Ativar Bald Mode";
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  feedback.textContent = file ? `Foto selecionada: ${file.name}` : "";

  if (file) {
    previewImage.src = URL.createObjectURL(file);
    preview.hidden = false;
    baldOffer.hidden = true;
  }
});

analyzeButton.addEventListener("click", async () => {
  if (!photoInput.files.length) {
    feedback.textContent = "Escolha uma foto antes de iniciar a analise.";
    return;
  }

  analyzeButton.disabled = true;
  feedback.textContent = "Gemini calculando coeficiente aerodinamico...";

  const formData = new FormData();
  formData.append("photo", photoInput.files[0]);
  formData.append("provider", analysisProvider.value);

  try {
    const response = await fetch("api/analisar.php", {
      method: "POST",
      body: formData,
    });
    const analise = await response.json();

    if (!response.ok) {
      throw new Error(analise.error || "Nao foi possivel analisar a foto.");
    }

    feedback.textContent =
      `${analise.message} Score careca: ${analise.score}/100.`;
    baldOffer.hidden = !analise.needs_bald_filter;
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    analyzeButton.disabled = false;
  }
});

baldButton.addEventListener("click", async () => {
  baldButton.disabled = true;
  feedback.textContent = "Aplicando modo careca turbo com IA...";

  const formData = new FormData();
  formData.append("photo", photoInput.files[0]);
  formData.append("provider", filterProvider.value);

  try {
    const response = await fetch("api/aplicar-filtro.php", {
      method: "POST",
      body: formData,
    });
    const filtro = await response.json();

    if (!response.ok) {
      throw new Error(filtro.error || "Nao foi possivel aplicar o filtro.");
    }

    previewImage.src = filtro.image;
    feedback.textContent =
      "Modo careca turbo aplicado. A imagem ja ganhou velocidade.";
  } catch (error) {
    feedback.textContent = `${error.message} A foto original foi mantida.`;
  } finally {
    baldButton.disabled = false;
  }
});
