// ===== Game 5: Mental Math =====
const MentalMathGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let difficulty = 'medium';
  let answers = [];
  let timerInterval = null;

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('mentalMath', GameData.mentalMath, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('mentalMath', GameData.mentalMath, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('mentalMath', currentExercise.id);
    total++;
    startTime = Date.now();
    answers = [];

    const problems = currentExercise.problems;
    const timeLimit = { easy:30, medium:45, hard:60, expert:90 }[currentExercise.difficulty] || 45;
    let timeLeft = timeLimit;

    container.innerHTML = `
      <div class="phase-label">🧮 SOLVE WITHOUT A CALCULATOR</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp; ${problems.length} problems &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="instruction-hint" style="margin:0;flex:1">Solve all problems as fast as possible!</div>
        <div id="mm-timer" style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:var(--amber);margin-left:16px;">⏱ ${timeLeft}s</div>
      </div>
      <div class="math-batch" id="mm-problems">
        ${problems.map((p, i) => `
          <div class="math-problem" id="mm-prob-${i}">
            <span class="problem-num">#${i+1}</span>
            <span class="problem-expr">${p.expr.replace(/²/g,'<sup>2</sup>').replace(/³/g,'<sup>3</sup>').replace(/⁴/g,'<sup>4</sup>').replace(/⁵/g,'<sup>5</sup>').replace(/⁶/g,'<sup>6</sup>').replace(/⁷/g,'<sup>7</sup>').replace(/⁸/g,'<sup>8</sup>').replace(/√/g,'√').replace(/×/g,'×').replace(/÷/g,'÷')}</span>
            <input type="number" class="problem-input" id="mm-input-${i}"
              placeholder="?" inputmode="decimal" autocomplete="off"
              data-idx="${i}" data-answer="${p.answer}"/>
            <span class="problem-status" id="mm-status-${i}">⬜</span>
          </div>
        `).join('')}
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="mm-submit-btn">Submit All ✓</button>
        <button class="btn btn-secondary" id="mm-skip-btn">Skip</button>
      </div>
      <div id="mm-feedback" style="margin-top:12px;"></div>
    `;

    // Focus first input
    setTimeout(() => document.getElementById('mm-input-0')?.focus(), 100);

    // Highlight first problem
    document.getElementById('mm-prob-0')?.classList.add('active-problem');

    // Tab / Enter navigation between inputs
    problems.forEach((p, i) => {
      const input = document.getElementById(`mm-input-${i}`);
      const prob = document.getElementById(`mm-prob-${i}`);
      input?.addEventListener('focus', () => {
        document.querySelectorAll('.math-problem').forEach(el => el.classList.remove('active-problem'));
        prob?.classList.add('active-problem');
      });
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const next = document.getElementById(`mm-input-${i + 1}`);
          if (next) next.focus();
          else submitAll(container, problems);
        }
      });
      input?.addEventListener('input', () => {
        const val = parseFloat(input.value);
        const statusEl = document.getElementById(`mm-status-${i}`);
        if (statusEl) {
          if (input.value === '') { statusEl.textContent = '⬜'; return; }
          // Live feedback (gentle)
          statusEl.textContent = '✏️';
        }
      });
    });

    // Timer
    const timerEl = document.getElementById('mm-timer');
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) {
        timerEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 10) timerEl.style.color = 'var(--red)';
        else if (timeLeft <= 20) timerEl.style.color = 'var(--amber)';
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        submitAll(container, problems);
      }
    }, 1000);

    document.getElementById('mm-submit-btn')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      submitAll(container, problems);
    });
    document.getElementById('mm-skip-btn')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      nextOrFinish(container, false);
    });
  };

  const submitAll = (container, problems) => {
    clearInterval(timerInterval);
    const timeTaken = (Date.now() - startTime) / 1000;
    let correctCount = 0;
    const details = [];

    problems.forEach((p, i) => {
      const input = document.getElementById(`mm-input-${i}`);
      const statusEl = document.getElementById(`mm-status-${i}`);
      const probEl = document.getElementById(`mm-prob-${i}`);
      const val = parseFloat(input?.value || '');
      const isCorrect = !isNaN(val) && Math.abs(val - p.answer) < 0.1;

      if (isCorrect) {
        correctCount++;
        statusEl && (statusEl.textContent = '✅');
        probEl?.classList.add('solved-correct');
      } else {
        statusEl && (statusEl.textContent = '❌');
        probEl?.classList.add('solved-wrong');
      }
      details.push({ expr: p.expr, expected: p.answer, given: isNaN(val) ? '—' : val, correct: isCorrect });
      if (input) input.disabled = true;
    });

    correct += (correctCount === problems.length ? 1 : 0);
    const pts = calcScore(correctCount, problems.length, timeTaken, currentExercise.difficulty);
    sessionScore += pts;

    const fb = document.getElementById('mm-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="reveal-answer" style="${correctCount === problems.length ? '' : 'background:rgba(245,158,11,0.1)'}">
          ${correctCount === problems.length ? '🎉 Perfect! All correct!' : `✅ ${correctCount}/${problems.length} correct`} &nbsp;·&nbsp; ⏱ ${timeTaken.toFixed(1)}s &nbsp;·&nbsp; +${pts} pts
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted);">
          ${details.filter(d => !d.correct).map(d => `<span style="color:var(--red)">✗ ${d.expr} = ${d.expected} (you wrote: ${d.given})</span>`).join(' &nbsp; ')}
        </div>
      `;
    }

    setTimeout(() => nextOrFinish(container, true), 3000);
  };

  const calcScore = (correctCount, total, timeTaken, diff) => {
    const base = { easy:80, medium:140, hard:200, expert:300 };
    const pct = correctCount / total;
    const timeBonus = Math.max(0, Math.round(30 - timeTaken));
    return Math.round((base[diff] || 80) * pct + timeBonus);
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 4) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('mentalMath', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
