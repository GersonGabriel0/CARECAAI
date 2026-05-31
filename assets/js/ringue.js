const themeBtn = document.querySelector('#theme-button');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isBaldMode = document.documentElement.classList.toggle('bald-mode');
    const icon = themeBtn.querySelector('.theme-icon');
    if (icon) {
      icon.src = isBaldMode ? 'assets/Cabeludo.svg' : 'assets/Careca.svg';
      icon.alt = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
    }
    themeBtn.title = isBaldMode ? 'Recuperar visao' : 'Ativar Bald Mode';
  });
}

const usuario  = sessionStorage.getItem('carecai_usuario');
const tipo     = sessionStorage.getItem('carecai_tipo');
let   fotoPath = sessionStorage.getItem('carecai_foto_path');
let   score    = parseInt(sessionStorage.getItem('carecai_score') || '0', 10);

if (!usuario || !tipo) window.location.href = 'login.html';

// ── Estado da batalha ──────────────────────────────────────────
let oponente        = null;
let ultimoResult    = null;
let opRevanche      = null;

// ── Historico de batalhas (banco de dados) ─────────────────────

// Promise compartilhada — uma unica requisicao mesmo se chamada duas vezes
let _batalhasPromise = null;
function getBatalhas() {
  if (!_batalhasPromise) {
    _batalhasPromise = fetch('api/batalhas.php')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return _batalhasPromise;
}

function invalidarCacheBatalhas() {
  _batalhasPromise = null;
}

async function salvarBatalha(result) {
  if (!oponente?.id) return;
  try {
    await fetch('api/batalhas.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oponente_id:    oponente.id,
        vit_desafiante: result.vitEu,
        vit_oponente:   result.vitOp,
        eu_venci:       result.vencedor === 'eu',
      }),
    });
  } catch { /* falha silenciosa — batalha continua */ }
}

