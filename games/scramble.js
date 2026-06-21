
// ══════════════════════════════════════════
//  MISS ALE — CORE APP  v3.0  (app.js)
//  Navigation · State · Audio · Pause · Boot
// ══════════════════════════════════════════

// ── Global State ──────────────────────────
const STATE = {
  selectedGame:       null,
  config:             { difficulty: 'easy', wordCount: 10, timeLimit: 0 },
  players:            [''],
  customWords:        [],   // [{word, hint, category}]
  currentPlayerIndex: 0,
  scores:             [],
};

// ── Audio engine ──────────────────────────
const AUDIO = (() => {
  const menu = new Audio('mainmusic.mp3');
  const game = new Audio('gamemusic.mp3');
  menu.loop = game.loop = true;
  menu.volume = game.volume = 0.8;
  let current = null;
  let _vol = 0.8;

  function play(track) {
    if (current === track) return;
    if (current) { current.pause(); current.currentTime = 0; }
    track.volume = _vol;
    track.play().catch(() => {});
    current = track;
  }
  function setVolume(v) {
    _vol = Math.max(0, Math.min(1, v));
    if (current) current.volume = _vol;
  }
  function getVolume() { return _vol; }
  function pause()  { if (current) current.pause(); }
  function resume() { if (current) current.play().catch(() => {}); }

  return { menu: () => play(menu), game: () => play(game), setVolume, getVolume, pause, resume };
})();

// ── Navigation ────────────────────────────
const MENU_SCREENS = new Set(['home','game-select','config','players','results','about']);
const GAME_SCREENS = new Set(['handoff','countdown','game','reading-game']);

let currentScreen = 'home';

function nav(id) {
  const prev = document.getElementById(currentScreen);
  const next = document.getElementById(id);
  if (!next || id === currentScreen) return;

  const ORDER = [
    'home','game-select','config','players',
    'handoff','countdown','game','reading-game','results','about'
  ];
  const forward = ORDER.indexOf(id) >= ORDER.indexOf(currentScreen);

  prev.classList.remove('visible');
  prev.classList.add(forward ? 'slide-left' : 'slide-right');

  next.classList.add('active');
  next.classList.add(forward ? 'slide-right' : 'slide-left');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    next.classList.add('visible');
    next.classList.remove('slide-left','slide-right');
  }));

  setTimeout(() => {
    prev.classList.remove('active','slide-left','slide-right');
    currentScreen = id;
  }, 300);

  if (MENU_SCREENS.has(id)) AUDIO.menu();
  if (GAME_SCREENS.has(id)) AUDIO.game();

  const hooks = {
    'game-select': renderGameSelect,
    'config':      renderConfig,
    'players':     renderPlayers,
  };
  if (hooks[id]) hooks[id]();
}

// ── Game Registry ─────────────────────────
const GAME_REGISTRY = (() => {
  const _games = [];
  return {
    register(g) { _games.push(g); },
    all()        { return _games; },
    find(id)     { return _games.find(g => g.id === id); },
  };
})();

// ── Game Select ───────────────────────────
function renderGameSelect() {
  document.getElementById('gameGrid').innerHTML = GAME_REGISTRY.all().map(g => `
    <div class="game-card ${g.available ? '' : 'locked'}"
         ${g.available ? `onclick="selectGame('${g.id}')"` : ''}>
      <span class="game-badge ${g.available ? 'badge-available' : 'badge-soon'}">
        ${g.available ? 'Available' : 'Coming Soon'}
      </span>
      <div class="game-icon">${g.icon}</div>
      <div class="game-name">${g.name}</div>
      <div class="game-desc">${g.description}</div>
      <div class="diff-row">
        ${[1,2,3,4,5].map(i => `<div class="diff-dot ${i<=g.difficulty?'on':''}"></div>`).join('')}
        <span style="font-size:11px;color:var(--muted);margin-left:4px;">Difficulty</span>
      </div>
    </div>`).join('');
}

function selectGame(id) {
  STATE.selectedGame = GAME_REGISTRY.find(id);
  nav('config');
}

