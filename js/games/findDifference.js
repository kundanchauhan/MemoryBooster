// ===== Game 2: Find the Difference =====
const FindDifferenceGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let difficulty = 'medium';
  let found = false;

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('findDifference', GameData.findDifference, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const buildGrid = (ex) => {
    const { rows, cols, pattern, oddChar, oddRow, oddCol } = ex;
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += `<div class="diff-row${r === oddRow ? ' diff-clue-row' : ''}">`;
      const fullLine = pattern.repeat(Math.ceil(cols / pattern.length)).substring(0, cols * pattern.length);
      for (let c = 0; c < fullLine.length; c++) {
        const isOdd = (r === oddRow) && (oddCol > 0) &&
          (c >= oddCol * pattern.length && c < oddCol * pattern.length + pattern.length);
        if (isOdd && oddRow > 0) {
          // Replace pattern chars with oddChar
          const posInPattern = c - oddCol * pattern.length;
          if (posInPattern < oddChar.length) {
            html += `<span class="diff-char clickable-char" data-row="${r}" data-col="${Math.floor(c / pattern.length)}" data-is-odd="true">${oddChar[posInPattern]}</span>`;
          } else {
            html += `<span class="diff-char clickable-char" data-row="${r}" data-col="${Math.floor(c / pattern.length)}" data-is-odd="false">${fullLine[c]}</span>`;
          }
        } else {
          html += `<span class="diff-char clickable-char" data-row="${r}" data-col="${Math.floor(c / pattern.length)}" data-is-odd="false">${fullLine[c]}</span>`;
        }
      }
      html += `</div>`;
    }
    return html;
  };

  // Simpler, more reliable grid builder
  const buildSimpleGrid = (ex) => {
    const { rows, cols, pattern, oddChar, oddRow, oddCol } = ex;
    const pLen = pattern.length;
    let html = '';
    for (let r = 0; r < rows; r++) {
      let row = '';
      for (let c = 0; c < cols; c++) {
        const isOdd = (r === oddRow) && (c === oddCol) && oddRow > 0 && oddCol > 0;
        const txt = isOdd ? oddChar : pattern;
        const isOddAttr = isOdd ? 'true' : 'false';
        row += `<span class="diff-cell" data-row="${r}" data-col="${c}" data-odd="${isOddAttr}" style="cursor:pointer;display:inline-block;padding:0 2px;font-family:'JetBrains Mono',monospace;letter-spacing:1px;transition:background 0.2s;">${txt}</span>`;
      }
      html += `<div style="line-height:1.8;">${row}</div>`;
    }
    return html;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('findDifference', GameData.findDifference, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('findDifference', currentExercise.id);
    found = false;
    total++;
    startTime = Date.now();

    const hasOdd = currentExercise.oddRow > 0 || currentExercise.oddCol > 0;

    container.innerHTML = `
      <div class="phase-label">🔍 FIND THE DIFFERENT CHARACTER</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
      </div>
      <div class="instruction-hint">
        ${hasOdd ? 'Click the character that is <strong>different</strong> from the repeating pattern.' : '⚠️ All characters are the same — can you spot that?'}
        &nbsp; <span id="fd-timer-display" style="font-weight:700;color:var(--amber);">⏱ 0s</span>
      </div>
      <div class="game-content-card" style="overflow-x:auto;">
        <div id="fd-grid" class="diff-grid" style="font-size:${currentExercise.difficulty === 'expert' ? '11px' : '14px'}">${buildSimpleGrid(currentExercise)}</div>
      </div>
      <div class="action-buttons">
        <button class="btn btn-secondary" id="fd-hint-btn">💡 Hint</button>
        <button class="btn btn-secondary" id="fd-skip-btn">Skip</button>
        ${!hasOdd ? '<button class="btn btn-primary" id="fd-allsame-btn">All Same!</button>' : ''}
      </div>
      <div id="fd-feedback" style="margin-top:12px;text-align:center;"></div>
    `;

    // Live timer
    const timerEl = document.getElementById('fd-timer-display');
    const timerInterval = setInterval(() => {
      if (timerEl) timerEl.textContent = `⏱ ${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    }, 100);

    // Click handler
    const grid = document.getElementById('fd-grid');
    grid?.addEventListener('click', (e) => {
      const cell = e.target.closest('.diff-cell');
      if (!cell || found) return;
      const isOdd = cell.dataset.odd === 'true';
      handleClick(isOdd, timerInterval, container);
    });

    document.getElementById('fd-hint-btn')?.addEventListener('click', () => {
      showHint(container);
    });

    document.getElementById('fd-skip-btn')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      nextOrFinish(container, false);
    });

    document.getElementById('fd-allsame-btn')?.addEventListener('click', () => {
      if (!currentExercise.oddRow && !currentExercise.oddCol) {
        handleClick(true, timerInterval, container);
      } else {
        handleClick(false, timerInterval, container);
      }
    });
  };

  const showHint = (container) => {
    if (!currentExercise.oddRow && !currentExercise.oddCol) {
      UI.showToast('All characters are the same! Click "All Same!"', 'info');
      return;
    }
    const grid = document.getElementById('fd-grid');
    const rows = grid?.querySelectorAll('div');
    if (rows && rows[currentExercise.oddRow]) {
      rows[currentExercise.oddRow].style.background = 'rgba(245,158,11,0.1)';
      setTimeout(() => { if (rows[currentExercise.oddRow]) rows[currentExercise.oddRow].style.background = ''; }, 1000);
    }
    sessionScore = Math.max(0, sessionScore - 20); // penalty
    UI.showToast('Hint: The odd character is highlighted in the grid', 'warning');
  };

  const handleClick = (isCorrect, timerInterval, container) => {
    found = true;
    clearInterval(timerInterval);
    const timeTaken = (Date.now() - startTime) / 1000;

    if (isCorrect) {
      correct++;
      const pts = calcScore(timeTaken, currentExercise.difficulty);
      sessionScore += pts;
      // Highlight the odd cell
      const cells = document.querySelectorAll('.diff-cell[data-odd="true"]');
      cells.forEach(c => { c.style.background = 'rgba(16,185,129,0.3)'; c.style.color = '#10b981'; });
      showFeedback(container, true, timeTaken);
    } else {
      const cells = document.querySelectorAll('.diff-cell[data-odd="true"]');
      cells.forEach(c => { c.style.background = 'rgba(239,68,68,0.3)'; c.style.color = '#ef4444'; });
      showFeedback(container, false, timeTaken);
    }

    setTimeout(() => nextOrFinish(container, true), 2000);
  };

  const showFeedback = (container, isCorrect, timeTaken) => {
    const fb = document.getElementById('fd-feedback');
    if (fb) {
      fb.innerHTML = isCorrect
        ? `<div class="reveal-answer">✅ Found it in ${timeTaken.toFixed(1)}s! +${calcScore(timeTaken, currentExercise.difficulty)} pts</div>`
        : `<div class="reveal-answer" style="background:rgba(239,68,68,0.1)">❌ Wrong spot! The odd character was at row ${currentExercise.oddRow}, col ${currentExercise.oddCol}.</div>`;
    }
  };

  const calcScore = (timeTaken, diff) => {
    const base = { easy:60, medium:100, hard:160, expert:250 };
    const speedBonus = Math.max(0, Math.round((30 - timeTaken) * 3));
    return (base[diff] || 60) + speedBonus;
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 5) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('findDifference', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