async function renderCarrosel() {
  const wrap     = document.getElementById('historico-wrap');
  const carousel = document.getElementById('historico-carousel');

  try {
    const batalhas = await getBatalhas();

    if (!batalhas.length) { wrap.hidden = true; return; }

    wrap.hidden = false;
    carousel.innerHTML = batalhas.map((b) => {
      const euDes    = b.desafiante === usuario;
      const euVenceu = b.vencedor   === usuario;
      const data     = new Date(b.created_at).toLocaleDateString('pt-BR');
      const hora     = new Date(b.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const av1 = b.foto_desafiante
        ? `<img class="hc-avatar" src="${esc(b.foto_desafiante)}" alt="${esc(b.desafiante)}" onerror="this.style.display='none'">`
        : `<span class="hc-avatar-emoji">${b.tipo_desafiante === 'careca' ? '🏆' : '🌱'}</span>`;
      const av2 = b.foto_oponente
        ? `<img class="hc-avatar" src="${esc(b.foto_oponente)}" alt="${esc(b.oponente)}" onerror="this.style.display='none'">`
        : `<span class="hc-avatar-emoji">${b.tipo_oponente === 'careca' ? '🏆' : '🌱'}</span>`;

      const cor = !euDes && b.desafiante !== usuario && b.oponente !== usuario
        ? 'neutro'
        : euVenceu ? 'vitoria' : 'derrota';

      return `
        <div class="hc-card hc-card--${cor}">
          <span class="hc-resultado-badge">🏆 ${esc(b.vencedor)}</span>
          <div class="hc-fighters">
            <div class="hc-side${b.desafiante === b.vencedor ? ' hc-side--winner' : ''}">
              ${av1}
              <small>@${esc(b.desafiante)}</small>
            </div>
            <div class="hc-placar">
              <strong>${b.vit_desafiante}</strong>
              <span>×</span>
              <strong>${b.vit_oponente}</strong>
            </div>
            <div class="hc-side${b.oponente === b.vencedor ? ' hc-side--winner' : ''}">
              ${av2}
              <small>@${esc(b.oponente)}</small>
            </div>
          </div>
          <small class="hc-data">${data} ${hora}</small>
        </div>`;
    }).join('');
  } catch {
    wrap.hidden = true;
  }
}

// ── Categorias de batalha ──────────────────────────────────────
const CATEGORIAS = [
  'Brilho Craniano',
  'Aerodinamica',
  'Superficie Polida',
  'Resistencia ao Vento',
  'Nivel de Careca',
  'Intimidacao Capilar',
  'Potencial de Pista',
  'Economia em Shampoo',
  'Coeficiente de Calvice',
  'Pressao da Testa',
];

// ── Helpers ────────────────────────────────────────────────────
function esc(v) {
  const el = document.createElement('span');
  el.textContent = String(v ?? '');
  return el.innerHTML;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function gerarPonto(s) {
  // Valor base = score do usuario; variacao aleatoria de ±40
  const variacao = (Math.random() - 0.38) * 80;
  return Math.max(3, Math.min(100, Math.round(s + variacao)));
}

function mostrarView(id) {
  document.querySelectorAll('.ringue-view').forEach((v) => { v.hidden = true; });
  document.getElementById(id).hidden = false;
}

function tipoLabel(t) {
  return t === 'careca' ? '🏆 Careca Elite' : '🌱 Calvo em Evolucao';
}

function avatarHtml(foto, nome, tipoUser) {
  const fallback = tipoUser === 'careca' ? '🏆' : '🌱';
  if (foto) {
    return `<img class="ringue-avatar" src="${esc(foto)}" alt="${esc(nome)}"
              onerror="this.replaceWith(document.createTextNode('${fallback}'))">`;
  }
  return `<span class="ringue-avatar-emoji">${fallback}</span>`;
}

// ── Renderiza cartao do fighter ────────────────────────────────
function renderFighterCard(containerId, perfil) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="ringue-fighter-card">
      ${avatarHtml(perfil.foto, perfil.usuario, perfil.tipo)}
      <strong class="ringue-fighter-nome">@${esc(perfil.usuario)}</strong>
      <span class="ringue-fighter-tipo">${tipoLabel(perfil.tipo)}</span>
      <span class="ringue-fighter-score">${esc(perfil.score)} pts</span>
    </div>`;
}

// ── VIEW 1: meu perfil e oponentes ────────────────────────────
function renderMeuPerfil() {
  const card = document.getElementById('meu-perfil-card');
  card.innerHTML = `
    ${avatarHtml(fotoPath, usuario, tipo)}
    <strong class="ringue-fighter-nome">@${esc(usuario)}</strong>
    <span class="ringue-fighter-tipo">${tipoLabel(tipo)}</span>
    <span class="ringue-fighter-score">${score} pts</span>`;
}

async function carregarOponentes() {
  const grid  = document.getElementById('oponentes-grid');
  const label = document.querySelector('.ringue-lado--oponentes .ringue-lado-label');
  if (label) label.textContent = `Escolha seu oponente ${tipo === 'careca' ? '🏆' : '🌱'}`;

  try {
    const res = await fetch('api/ringue.php');
    let lista;
    try {
      lista = await res.json();
    } catch {
      throw new Error(`Resposta invalida do servidor (HTTP ${res.status})`);
    }
    if (!res.ok) throw new Error(lista.error || `HTTP ${res.status}`);

    if (!lista.length) {
      const tipoTexto = tipo === 'careca' ? 'carecas' : 'calvos';
      grid.innerHTML = `<p class="ringue-loading">Nenhum ${tipoTexto} disponivel para batalhar ainda.<br>Convide mais pessoas!</p>`;
      return;
    }

    const batalhas = await getBatalhas();
    // Batalhas em que EU participei — determina "Revanche" vs "Desafiar"
    const jaBatalhouSet = new Set(
      batalhas
        .filter((b) => b.desafiante === usuario || b.oponente === usuario)
        .map((b) => b.desafiante === usuario ? b.oponente : b.desafiante)
    );

    grid.innerHTML = '';
    lista.forEach((op) => {
      const jaLutou = jaBatalhouSet.has(op.usuario);
      const card = document.createElement('div');
      card.className = 'oponente-card';
      card.innerHTML = `
        ${avatarHtml(op.foto, op.usuario, op.tipo)}
        <div class="oponente-info">
          <strong>@${esc(op.usuario)}</strong>
          <small>${tipoLabel(op.tipo)}</small>
          <small>${esc(op.score)} pts</small>
        </div>
        ${jaLutou
          ? `<button class="primary-button oponente-btn-revanche">🔄 Revanche</button>`
          : `<button class="primary-button oponente-btn-desafiar">⚔️ Desafiar</button>`
        }`;
      if (jaLutou) {
        card.querySelector('.oponente-btn-revanche').addEventListener('click', () => abrirRevancheOponente(op));
      } else {
        card.querySelector('.oponente-btn-desafiar').addEventListener('click', () => desafiar(op));
      }
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="ringue-loading">Erro ao carregar oponentes:<br><small>${err.message}</small></p>`;
  }
}