// ── Config Screen ─────────────────────────
function renderConfig() {
  const game = STATE.selectedGame;

  const diffs = (game && game.getDifficultyOptions)
    ? game.getDifficultyOptions()
    : [
        {v:'easy',   l:'Easy 🟢'},
        {v:'medium', l:'Medium 🟡'},
        {v:'hard',   l:'Hard 🔴'},
        {v:'custom', l:'Custom 📋'},
      ];

  document.getElementById('diffOpts').innerHTML = diffs.map(d =>
    `<button class="opt-btn ${STATE.config.difficulty===d.v?'selected':''}"
       onclick="setConfig('difficulty','${d.v}')">${d.l}</button>`
  ).join('');

  const customPanel = document.getElementById('gameCustomPanel');
  if (game && game.renderConfigPanel) {
    customPanel.innerHTML = '';
    game.renderConfigPanel(customPanel, STATE.config);
  } else {
    customPanel.innerHTML = '';
  }

  // Word count + time — hidden for games that opt out
  const showWordCount = !(game && game.hideWordCount);
  const showTime      = !(game && game.hideTimeLimit);

  document.getElementById('wordCountSection').style.display = showWordCount ? '' : 'none';
  document.getElementById('timeSection').style.display      = showTime      ? '' : 'none';

  if (showWordCount) {
    const counts = [5,10,20,50];
    document.getElementById('wordCountOpts').innerHTML = counts.map(c =>
      `<button class="opt-btn ${STATE.config.wordCount===c?'selected':''}"
         onclick="setConfig('wordCount',${c})">${c} words</button>`
    ).join('');
  }

  if (showTime) {
    const times = [{v:0,l:'No limit'},{v:10,l:'10 sec'},{v:20,l:'20 sec'},{v:30,l:'30 sec'}];
    document.getElementById('timeOpts').innerHTML = times.map(t =>
      `<button class="opt-btn ${STATE.config.timeLimit===t.v?'selected':''}"
         onclick="setConfig('timeLimit',${t.v})">${t.l}</button>`
    ).join('');
  }

  updateConfigBtn();
}

function setConfig(key, val) {
  STATE.config[key] = val;
  renderConfig();
}

function updateConfigBtn() {
  const btn  = document.getElementById('configNextBtn');
  if (!btn) return;
  const game  = STATE.selectedGame;
  const valid = (!game || !game.validateConfig)
    ? {ok:true}
    : game.validateConfig(STATE.config, STATE);
  btn.disabled    = !valid.ok;
  btn.textContent = valid.ok ? 'Continue →' : (valid.message || 'Complete setup first');
}

// ── Players Screen ────────────────────────
function renderPlayers() {
  if (!STATE.players.length) STATE.players = [''];
  document.getElementById('playerList').innerHTML = STATE.players.map((p,i) => `
    <div class="player-row">
      <div class="player-num">${i+1}</div>
      <input class="player-input" type="text" placeholder="Player ${i+1}" value="${p}"
        oninput="STATE.players[${i}]=this.value" maxlength="20">
      ${STATE.players.length > 1
        ? `<button class="remove-player-btn" onclick="removePlayer(${i})">✕</button>`
        : ''}
    </div>`).join('');
  document.getElementById('addPlayerBtn').style.display =
    STATE.players.length >= 10 ? 'none' : '';
}

function addPlayer()     { if (STATE.players.length<10){STATE.players.push('');renderPlayers();} }
function removePlayer(i) { STATE.players.splice(i,1); renderPlayers(); }

// ── Game Flow ─────────────────────────────
function beginGame() {
  STATE.players = STATE.players.map((p,i) => p.trim() || `Player ${i+1}`);
  STATE.currentPlayerIndex = 0;
  STATE.scores = STATE.players.map(n =>
    ({name:n, correct:0, wrong:0, totalTime:0, words:[]})
  );
  showHandoff();
}

function showHandoff() {
  const name     = STATE.players[STATE.currentPlayerIndex];
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('handoffAvatar').textContent = initials;
  document.getElementById('handoffName').textContent   = name;
  nav('handoff');
}

