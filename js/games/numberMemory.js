// ===== Game 1: Number Memory =====
const NumberMemoryGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let phase = 'memorize'; // 'memorize' | 'recall'
  let difficulty = 'easy';

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('numberMemory', GameData.numberMemory, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('numberMemory', GameData.numberMemory, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('numberMemory', currentExercise.id);
    phase = 'memorize';
    total++;
    startTime = Date.now();

    container.innerHTML = `
      <div class="phase-label" id="nm-phase-label">📖 MEMORIZE PHASE</div>
      <div class="question-counter" id="nm-qcounter">
        Exercise ${total} &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
      </div>
      <div class="instruction-hint">Study the number carefully. It will hide in <strong id="nm-countdown">${currentExercise.displayTime}</strong> seconds.</div>
      <div class="number-display" id="nm-display">${currentExercise.sequence}</div>
      <div class="input-area hidden" id="nm-input-area">
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:12px;">Type the number from memory:</p>
        <input type="text" class="game-input" id="nm-answer-input" placeholder="Enter the number..." inputmode="numeric" autocomplete="off"/>
        <div class="action-buttons">
          <button class="btn btn-primary btn-lg" id="nm-submit-btn">Submit Answer</button>
          <button class="btn btn-secondary" id="nm-skip-btn">Skip</button>
        </div>
      </div>
    `;

    // Countdown timer → hide number → show input
    let countdown = currentExercise.displayTime;
    const cdEl = document.getElementById('nm-countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (cdEl) cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        switchToRecall(container);
      }
    }, 1000);

    document.getElementById('nm-submit-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      submitAnswer(container);
    });
    document.getElementById('nm-skip-btn')?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      nextOrFinish(container, false);
    });
    document.getElementById('nm-answer-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { clearInterval(countdownInterval); submitAnswer(container); }
    });
  };

  const switchToRecall = (container) => {
    phase = 'recall';
    const display = document.getElementById('nm-display');
    const inputArea = document.getElementById('nm-input-area');
    const hint = container.querySelector('.instruction-hint');
    const phaseLabel = document.getElementById('nm-phase-label');
    if (display) { display.classList.add('number-hidden'); display.textContent = '?????'; }
    if (inputArea) inputArea.classList.remove('hidden');
    if (hint) hint.textContent = '🎯 Now type the number you memorized!';
    if (phaseLabel) phaseLabel.textContent = '✏️ RECALL PHASE';
    document.getElementById('nm-answer-input')?.focus();
  };

  const submitAnswer = (container) => {
    if (phase === 'memorize') { switchToRecall(container); return; }
    const input = document.getElementById('nm-answer-input');
    if (!input) return;
    const userAnswer = input.value.trim().replace(/\s/g,'');
    const isCorrect = userAnswer === currentExercise.sequence;
    const timeTaken = (Date.now() - startTime) / 1000;

    input.classList.add(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) { correct++; sessionScore += calcScore(timeTaken, currentExercise.difficulty); }

    showFeedback(container, isCorrect, currentExercise.sequence);
    setTimeout(() => nextOrFinish(container, true), 2000);
  };

  const showFeedback = (container, isCorrect, answer) => {
    const existing = container.querySelector('.reveal-answer');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'reveal-answer';
    div.innerHTML = isCorrect
      ? `✅ Correct! Well done!`
      : `❌ Incorrect. The answer was: <strong>${answer}</strong>`;
    if (!isCorrect) div.style.background = 'rgba(239,68,68,0.1)';
    container.appendChild(div);
  };

  const calcScore = (timeTaken, diff) => {
    const base = { easy:50, medium:100, hard:175, expert:300 };
    const timeBonus = Math.max(0, 30 - Math.floor(timeTaken));
    return (base[diff] || 50) + timeBonus;
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 5) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('numberMemory', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