// ── VIEW 2: arena de batalha ───────────────────────────────────
function desafiar(op) {
  oponente = op;
  renderFighterCard('fighter-eu',       { usuario, tipo, score, foto: fotoPath });
  renderFighterCard('fighter-oponente', oponente);
  mostrarView('view-batalha');
}

// ── Algoritmo da batalha ───────────────────────────────────────
function batalhar(scoreEu, scoreOp, numRodadas = 5) {
  const cats = shuffle(CATEGORIAS).slice(0, numRodadas);
  const rodadas = cats.map((cat) => {
    const pontoEu = gerarPonto(scoreEu);
    const pontoOp = gerarPonto(scoreOp);
    return { cat, pontoEu, pontoOp, vencedor: pontoEu >= pontoOp ? 'eu' : 'op' };
  });
  const vitEu = rodadas.filter((r) => r.vencedor === 'eu').length;
  const vencedor = vitEu > numRodadas / 2 ? 'eu' : 'op';
  return { rodadas, vencedor, vitEu, vitOp: numRodadas - vitEu };
}

// ── VIEW 3: resultados ─────────────────────────────────────────
function renderResultados(result, anterior = null) {
  ultimoResult = result;
  salvarBatalha(result).then(() => {
    invalidarCacheBatalhas();  // força nova requisicao para dados frescos
    renderCarrosel();
  });
  const { rodadas, vencedor, vitEu, vitOp } = result;
  const euVenceu = vencedor === 'eu';

  // Comparacao com resultado anterior (revanche)
  let comparacaoHtml = '';
  if (anterior) {
    const antVenceu   = anterior.vencedor === 'eu';
    const virou       = euVenceu !== antVenceu;
    const placarAntes = `${anterior.vitEu}×${anterior.vitOp}`;
    const msg         = virou
      ? (euVenceu ? '🔄 Virou o jogo! Antes: perdeu por ' : '🔄 Mesa virou! Antes: venceu por ')
      : (euVenceu ? '🔁 Manteve a vitoria! Antes: ' : '🔁 Ainda perdendo... Antes: ');
    comparacaoHtml = `<p class="resultado-comparacao">${msg}${placarAntes}</p>`;
  }

  // Banner do vencedor
  const banner = document.getElementById('resultado-banner');
  const nomeVenc = euVenceu ? `@${usuario}` : `@${oponente.usuario}`;
  banner.className = `resultado-banner resultado-banner--${euVenceu ? 'vitoria' : 'derrota'}`;
  banner.innerHTML = `
    <span class="resultado-coroa">${euVenceu ? '🏆' : '💀'}</span>
    <h2>${euVenceu ? 'VITORIA!' : 'DERROTA!'}</h2>
    <p><strong>${esc(nomeVenc)}</strong> e ${euVenceu ? 'o mais careca do ringue!' : 'mais careca desta vez.'}</p>
    <div class="resultado-placar">
      <span class="resultado-placar-num">${vitEu}</span>
      <span class="resultado-placar-sep">×</span>
      <span class="resultado-placar-num">${vitOp}</span>
    </div>
    ${comparacaoHtml}`;

  // Lados
  const ladoEu = document.getElementById('resultado-lado-eu');
  const ladoOp = document.getElementById('resultado-lado-op');

  ladoEu.innerHTML = `
    ${avatarHtml(fotoPath, usuario, tipo)}
    <strong>@${esc(usuario)}</strong>
    <span class="${euVenceu ? 'resultado-venceu' : 'resultado-perdeu'}">${euVenceu ? '🏆 Venceu' : '💀 Perdeu'}</span>`;

  ladoOp.innerHTML = `
    ${avatarHtml(oponente.foto, oponente.usuario, oponente.tipo)}
    <strong>@${esc(oponente.usuario)}</strong>
    <span class="${!euVenceu ? 'resultado-venceu' : 'resultado-perdeu'}">${!euVenceu ? '🏆 Venceu' : '💀 Perdeu'}</span>`;

  // Rounds
  const roundsEl = document.getElementById('resultado-rounds');
  roundsEl.innerHTML = rodadas.map((r) => `
    <div class="round-row">
      <span class="round-ponto round-ponto--${r.vencedor === 'eu' ? 'win' : 'lose'}">${r.pontoEu}</span>
      <div class="round-info">
        <span class="round-cat">${esc(r.cat)}</span>
        <div class="round-bars">
          <div class="round-bar round-bar--eu"  style="width:${r.pontoEu}%"></div>
          <div class="round-bar round-bar--op"  style="width:${r.pontoOp}%"></div>
        </div>
      </div>
      <span class="round-ponto round-ponto--${r.vencedor === 'op' ? 'win' : 'lose'}">${r.pontoOp}</span>
    </div>`).join('');

  // Botao revanche so aparece se eu perdi
  const btnRevanche = document.getElementById('btn-revanche');
  btnRevanche.hidden = euVenceu;

  mostrarView('view-resultado');
}

