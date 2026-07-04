// ===== Game 7: Pattern Recognition =====
const PatternRecognitionGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let difficulty = 'medium';
  let timerInterval = null;

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('patternRecognition', GameData.patternRecognition, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('patternRecognition', GameData.patternRecognition, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('patternRecognition', currentExercise.id);
    total++;
    startTime = Date.now();

    const seq = currentExercise.sequence;
    const timeLimit = { easy:20, medium:30, hard:45, expert:60 }[currentExercise.difficulty] || 30;
    let timeLeft = timeLimit;
    let hintUsed = false;

    container.innerHTML = `
      <div class="phase-label">🔮 FIND THE NEXT NUMBER</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
        &nbsp;·&nbsp;
        <span id="pr-timer" style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--amber)">⏱ ${timeLeft}s</span>
      </div>
      <div class="instruction-hint">What comes next in this sequence?</div>
      <div class="pattern-sequence" id="pr-sequence">
        ${seq.map((n, i) => `<div class="pattern-item" style="animation-delay:${i*80}ms">${n}</div>`).join('')}
        <div class="pattern-arrow">→</div>
        <div class="pattern-blank" id="pr-blank">?</div>
      </div>
      <div class="input-area">
        <input type="number" class="game-input" id="pr-answer-input"
          placeholder="Enter the next number..."
          inputmode="decimal" autocomplete="off"
          style="letter-spacing:4px;"/>
        <div class="action-buttons">
          <button class="btn btn-primary btn-lg" id="pr-submit-btn">Submit Answer</button>
          <button class="btn btn-secondary" id="pr-hint-btn">💡 Hint</button>
          <button class="btn btn-secondary" id="pr-skip-btn">Skip</button>
        </div>
        <div id="pr-hint-text" class="hidden" style="margin-top:8px;text-align:center;color:var(--cyan-light);font-size:13px;"></div>
      </div>
      <div id="pr-feedback" style="margin-top:12px;"></div>
    `;

    const timerEl = document.getElementById('pr-timer');
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) {
        timerEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 5) timerEl.style.color = 'var(--red)';
        else if (timeLeft <= 10) timerEl.style.color = 'var(--amber)';
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        // Auto-submit with empty
        submitAnswer(container, '');
      }
    }, 1000);

    document.getElementById('pr-submit-btn')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      const val = document.getElementById('pr-answer-input')?.value || '';
      submitAnswer(container, val);
    });

    document.getElementById('pr-answer-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearInterval(timerInterval);
        const val = document.getElementById('pr-answer-input')?.value || '';
        submitAnswer(container, val);
      }
    });

    document.getElementById('pr-hint-btn')?.addEventListener('click', () => {
      if (hintUsed) return;
      hintUsed = true;
      const hintEl = document.getElementById('pr-hint-text');
      if (hintEl) {
        hintEl.textContent = `💡 Hint: ${currentExercise.hint}`;
        hintEl.classList.remove('hidden');
      }
      sessionScore = Math.max(0, sessionScore - 25);
      UI.showToast('Hint revealed (-25 pts)', 'warning');
    });

    document.getElementById('pr-skip-btn')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      nextOrFinish(container, false);
    });

    setTimeout(() => document.getElementById('pr-answer-input')?.focus(), 100);
  };

  const submitAnswer = (container, val) => {
    clearInterval(timerInterval);
    const timeTaken = (Date.now() - startTime) / 1000;
    const userAnswer = parseFloat(val);
    const isCorrect = !isNaN(userAnswer) && Math.abs(userAnswer - currentExercise.answer) < 0.01;

    const blankEl = document.getElementById('pr-blank');
    const input = document.getElementById('pr-answer-input');

    if (isCorrect) {
      correct++;
      const pts = calcScore(timeTaken, currentExercise.difficulty);
      sessionScore += pts;
      if (blankEl) { blankEl.textContent = currentExercise.answer; blankEl.style.border = '2px solid var(--emerald)'; blankEl.style.color = 'var(--emerald)'; }
      if (input) { input.classList.add('correct'); input.disabled = true; }
    } else {
      if (blankEl) { blankEl.textContent = currentExercise.answer; blankEl.style.border = '2px solid var(--red)'; blankEl.style.color = 'var(--emerald)'; }
      if (input) { input.classList.add('incorrect'); input.disabled = true; }
    }

    const fb = document.getElementById('pr-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="reveal-answer" style="${isCorrect ? '' : 'background:rgba(239,68,68,0.1)'}">
          ${isCorrect ? `✅ Correct! +${calcScore(timeTaken, currentExercise.difficulty)} pts` : `❌ The answer was <strong>${currentExercise.answer}</strong>`}
          &nbsp;·&nbsp;
          <span style="color:var(--text-muted);font-size:13px;">Pattern: ${currentExercise.rule}</span>
          &nbsp;·&nbsp; ⏱ ${timeTaken.toFixed(1)}s
        </div>
      `;
    }

    setTimeout(() => nextOrFinish(container, true), 2500);
  };

  const calcScore = (timeTaken, diff) => {
    const base = { easy:80, medium:140, hard:220, expert:320 };
    const timeBonus = Math.max(0, Math.round((30 - timeTaken) * 2));
    return (base[diff] || 80) + timeBonus;
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 5) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('patternRecognition', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
