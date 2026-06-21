
// ══════════════════════════════════════════
//  READING COMPREHENSION  v1.0  (games/reading.js)
//  Teacher sets a text + image + 5 questions.
//  Students read → answer → see score.
//  No back-navigation during quiz.
// ══════════════════════════════════════════

(function () {

  // ── Internal state ───────────────────────
  const rState = {
    lesson:   null,    // the configured lesson object
    answers:  [],      // player's selected option per question (null = unanswered)
    qIndex:   0,       // current question
    _appState:null,
    _navFn:   null,
    _onGameOver: null,
  };

  // ── Config panel ─────────────────────────
  function renderConfigPanel(container) {
    // We store the lesson in STATE.readingLesson
    const appState = window.STATE;
    if (!appState.readingLesson) {
      appState.readingLesson = {
        title:    'Rabbit',
        text:     "Once upon a time, in a golden grassy savanna, lived a playful little lion named Leo. Leo had a fluffy mane and a very big dream: he wanted to touch the stars. Every night, he would climb to the top of Pride Rock and try to paw at the twinkling lights in the sky. One night, a friendly shooting star zoomed down and landed right at his paws. It was a tiny, glowing star named Spark. Spark told Leo that the sky was far too big, but they could play hide-and-seek together in the tall grass instead. Leo and Spark played all night long, and Leo learned that you don't need to reach the sky to have a magical adventure.",
        imageUrl: 'https://drive.google.com/file/d/1ovRDsmVA7jppfljQP1THIirhKel7PeTm/view?usp=sharing',
        questions: [
          {q:'Q1', options:['A','B','C','D'], correct:0},
          {q:'Q2', options:['A','B','C','D'], correct:0},
          {q:'Q3', options:['A','B','C','D'], correct:0},
          {q:'Q4', options:['A','B','C','D'], correct:0},
          {q:'Q5', options:['A','B','C','D'], correct:0},
        ]
      };
    }

    container.innerHTML = `
      <div class="config-section" id="readingConfigPanel">

        <div class="config-label">Reading Passage</div>

        <div class="rl-field">
          <label class="rl-label">Title</label>
          <input class="rl-input" id="rlTitle" type="text" maxlength="100"
            placeholder="e.g. The Water Cycle"
            value="${_esc(appState.readingLesson.title)}"
            oninput="ReadingGame._updateLesson('title',this.value)">
        </div>

        <div class="rl-field">
          <label class="rl-label">Text (reading passage)</label>
          <textarea class="rl-textarea" id="rlText" rows="6"
            placeholder="Paste or type the reading passage here..."
            oninput="ReadingGame._updateLesson('text',this.value)">${_esc(appState.readingLesson.text)}</textarea>
        </div>

        <div class="rl-field">
          <label class="rl-label">Image URL <span class="rl-hint-tag">optional · Google Drive / direct link</span></label>
          <input class="rl-input" id="rlImage" type="url"
            placeholder="https://drive.google.com/uc?id=FILE_ID  or any direct image URL"
            value="${_esc(appState.readingLesson.imageUrl)}"
            oninput="ReadingGame._updateLesson('imageUrl',this.value)">
          <div class="rl-img-preview-wrap" id="rlImgPreview"></div>
          <div class="rl-img-tip">
            💡 For Google Drive: share the file → copy link → change <code>/file/d/ID/view</code> to <code>/uc?id=ID</code>
          </div>
        </div>

        <div class="config-label" style="margin-top:20px;">5 Questions (multiple choice)</div>
        <div id="rlQuestions">
          ${appState.readingLesson.questions.map((q,qi) => _questionHTML(q,qi)).join('')}
        </div>

      </div>`;

    _refreshImagePreview();
    updateConfigBtn();
  }

  function _questionHTML(q, qi) {
    return `
      <div class="rl-question-block">
        <div class="rl-q-header">Question ${qi+1}</div>
        <input class="rl-input" type="text" maxlength="200"
          placeholder="Type the question here..."
          value="${_esc(q.q)}"
          oninput="ReadingGame._updateQuestion(${qi},'q',this.value)">
        <div class="rl-options">
          ${q.options.map((opt,oi) => `
            <div class="rl-option-row">
              <button class="rl-correct-btn ${q.correct===oi?'is-correct':''}"
                onclick="ReadingGame._setCorrect(${qi},${oi})" title="Mark as correct answer">
                ${q.correct===oi?'✓':'○'}
              </button>
              <input class="rl-input rl-opt-input" type="text" maxlength="120"
                placeholder="Option ${String.fromCharCode(65+oi)}"
                value="${_esc(opt)}"
                oninput="ReadingGame._updateOption(${qi},${oi},this.value)">
            </div>`).join('')}
        </div>
      </div>`;
  }

  function _esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function _updateLesson(key, val) {
    window.STATE.readingLesson[key] = val;
    if (key==='imageUrl') _refreshImagePreview();
    updateConfigBtn();
  }

  function _refreshImagePreview() {
    const wrap = document.getElementById('rlImgPreview');
    if (!wrap) return;
    const url = (window.STATE.readingLesson||{}).imageUrl || '';
    wrap.innerHTML = url
      ? `<img src="${_esc(url)}" alt="Preview" class="rl-img-preview"
             onerror="this.style.display='none';document.getElementById('rlImgErr').style.display='block'"
             onload="this.style.display='block';document.getElementById('rlImgErr').style.display='none'">
         <div id="rlImgErr" class="rl-img-err" style="display:none">⚠️ Could not load image — check the URL</div>`
      : '';
  }

  function _updateQuestion(qi, field, val) {
    window.STATE.readingLesson.questions[qi][field] = val;
    updateConfigBtn();
  }

  function _updateOption(qi, oi, val) {
    window.STATE.readingLesson.questions[qi].options[oi] = val;
    updateConfigBtn();
  }

  function _setCorrect(qi, oi) {
    window.STATE.readingLesson.questions[qi].correct = oi;
    // re-render only the questions section
    const qDiv = document.getElementById('rlQuestions');
    if (qDiv) {
      qDiv.innerHTML = window.STATE.readingLesson.questions
        .map((q,i) => _questionHTML(q,i)).join('');
    }
    updateConfigBtn();
  }

  // ── Validate ──
  function validateConfig(config, appState) {
    const l = appState.readingLesson;
    if (!l) return {ok:false, message:'Set up the reading lesson'};
    if (!l.title.trim()) return {ok:false, message:'Add a lesson title'};
    if (l.text.trim().length < 20) return {ok:false, message:'Add a reading passage (min 20 chars)'};
    for (let i=0; i<5; i++) {
      const q = l.questions[i];
      if (!q.q.trim()) return {ok:false, message:`Write question ${i+1}`};
      const filled = q.options.filter(o=>o.trim().length>0).length;
      if (filled < 2) return {ok:false, message:`Question ${i+1} needs at least 2 options`};
    }
    return {ok:true};
  }

  // ════════════════════════════════════════
  //  GAMEPLAY — Reading screen then Quiz
  // ════════════════════════════════════════
  function startRound(appState, navFn, onNextPlayer, onGameOver) {
    rState.lesson      = appState.readingLesson;
    rState.answers     = Array(5).fill(null);
    rState.qIndex      = 0;
    rState._appState   = appState;
    rState._navFn      = navFn;
    rState._onGameOver = onGameOver;

    _showReadingScreen();
    navFn('reading-game');
  }

  function _showReadingScreen() {
    const l = rState.lesson;
    document.getElementById('rg-title').textContent   = l.title;
    document.getElementById('rg-text').textContent    = l.text;

    const imgWrap = document.getElementById('rg-image-wrap');
    if (l.imageUrl && l.imageUrl.trim()) {
      imgWrap.innerHTML = `<img src="${_esc(l.imageUrl)}" alt="${_esc(l.title)}" class="rg-image"
        onerror="this.parentElement.style.display='none'">`;
      imgWrap.style.display = '';
    } else {
      imgWrap.style.display = 'none';
    }

    document.getElementById('rg-reading-view').style.display = '';
    document.getElementById('rg-quiz-view').style.display    = 'none';

    // Show pause button, hide back btn
    document.getElementById('rg-pause-btn').style.display = '';
    document.getElementById('rg-back-note').style.display  = 'none';
  }

  function _startQuiz() {
    document.getElementById('rg-reading-view').style.display = 'none';
    document.getElementById('rg-quiz-view').style.display    = '';
    rState.qIndex = 0;
    _renderQuestion();
  }

  function _renderQuestion() {
    const qi  = rState.qIndex;
    const q   = rState.lesson.questions[qi];
    const total = rState.lesson.questions.length;

    document.getElementById('rg-q-num').textContent   = `Question ${qi+1} of ${total}`;
    document.getElementById('rg-q-text').textContent  = q.q;
    document.getElementById('rg-q-progress').style.width = ((qi/total)*100)+'%';

    const opts = document.getElementById('rg-options');
    opts.innerHTML = q.options.map((opt, oi) => {
      if (!opt.trim()) return '';
      const chosen = rState.answers[qi] === oi;
      return `
        <button class="rg-option-btn ${chosen?'chosen':''}"
          onclick="ReadingGame._selectOption(${oi})">
          <span class="rg-opt-letter">${String.fromCharCode(65+oi)}</span>
          <span class="rg-opt-text">${_esc(opt)}</span>
        </button>`;
    }).join('');

    // Next / Finish button
    const nextBtn = document.getElementById('rg-next-btn');
    nextBtn.textContent  = qi===total-1 ? 'Finish ✓' : 'Next →';
    nextBtn.disabled     = rState.answers[qi] === null;

    // No-back note
    document.getElementById('rg-back-note').style.display = '';
    document.getElementById('rg-pause-btn').style.display = 'none';
  }

  function _selectOption(oi) {
    rState.answers[rState.qIndex] = oi;
    _renderQuestion();
  }

  function _nextQuestion() {
    const qi    = rState.qIndex;
    const total = rState.lesson.questions.length;
    if (qi < total-1) {
      rState.qIndex++;
      _renderQuestion();
    } else {
      _finishQuiz();
    }
  }

  function _finishQuiz() {
    const l      = rState.lesson;
    let correct  = 0;
    let totalTime= 0; // reading game has no per-word timer — we just count correct
    const words  = [];
    l.questions.forEach((q,i) => {
      const chosen  = rState.answers[i];
      const ok      = chosen === q.correct;
      if (ok) correct++;
      words.push({
        word:   q.q.slice(0,30)+(q.q.length>30?'…':''),
        correct: ok,
        time:    0,
        guess:   ok ? null : (q.options[chosen]||'(no answer)'),
      });
    });

    // Write to scores
    const appState = rState._appState;
    const entry    = appState.scores[appState.currentPlayerIndex];
    entry.correct  += correct;
    entry.wrong    += (5-correct);
    entry.totalTime+= 0;
    entry.words     = entry.words.concat(words);

    // Advance player or end
    appState.currentPlayerIndex++;
    if (appState.currentPlayerIndex < appState.players.length) {
      // next player reads too — go back to handoff
      window.showHandoff();
    } else {
      rState._onGameOver();
    }
  }

  // ── Pause (reading screen only) ──
  function _pauseReading() {
    openPause(() => {}, () => { nav('home'); });
  }

  // ════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════
  const ReadingGame = {
    id:'reading', name:'Reading Quest', icon:'📖',
    description:'Read a passage and answer 5 comprehension questions. No going back!',
    difficulty:2, available:true,
    hideWordCount: true,
    hideTimeLimit: true,
    getDifficultyOptions: () => [{v:'custom', l:'Teacher Setup 📋'}],
    renderConfigPanel, validateConfig, startRound,
    // called from HTML
    _updateLesson, _updateQuestion, _updateOption, _setCorrect,
    _startQuiz, _selectOption, _nextQuestion,
    _pauseReading,
  };

  // Force difficulty to 'custom' always for reading game
  const _origSelect = window.selectGame;
  // We hook config init so difficulty is always 'custom' for reading
  GAME_REGISTRY.register(ReadingGame);
  window.ReadingGame = ReadingGame;

  // Override pauseGame for reading screen
  const _origPause = window.pauseGame;
  // pauseGame is dynamically reassigned by whichever game is active;
  // we expose it generically here:
  window.pauseReadingGame = () => ReadingGame._pauseReading();

})();