// ── Animação de batalha ────────────────────────────────────────
async function iniciarBatalha() {
  const btn = document.getElementById('btn-lutar');
  btn.disabled = true;
  btn.textContent = '⚡ Calculando...';

  await new Promise((r) => setTimeout(r, 1800));

  const result = batalhar(score, parseInt(oponente.score, 10));
  renderResultados(result);
  btn.disabled = false;
  btn.textContent = '🥊 Iniciar Batalha!';
}

// ── Revanche com nova foto ─────────────────────────────────────
function mostrarRevanche() {
  document.getElementById('revanche-zona').hidden = false;
  document.getElementById('btn-revanche').hidden = true;
}

async function processarRevanche() {
  const fotoInput = document.getElementById('revanche-foto');
  const msg       = document.getElementById('revanche-msg');
  const btnRe     = document.getElementById('btn-reanalisar');

  const file = fotoInput.files[0];
  if (!file) return;

  btnRe.disabled   = true;
  btnRe.textContent = '🔍 Analisando...';
  msg.textContent  = 'Enviando foto para analise...';

  const fd = new FormData();
  fd.append('usuario', usuario);
  fd.append('photo', file, file.name);

  try {
    const res  = await fetch('api/analisar.php', { method: 'POST', body: fd });
    let data = {};
    try { data = await res.json(); } catch { /* resposta nao era JSON */ }

    if (!res.ok || data.error) {
      msg.textContent   = `Erro: ${data.error || `HTTP ${res.status}`}`;
      btnRe.disabled    = false;
      btnRe.textContent = '🔍 Reanalisar e Revanche';
      return;
    }

    const resultadoAnterior = ultimoResult;   // guarda antes de sobrescrever

    score = data.score ?? score;
    sessionStorage.setItem('carecai_score', String(score));
    if (data.foto_path) {
      fotoPath = data.foto_path;              // atualiza variavel local
      sessionStorage.setItem('carecai_foto_path', data.foto_path);
    }

    msg.textContent = `Nova analise: ${score} pts. Iniciando revanche...`;
    await new Promise((r) => setTimeout(r, 900));

    document.getElementById('revanche-zona').hidden = true;
    msg.textContent = '';

    renderMeuPerfil();                        // atualiza foto no perfil

    const result = batalhar(score, parseInt(oponente.score, 10));
    renderResultados(result, resultadoAnterior);
  } catch (err) {
    msg.textContent   = `Erro: ${err.message || 'Verifique o servidor PHP.'}`;
    btnRe.disabled    = false;
    btnRe.textContent = '🔍 Reanalisar e Revanche';
  }
}

