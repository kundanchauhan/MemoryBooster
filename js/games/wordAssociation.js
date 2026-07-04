// ===== Game 4: Word Association =====
const WordAssociationGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let phase = 'story'; // 'story' | 'recall'
  let difficulty = 'medium';

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('wordAssociation', GameData.wordAssociation, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('wordAssociation', GameData.wordAssociation, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('wordAssociation', currentExercise.id);
    phase = 'story';
    total++;
    startTime = Date.now();

    const words = currentExercise.words;
    let countdown = currentExercise.timeLimit;

    container.innerHTML = `
      <div class="phase-label" id="wa-phase">💭 STORY BUILDING PHASE</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp; ${words.length} words &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
      </div>
      <div class="instruction-hint">Create a memorable story using ALL these words. Time to recall: <strong id="wa-countdown">${countdown}</strong>s</div>
      <div class="word-cloud" id="wa-words">
        ${words.map((w, i) => `<span class="word-tag" style="animation-delay:${i * 100}ms">${w}</span>`).join('')}
      </div>
      <div style="margin-top:12px;">
        <textarea class="story-input" id="wa-story-input" placeholder="Write your story here... (the weirder, the better! 🤪)"></textarea>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="wa-next-btn">Done — Test My Memory</button>
        <button class="btn btn-secondary" id="wa-skip-btn">Skip</button>
      </div>
    `;

    const cdEl = document.getElementById('wa-countdown');
    const storyTimer = setInterval(() => {
      countdown--;
      if (cdEl) cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(storyTimer);
        switchToRecall(container, words);
      }
    }, 1000);

    document.getElementById('wa-next-btn')?.addEventListener('click', () => {
      clearInterval(storyTimer);
      switchToRecall(container, words);
    });
    document.getElementById('wa-skip-btn')?.addEventListener('click', () => {
      clearInterval(storyTimer);
      nextOrFinish(container, false);
    });
  };

  const switchToRecall = (container, words) => {
    phase = 'recall';
    const shuffled = GameData.getShuffled(words);
    const phaseEl = document.getElementById('wa-phase');
    if (phaseEl) phaseEl.textContent = '🎯 RECALL PHASE';

    container.innerHTML = `
      <div class="phase-label">🎯 RECALL — Type All ${words.length} Words</div>
      <div class="question-counter">
        Can you remember all the words from your story?
      </div>
      <div class="instruction-hint">Type all ${words.length} words you were given (one per line or comma-separated, order doesn't matter)</div>
      <div id="wa-hints" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        ${shuffled.slice(0, Math.floor(words.length / 3)).map(w =>
          `<span style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--text-muted)">Hint: ${w[0]}${w.slice(1).replace(/[a-zA-Z]/g,'_')}</span>`
        ).join('')}
      </div>
      <textarea class="story-input" id="wa-recall-input" style="min-height:150px;" placeholder="Type the words here... one per line or comma-separated"></textarea>
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="wa-submit-btn">Check My Memory</button>
      </div>
      <div id="wa-feedback" style="margin-top:16px;"></div>
    `;

    document.getElementById('wa-submit-btn')?.addEventListener('click', () => {
      submitAnswer(container, words);
    });
    document.getElementById('wa-recall-input')?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') submitAnswer(container, words);
    });
  };

  const submitAnswer = (container, words) => {
    const input = document.getElementById('wa-recall-input');
    if (!input) return;
    const userInput = input.value.toLowerCase();
    const foundWords = words.filter(w => userInput.includes(w.toLowerCase()));
    const missed = words.filter(w => !userInput.includes(w.toLowerCase()));
    const score = foundWords.length;
    const isAllCorrect = missed.length === 0;
    const timeTaken = (Date.now() - startTime) / 1000;

    if (isAllCorrect) { correct++; }
    const pts = calcScore(score, words.length, timeTaken, currentExercise.difficulty);
    sessionScore += pts;

    const fb = document.getElementById('wa-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="feedback-card">
          <div class="feedback-title">Results</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div class="mini-stat"><div class="mini-stat-value" style="color:var(--emerald)">${score}</div><div class="mini-stat-label">Recalled</div></div>
            <div class="mini-stat"><div class="mini-stat-value" style="color:var(--red)">${missed.length}</div><div class="mini-stat-label">Missed</div></div>
            <div class="mini-stat"><div class="mini-stat-value" style="color:var(--amber)">+${pts}</div><div class="mini-stat-label">Points</div></div>
          </div>
          ${foundWords.length ? `<div style="margin-bottom:8px;"><span style="color:var(--emerald);font-size:13px;font-weight:600;">✅ Recalled: </span><span style="color:var(--text-secondary);font-size:13px;">${foundWords.join(', ')}</span></div>` : ''}
          ${missed.length ? `<div><span style="color:var(--red);font-size:13px;font-weight:600;">❌ Missed: </span><span style="color:var(--text-secondary);font-size:13px;">${missed.join(', ')}</span></div>` : '<div style="color:var(--emerald);font-weight:600;">🎉 Perfect recall!</div>'}
        </div>
      `;
    }

    setTimeout(() => nextOrFinish(container, true), 3000);
  };

  const calcScore = (recalled, total, timeTaken, diff) => {
    const base = { easy:80, medium:140, hard:220, expert:320 };
    const pct = recalled / total;
    const timeBonus = Math.max(0, 20 - Math.floor(timeTaken / 3));
    return Math.round((base[diff] || 80) * pct + timeBonus);
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 4) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('wordAssociation', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
