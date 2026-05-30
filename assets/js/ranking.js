const themeButton = document.querySelector('#theme-button');
themeButton.addEventListener('click', () => {
  const isBaldMode = document.documentElement.classList.toggle('bald-mode');
  themeButton.textContent = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
});

// TODO: substituir por fetch('api/ranking.php') quando o banco estiver configurado
const DADOS_RANKING = [
  { name: 'Gerson O Cara Brilhante',    usuario: 'gerson',        score: 97, tipo: 'careca' },
  { name: 'Gabriel Nunes Careca Total', usuario: 'gabriel_nunes', score: 95, tipo: 'careca' },
  { name: 'Giokozz Careca Ofuscante',   usuario: 'giokozz',       score: 88, tipo: 'careca' },
  { name: 'Gui Caveira de Luz',         usuario: 'gui',           score: 89, tipo: 'careca' },
  { name: 'Kety Reflexo Solar',         usuario: 'kety',          score: 72, tipo: 'calvo'  },
  { name: 'Lojhan Calvo Aspirante',     usuario: 'lojhan',        score: 61, tipo: 'calvo'  },
  { name: 'Thomaz Primeiro Fio Caindo', usuario: 'thomaz',        score: 34, tipo: 'calvo'  },
];

function renderLado(data, elementId) {
  const list = document.querySelector(`#${elementId}`);
  if (!data.length) {
    list.innerHTML = '<li class="ranking-item ranking-vazio">Nenhum resultado ainda.</li>';
    return;
  }
  list.innerHTML = data
    .map(
      (item, i) => `
        <li class="ranking-item">
          <span class="ranking-pos">${i + 1}</span>
          <span class="ranking-nome">
            ${item.name}
            <small>@${item.usuario}</small>
          </span>
          <span class="ranking-score">${item.score} pts</span>
        </li>`
    )
    .join('');
}

const carecas = DADOS_RANKING.filter((d) => d.tipo === 'careca').sort((a, b) => b.score - a.score);
const calvos  = DADOS_RANKING.filter((d) => d.tipo === 'calvo').sort((a, b) => b.score - a.score);

renderLado(carecas, 'ranking-carecas');
renderLado(calvos,  'ranking-calvos');