function startCountdown() {
  nav('countdown');
  const display = document.getElementById('countdownDisplay');
  let n = 3;
  (function tick() {
    if (n > 0) {
      display.innerHTML = `<div class="countdown-num">${n}</div>`;
      n--;
      setTimeout(tick, 800);
    } else {
      display.innerHTML = `<div class="countdown-go">GO! 🚀</div>`;
      setTimeout(() => {
        const game = STATE.selectedGame;
        if (game && game.startRound) game.startRound(STATE, nav, showHandoff, showResults);
        else console.warn('No startRound() for', game);
      }, 620);
    }
  })();
}

// ══════════════════════════════════════════
//  PAUSE MENU
// ══════════════════════════════════════════
let _pauseCallback = null;   // game module sets this to its own pause/resume logic

function openPause(onResume, onQuit) {
  _pauseCallback = { onResume, onQuit };
  AUDIO.pause();

  const vol = Math.round(AUDIO.getVolume() * 100);
  document.getElementById('pauseVolumeSlider').value = vol;
  document.getElementById('pauseVolumeLabel').textContent = vol + '%';

  document.getElementById('pauseOverlay').classList.add('open');
}

function closePause() {
  document.getElementById('pauseOverlay').classList.remove('open');
  AUDIO.resume();
  if (_pauseCallback && _pauseCallback.onResume) _pauseCallback.onResume();
  _pauseCallback = null;
}

function quitGame() {
  document.getElementById('pauseOverlay').classList.remove('open');
  if (_pauseCallback && _pauseCallback.onQuit) _pauseCallback.onQuit();
  _pauseCallback = null;
  AUDIO.menu();
  nav('home');
}

function updateVolume(val) {
  AUDIO.setVolume(val / 100);
  document.getElementById('pauseVolumeLabel').textContent = val + '%';
}

// ── Results Screen ─────────────────────────
function showResults() {
  const sorted = [...STATE.scores].sort((a,b) =>
    b.correct !== a.correct ? b.correct - a.correct : a.totalTime - b.totalTime
  );

  const winner = sorted[0];
  document.getElementById('winnerBanner').innerHTML = `
    <div class="winner-frog">🐸</div>
    <div class="winner-label">Winner!</div>
    <div class="winner-name">🏆 ${winner.name}</div>
    <div style="font-size:13px;color:var(--muted);margin-top:4px;">
      ${winner.correct} correct · ${winner.totalTime.toFixed(1)}s total
    </div>`;

  const rankCls = ['rank-1','rank-2','rank-3'];
  document.getElementById('resultsGrid').innerHTML = sorted.map((s,i) => `
    <div class="result-row">
      <div class="rank-badge ${rankCls[i]||'rank-other'}">${i===0?'🏆':i+1}</div>
      <div class="result-name">${s.name}</div>
      <div class="result-stats">
        <div class="result-score">${s.correct}/${s.correct+s.wrong}</div>
        <div class="result-time">${s.totalTime.toFixed(1)}s</div>
      </div>
    </div>`).join('');

  const wh     = document.getElementById('wordHistorySection');
  const active = STATE.scores.filter(s => s.words.length > 0);
  wh.innerHTML = active.length ? active.map(s => `
    <div class="word-history">
      <div class="wh-title">History — ${s.name}</div>
      <div class="wh-list">
        ${s.words.map(w => `
          <div class="wh-row">
            <span class="wh-word">${w.word}</span>
            ${!w.correct && w.guess ? `<span class="wh-correct-word">→ ${w.guess}</span>` : ''}
            <span class="${w.correct?'wh-ok':'wh-fail'}">${w.correct?'✓':'✗'}</span>
            <span class="wh-time">${w.time.toFixed(1)}s</span>
          </div>`).join('')}
      </div>
    </div>`).join('') : '';

  nav('results');
}

// ── Boot ──────────────────────────────────
(function boot() {
  const s = document.getElementById('home');
  s.classList.add('active');
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('visible')));
  currentScreen = 'home';
})();
