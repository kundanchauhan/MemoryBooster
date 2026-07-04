// ===== Game 3: Reverse Memory =====
const ReverseMemoryGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let phase = 'memorize';
  let difficulty = 'medium';

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('reverseMemory', GameData.reverseMemory, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('reverseMemory', GameData.reverseMemory, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('reverseMemory', currentExercise.id);
    phase = 'memorize';
    total++;
    startTime = Date.now();

    const seq = currentExercise.sequence;
    const reversed = [...seq].reverse().join(' ');
    const displayTime = Math.max(4, seq.length * 1.5);
    let countdown = Math.ceil(displayTime);

    container.innerHTML = `
      <div class="phase-label" id="rm-phase">📖 MEMORIZE — Then REVERSE IT</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp; ${seq.length} items &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
      </div>
      <div class="instruction-hint">Memorize this sequence. You will need to type it <strong>backwards</strong>. Hiding in <strong id="rm-countdown">${countdown}</strong>s</div>
      <div class="sequence-display" id="rm-sequence">
        ${seq.map((item, i) => `
          <div class="sequence-item" style="animation-delay:${i * 80}ms">
            ${item}
          </div>`).join('')}
      </div>
      <div id="rm-recall-area" class="hidden">
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:12px;">Type the sequence in <strong style="color:var(--violet-light)">REVERSE</strong> order (space-separated):</p>
        <input type="text" class="game-input" id="rm-answer-input" placeholder="e.g. K 9 M 2 C 7 A" autocomplete="off" style="letter-spacing:8px;"/>
        <div class="instruction-hint" style="margin-top:8px;">💡 Original had ${seq.length} items. Expected answer has ${seq.length} items.</div>
        <div class="action-buttons">
          <button class="btn btn-primary btn-lg" id="rm-submit-btn">Check Answer</button>
          <button class="btn btn-secondary" id="rm-reveal-btn">Show Answer</button>
          <button class="btn btn-secondary" id="rm-skip-btn">Skip</button>
        </div>
      </div>
      <div id="rm-feedback"></div>
    `;

    const cdEl = document.getElementById('rm-countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (cdEl) cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        switchToRecall(container, reversed);
      }
    }, 1000);

    document.getElementById('rm-submit-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      submitAnswer(container, reversed);
    });
    document.getElementById('rm-reveal-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      showReveal(container, reversed);
    });
    document.getElementById('rm-skip-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      nextOrFinish(container, false);
    });
    document.getElementById('rm-answer-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { clearInterval(countdownInterval); submitAnswer(container, reversed); }
    });
  };

  const switchToRecall = (container, reversed) => {
    phase = 'recall';
    const seq = document.getElementById('rm-sequence');
    const recall = document.getElementById('rm-recall-area');
    const phaseEl = document.getElementById('rm-phase');
    const hint = container.querySelector('.instruction-hint');
    if (seq) seq.style.filter = 'blur(8px)';
    if (recall) recall.classList.remove('hidden');
    if (phaseEl) phaseEl.textContent = '✏️ RECALL — Type in REVERSE';
    if (hint) hint.innerHTML = '🔄 The sequence is hidden. Type it <strong>backwards</strong>!';
    document.getElementById('rm-answer-input')?.focus();
  };

  const normalizeAnswer = (str) =>
    str.trim().toUpperCase().split(/[\s,]+/).filter(Boolean).join(' ');

  const submitAnswer = (container, reversed) => {
    if (phase === 'memorize') { switchToRecall(container, reversed); return; }
    const input = document.getElementById('rm-answer-input');
    if (!input) return;
    const userAnswer = normalizeAnswer(input.value);
    const expected = normalizeAnswer(reversed);
    const isCorrect = userAnswer === expected;
    const timeTaken = (Date.now() - startTime) / 1000;

    input.classList.add(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      correct++;
      sessionScore += calcScore(timeTaken, currentExercise.difficulty, currentExercise.sequence.length);
    }

    const fb = document.getElementById('rm-feedback');
    if (fb) {
      fb.innerHTML = isCorrect
        ? `<div class="reveal-answer">✅ Correct! Perfect reversal! The answer was: <strong>${expected}</strong></div>`
        : `<div class="reveal-answer" style="background:rgba(239,68,68,0.1)">❌ Not quite. The correct reverse was: <strong>${expected}</strong></div>`;
    }

    setTimeout(() => nextOrFinish(container, true), 2500);
  };

  const showReveal = (container, reversed) => {
    const fb = document.getElementById('rm-feedback');
    if (fb) {
      fb.innerHTML = `<div class="reveal-answer">👀 The reversed sequence is: <strong>${normalizeAnswer(reversed)}</strong></div>`;
    }
    switchToRecall(container, reversed);
    sessionScore = Math.max(0, sessionScore - 30);
  };

  const calcScore = (timeTaken, diff, len) => {
    const base = { easy:60, medium:120, hard:200, expert:300 };
    const lengthBonus = len * 5;
    const timeBonus = Math.max(0, 30 - Math.floor(timeTaken));
    return (base[diff] || 60) + lengthBonus + timeBonus;
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 5) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('reverseMemory', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
