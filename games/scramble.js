// ══════════════════════════════════════════
//  WORD SCRAMBLE  (games/scramble.js)
//  Self-contained game module.
//  Registers itself into GAME_REGISTRY.
// ══════════════════════════════════════════

(function () {

  // ── Dictionary ──────────────────────────
  const DICTIONARY = {
    easy: [
      { word: 'CAT',    hint: '🐱 Pet animal',           category: 'Animals' },
      { word: 'DOG',    hint: '🐶 Pet animal',           category: 'Animals' },
      { word: 'CAR',    hint: '🚗 Vehicle',              category: 'Objects' },
      { word: 'BOOK',   hint: '📚 For reading',          category: 'Objects' },
      { word: 'APPLE',  hint: '🍎 Red fruit',            category: 'Food' },
      { word: 'SUN',    hint: '☀️ In the sky',           category: 'Nature' },
      { word: 'TREE',   hint: '🌳 Large plant',          category: 'Nature' },
      { word: 'FISH',   hint: '🐟 Aquatic animal',       category: 'Animals' },
      { word: 'BIRD',   hint: '🐦 It flies',             category: 'Animals' },
      { word: 'MOON',   hint: '🌙 At night',             category: 'Nature' },
      { word: 'STAR',   hint: '⭐ In the sky',           category: 'Nature' },
      { word: 'CAKE',   hint: '🎂 Sweet dessert',        category: 'Food' },
      { word: 'MILK',   hint: '🥛 White drink',          category: 'Food' },
      { word: 'FIRE',   hint: '🔥 Hot',                  category: 'Nature' },
      { word: 'RAIN',   hint: '🌧️ Falls from the sky',  category: 'Nature' },
      { word: 'BEAR',   hint: '🐻 Forest animal',        category: 'Animals' },
      { word: 'ROSE',   hint: '🌹 Flower',               category: 'Nature' },
      { word: 'BALL',   hint: '⚽ For playing',          category: 'Objects' },
      { word: 'DOOR',   hint: '🚪 Entrance',             category: 'Objects' },
      { word: 'FROG',   hint: '🐸 Jumps',                category: 'Animals' },
    ],
    medium: [
      { word: 'COMPUTER', hint: '💻 Technology',             category: 'Technology' },
      { word: 'ELEPHANT', hint: '🐘 Large animal',           category: 'Animals' },
      { word: 'AIRPORT',  hint: '✈️ For traveling',         category: 'Travel' },
      { word: 'KITCHEN',  hint: '🍳 Where cooking happens',  category: 'Home' },
      { word: 'DOCTOR',   hint: '👨‍⚕️ Health profession',    category: 'Professions' },
      { word: 'SCHOOL',   hint: '🏫 Place of study',         category: 'Places' },
      { word: 'GARDEN',   hint: '🌻 Outdoor space',          category: 'Home' },
      { word: 'SUMMER',   hint: '☀️ Hot season',            category: 'Nature' },
      { word: 'WINTER',   hint: '❄️ Cold season',           category: 'Nature' },
      { word: 'ORANGE',   hint: '🍊 Citrus fruit',           category: 'Food' },
      { word: 'PURPLE',   hint: '🟣 Color',                  category: 'Colors' },
      { word: 'YELLOW',   hint: '🟡 Bright color',           category: 'Colors' },
      { word: 'TRAVEL',   hint: '✈️ Go to another place',    category: 'Travel' },
      { word: 'MARKET',   hint: '🛒 Shopping place',         category: 'Places' },
      { word: 'BUTTER',   hint: '🧈 For bread',              category: 'Food' },
      { word: 'LAWYER',   hint: '⚖️ Legal profession',       category: 'Professions' },
      { word: 'ROCKET',   hint: '🚀 Goes to space',          category: 'Technology' },
      { word: 'BRIDGE',   hint: '🌉 Connects two sides',     category: 'Places' },
      { word: 'CHEESE',   hint: '🧀 Dairy product',          category: 'Food' },
      { word: 'DRAGON',   hint: '🐉 Mythical creature',      category: 'Animals' },
    ],
    hard: [
      { word: 'ENVIRONMENT',    hint: '🌍 Nature around us',          category: 'Science' },
      { word: 'KNOWLEDGE',      hint: '🧠 What you know',             category: 'Concepts' },
      { word: 'PROGRAMMING',    hint: '💻 Writing code',              category: 'Technology' },
      { word: 'INDEPENDENT',    hint: '🗽 Free, autonomous',          category: 'Concepts' },
      { word: 'UNIVERSITY',     hint: '🎓 Higher education',          category: 'Places' },
      { word: 'RESTAURANT',     hint: '🍽️ Place to eat out',         category: 'Places' },
      { word: 'MATHEMATICS',    hint: '📐 Science of numbers',        category: 'Science' },
      { word: 'ELECTRICITY',    hint: '⚡ Energy',                    category: 'Science' },
      { word: 'COMMUNICATION',  hint: '📡 Sending messages',          category: 'Concepts' },
      { word: 'TRANSPORTATION', hint: '🚌 Moving from place to place',category: 'Travel' },
      { word: 'PHOTOGRAPHY',    hint: '📷 Art of photos',             category: 'Art' },
      { word: 'ARCHITECTURE',   hint: '🏛️ Design of buildings',      category: 'Art' },
      { word: 'CELEBRATION',    hint: '🎉 Festivity',                 category: 'Concepts' },
      { word: 'TEMPERATURE',    hint: '🌡️ Measure of heat/cold',     category: 'Science' },
      { word: 'IMAGINATION',    hint: '✨ Creating in the mind',      category: 'Concepts' },
    ],
  };

  // ── Internal round state ─────────────────
  const round = {
    words:          [],
    wordIndex:      0,
    startTime:      null,
    timerInterval:  null,
    answer:         [],
    scrambled:      [],
    blocked:        false,
    _paused:        false,
    _onNextPlayer:  null,
    _onGameOver:    null,
    _appState:      null,
    _navFn:         null,
  };

  // ════════════════════════════════════════
  //  CONFIG PANEL — Custom word builder
  // ════════════════════════════════════════
  function renderConfigPanel(container, config) {
    // Only show the custom builder when Custom difficulty is selected
    if (config.difficulty !== 'custom') {
      container.innerHTML = '';
      return;
    }

    const appState = window.STATE;
    if (!Array.isArray(appState.customWords)) appState.customWords = [];

    container.innerHTML = `
      <div class="config-section" id="scrambleCustomPanel">
        <div class="config-label" style="margin-top:4px;">Custom Word List 📋</div>

        <div class="custom-add-row">
          <input id="cwWord" class="cw-input" type="text" maxlength="30"
            placeholder="Word (e.g. ELEPHANT)"
            oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">
          <input id="cwHint" class="cw-input cw-hint-input" type="text" maxlength="60"
            placeholder="Hint (e.g. 🐘 Large animal)">
          <button class="cw-add-btn" onclick="ScrambleGame._addCustomWord()">+ Add</button>
        </div>
        <div id="cwError" class="cw-error" style="display:none"></div>
        <div id="cwList"  class="cw-list"></div>
        <div id="cwCount" class="cw-count">0 words</div>
      </div>`;

    _renderCustomList();
    updateConfigBtn();
  }

  // ── Add a custom word ────────────────────
  // NOTE: exposed on window.ScrambleGame BEFORE registration so onclick="" works immediately
  function _addCustomWord() {
    const wordEl = document.getElementById('cwWord');
    const hintEl = document.getElementById('cwHint');
    const err    = document.getElementById('cwError');
    if (!wordEl || !hintEl || !err) return;

    const word = (wordEl.value || '').trim().toUpperCase();
    const hint = (hintEl.value || '').trim() || '📝 Custom word';

    err.style.display = 'none';

    if (word.length < 2) {
      err.textContent   = 'Word must be at least 2 letters.';
      err.style.display = 'block';
      return;
    }
    if (!/^[A-Z]+$/.test(word)) {
      err.textContent   = 'Only letters A-Z are allowed.';
      err.style.display = 'block';
      return;
    }

    const appState = window.STATE;
    if (!Array.isArray(appState.customWords)) appState.customWords = [];

    if (appState.customWords.find(w => w.word === word)) {
      err.textContent   = `"${word}" is already in the list.`;
      err.style.display = 'block';
      return;
    }

    appState.customWords.push({ word, hint, category: 'Custom' });
    wordEl.value = '';
    hintEl.value = '';
    wordEl.focus();
    _renderCustomList();
    updateConfigBtn();
  }

  // ── Remove a custom word ─────────────────
  function _removeCustomWord(index) {
    const appState = window.STATE;
    if (!Array.isArray(appState.customWords)) return;
    appState.customWords.splice(index, 1);
    _renderCustomList();
    updateConfigBtn();
  }

  // ── Re-render the custom word table ─────
  function _renderCustomList() {
    const list  = document.getElementById('cwList');
    const count = document.getElementById('cwCount');
    if (!list || !count) return;

    const words = window.STATE.customWords || [];
    count.textContent = `${words.length} word${words.length !== 1 ? 's' : ''}`;

    if (!words.length) {
      list.innerHTML = `<div class="cw-empty">No words yet — add at least 3 to play.</div>`;
      return;
    }

    list.innerHTML = `
      <div class="cw-table-head">
        <span>Word</span><span>Hint</span><span></span>
      </div>
      ${words.map((w, i) => `
        <div class="cw-row">
          <span class="cw-row-word">${w.word}</span>
          <span class="cw-row-hint">${w.hint}</span>
          <button class="cw-remove-btn"
            onclick="ScrambleGame._removeCustomWord(${i})" title="Remove">✕</button>
        </div>`).join('')}`;
  }

  // ── Validate before "Continue" ──────────
  function validateConfig(config, appState) {
    if (config.difficulty === 'custom') {
      const n = Array.isArray(appState.customWords) ? appState.customWords.length : 0;
      if (n < 3) return { ok: false, message: `Add at least 3 words (${n}/3)` };
    }
    return { ok: true };
  }

  // ════════════════════════════════════════
  //  GAMEPLAY
  // ════════════════════════════════════════
  function _buildWordPool(config, appState) {
    if (config.difficulty === 'custom') {
      return [...(appState.customWords || [])].sort(() => Math.random() - 0.5);
    }
    return [...DICTIONARY[config.difficulty]].sort(() => Math.random() - 0.5);
  }

  function startRound(appState, navFn, onNextPlayer, onGameOver) {
    const pool  = _buildWordPool(appState.config, appState);
    const count = Math.min(appState.config.wordCount, pool.length);

    round.words         = pool.slice(0, count);
    round.wordIndex     = 0;
    round.blocked       = false;
    round._paused       = false;
    round._appState     = appState;
    round._onNextPlayer = onNextPlayer;
    round._onGameOver   = onGameOver;
    round._navFn        = navFn;

    // Wire pause button to THIS game's pause logic
    window.pauseGame = _pauseGame;

    navFn('game');
    _renderWord();
  }

  // ── Render current word ──────────────────
  function _renderWord() {
    round.blocked = false;
    round._paused = false;

    const wordObj = round.words[round.wordIndex];
    const letters = wordObj.word.split('');
    round.answer    = Array(letters.length).fill(null);
    round.scrambled = _scramble([...letters]);

    const appState = round._appState;
    const name     = appState.players[appState.currentPlayerIndex];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    document.getElementById('gameAvatar').textContent     = initials;
    document.getElementById('gamePlayerName').textContent = name;
    document.getElementById('gameProgress').textContent   =
      `Word ${round.wordIndex + 1} of ${round.words.length}`;
    document.getElementById('progressBar').style.width    =
      (round.wordIndex / round.words.length * 100) + '%';
    document.getElementById('wordHint').innerHTML =
      `Hint: <strong>${wordObj.hint}</strong>&nbsp;·&nbsp;` +
      `Category: <strong>${wordObj.category}</strong>`;

    _renderTiles();
    _startTimer();
  }

  function _scramble(letters) {
    let arr = [...letters], tries = 0;
    do {
      arr = arr.sort(() => Math.random() - 0.5);
      tries++;
    } while (arr.join('') === letters.join('') && letters.length > 1 && tries < 30);
    return arr;
  }

  // ── Tiles ────────────────────────────────
  function _renderTiles() {
    const wordLen = round.words[round.wordIndex].word.length;

    document.getElementById('answerSlots').innerHTML = round.answer.map((ch, i) => {
      const filled = ch !== null;
      return `<div class="answer-slot ${filled ? 'filled' : ''}"
                   onclick="ScrambleGame._removeFromSlot(${i})">
                ${filled ? ch : ''}
              </div>`;
    }).join('');

    document.getElementById('scrambledTiles').innerHTML = round.scrambled.map((ch, i) =>
      `<div class="tile ${ch === null ? 'used' : ''}"
            onclick="ScrambleGame._placeLetter(${i})">
         ${ch !== null ? ch : ''}
       </div>`
    ).join('');

    const filled = round.answer.filter(c => c !== null).length;
    document.getElementById('checkBtn').disabled = (filled < wordLen);
  }

  function _placeLetter(tileIdx) {
    if (round.blocked || round._paused) return;
    if (round.scrambled[tileIdx] === null) return;
    const slot = round.answer.indexOf(null);
    if (slot === -1) return;
    round.answer[slot]       = round.scrambled[tileIdx];
    round.scrambled[tileIdx] = null;
    _renderTiles();
  }

  function _removeFromSlot(slotIdx) {
    if (round.blocked || round._paused) return;
    if (round.answer[slotIdx] === null) return;
    const ch  = round.answer[slotIdx];
    const idx = round.scrambled.indexOf(null);
    if (idx !== -1) round.scrambled[idx] = ch;
    else round.scrambled.push(ch);
    round.answer[slotIdx] = null;
    _renderTiles();
  }

  function _clearAnswer() {
    if (round.blocked || round._paused) return;
    const letters   = round.words[round.wordIndex].word.split('');
    round.answer    = Array(letters.length).fill(null);
    round.scrambled = _scramble([...letters]);
    _renderTiles();
  }

  // ── Check answer ─────────────────────────
  function _checkAnswer() {
    if (round.blocked || round._paused) return;
    round.blocked = true;

    const wordObj = round.words[round.wordIndex];
    const guess   = round.answer.join('');
    const correct = guess === wordObj.word;
    const elapsed = _stopTimer();

    document.querySelectorAll('.answer-slot').forEach(s => {
      s.classList.remove('correct', 'wrong');
      s.classList.add(correct ? 'correct' : 'wrong');
    });

    const entry = round._appState.scores[round._appState.currentPlayerIndex];
    if (correct) entry.correct++; else entry.wrong++;
    entry.totalTime += elapsed;
    entry.words.push({
      word:    wordObj.word,
      correct,
      time:    elapsed,
      guess:   correct ? null : guess,
    });

    setTimeout(() => {
      round.wordIndex++;
      if (round.wordIndex >= round.words.length) _endTurn();
      else _renderWord();
    }, correct ? 700 : 1100);
  }

  // ── Timer ────────────────────────────────
  function _startTimer() {
    const limit   = round._appState.config.timeLimit;
    const display = document.getElementById('timerDisplay');
    if (round.timerInterval) clearInterval(round.timerInterval);
    round.startTime = Date.now();
    display.classList.remove('warning');
    display.textContent = limit === 0 ? '0.0s' : limit + 's';

    round.timerInterval = setInterval(() => {
      if (round._paused) return;          // ← paused: freeze display, don't advance
      const el = (Date.now() - round.startTime) / 1000;
      if (limit === 0) {
        display.textContent = el.toFixed(1) + 's';
      } else {
        const rem = limit - el;
        if (rem <= 0) { _stopTimer(); _autoFail(); return; }
        display.textContent = rem.toFixed(1) + 's';
        display.classList.toggle('warning', rem <= 5);
      }
    }, 80);
  }

  function _stopTimer() {
    if (round.timerInterval) clearInterval(round.timerInterval);
    round.timerInterval = null;
    return (Date.now() - round.startTime) / 1000;
  }

  function _autoFail() {
    if (round.blocked) return;
    round.blocked = true;
    const wordObj = round.words[round.wordIndex];
    const elapsed = round._appState.config.timeLimit;
    const entry   = round._appState.scores[round._appState.currentPlayerIndex];
    entry.wrong++;
    entry.totalTime += elapsed;
    entry.words.push({ word: wordObj.word, correct: false, time: elapsed, guess: '(time up)' });
    document.querySelectorAll('.answer-slot').forEach(s => {
      s.classList.remove('correct');
      s.classList.add('wrong');
    });
    setTimeout(() => {
      round.wordIndex++;
      if (round.wordIndex >= round.words.length) _endTurn();
      else _renderWord();
    }, 950);
  }

  // ── Pause / Resume ───────────────────────
  function _pauseGame() {
    // Freeze elapsed time so it doesn't keep running while paused
    const elapsed = (Date.now() - round.startTime) / 1000;
    round._pausedElapsed = elapsed;
    round._paused = true;

    openPause(
      // onResume
      function () {
        // Recalculate startTime so the timer continues from where it left off
        const limit = round._appState.config.timeLimit;
        if (limit > 0) {
          round.startTime = Date.now() - (round._pausedElapsed * 1000);
        } else {
          round.startTime = Date.now() - (round._pausedElapsed * 1000);
        }
        round._paused = false;
      },
      // onQuit — handled by app.js quitGame(), nothing extra needed
      null
    );
  }

  // ── End player turn ──────────────────────
  function _endTurn() {
    _stopTimer();
    round._appState.currentPlayerIndex++;
    if (round._appState.currentPlayerIndex < round._appState.players.length) {
      round._onNextPlayer();
    } else {
      round._onGameOver();
    }
  }

  // ════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════
  const ScrambleGame = {
    id:          'scramble',
    name:        'Word Scramble',
    icon:        '🔤',
    description: 'Unscramble the letters to form the correct English word.',
    difficulty:  3,
    available:   true,
    renderConfigPanel,
    validateConfig,
    startRound,
    // tile interaction
    _placeLetter,
    _removeFromSlot,
    _clearAnswer,
    _checkAnswer,
    // custom words
    _addCustomWord,
    _removeCustomWord,
  };

  // Expose globally FIRST so onclick="" in the config panel can call it immediately
  window.ScrambleGame = ScrambleGame;

  // Wire the game-screen buttons (called from HTML)
  window.clearAnswer = () => ScrambleGame._clearAnswer();
  window.checkAnswer = () => ScrambleGame._checkAnswer();

  // Register with the app (must be after window.ScrambleGame is set)
  GAME_REGISTRY.register(ScrambleGame);

})();