// ── Revanche na listagem de oponentes ─────────────────────────
function abrirRevancheOponente(op) {
  opRevanche = op;
  document.getElementById('rev-op-nome').textContent  = op.usuario;
  document.getElementById('rev-op-foto').value         = '';
  document.getElementById('rev-op-upload-txt').textContent = 'Enviar nova foto';
  document.getElementById('rev-op-msg').textContent    = '';
  document.getElementById('btn-rev-op-confirmar').disabled = true;
  document.getElementById('revanche-op-modal').hidden  = false;
}

function fecharRevancheOponente() {
  document.getElementById('revanche-op-modal').hidden = true;
  opRevanche = null;
}

async function processarRevancheOponente() {
  const fotoInput = document.getElementById('rev-op-foto');
  const msg       = document.getElementById('rev-op-msg');
  const btn       = document.getElementById('btn-rev-op-confirmar');
  const file      = fotoInput.files[0];
  if (!file || !opRevanche) return;

  btn.disabled    = true;
  btn.textContent = '🔍 Analisando...';
  msg.textContent = 'Enviando foto para analise...';

  const fd = new FormData();
  fd.append('usuario', usuario);
  fd.append('photo', file, file.name);

  try {
    const res  = await fetch('api/analisar.php', { method: 'POST', body: fd });
    let data = {};
    try { data = await res.json(); } catch { /* resposta nao era JSON */ }

    if (!res.ok || data.error) {
      msg.textContent = `Erro: ${data.error || `HTTP ${res.status}`}`;
      btn.disabled    = false;
      btn.textContent = '🔍 Analisar e Batalhar';
      return;
    }

    const opAlvo = opRevanche;          // salva antes de fechar (fechar zera opRevanche)

    score = data.score ?? score;
    sessionStorage.setItem('carecai_score', String(score));
    if (data.foto_path) {
      fotoPath = data.foto_path;        // atualiza variavel local
      sessionStorage.setItem('carecai_foto_path', data.foto_path);
    }

    fecharRevancheOponente();
    renderMeuPerfil();
    desafiar(opAlvo);
  } catch (err) {
    msg.textContent = `Erro: ${err.message || 'Verifique o servidor PHP.'}`;
    btn.disabled    = false;
    btn.textContent = '🔍 Analisar e Batalhar';
  }
}

// ── Event listeners ────────────────────────────────────────────
document.getElementById('btn-lutar').addEventListener('click', iniciarBatalha);

document.getElementById('btn-cancelar').addEventListener('click', () => {
  mostrarView('view-selecao');
});

document.getElementById('btn-revanche').addEventListener('click', mostrarRevanche);

document.getElementById('btn-novo-desafio').addEventListener('click', () => {
  document.getElementById('revanche-zona').hidden = true;
  document.getElementById('btn-revanche').hidden  = true;
  mostrarView('view-selecao');
  invalidarCacheBatalhas();   // garante dados frescos
  carregarOponentes();        // recarrega lista com botoes corretos
});

document.getElementById('revanche-foto').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const btn  = document.getElementById('btn-reanalisar');
  const txt  = document.getElementById('revanche-upload-texto');
  btn.disabled = !file;
  if (file) txt.textContent = file.name;
});

document.getElementById('btn-reanalisar').addEventListener('click', processarRevanche);

document.getElementById('btn-rev-op-cancelar').addEventListener('click', fecharRevancheOponente);
document.getElementById('btn-rev-op-confirmar').addEventListener('click', processarRevancheOponente);
document.getElementById('rev-op-foto').addEventListener('change', (e) => {
  const file = e.target.files[0];
  document.getElementById('btn-rev-op-confirmar').disabled = !file;
  if (file) document.getElementById('rev-op-upload-txt').textContent = file.name;
});
document.getElementById('revanche-op-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('revanche-op-modal')) fecharRevancheOponente();
});

// ── Init ───────────────────────────────────────────────────────
renderMeuPerfil();
renderCarrosel();   // async — atualiza o carrosel quando a API responder
carregarOponentes();

// Atualiza subtitulo com o tipo do usuario
const tipoTexto = tipo === 'careca' ? 'carecas' : 'calvos';
const subtitulo  = document.querySelector('.ringue-titulo p');
if (subtitulo) subtitulo.textContent = `Somente ${tipoTexto} vs ${tipoTexto}. Descubra quem brilha mais.`;
