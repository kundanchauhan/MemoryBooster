// ===== Game 6: Focus Reading =====
const FocusReadingGame = (() => {
  let currentExercise = null;
  let queue = [];
  let sessionScore = 0;
  let correct = 0;
  let total = 0;
  let startTime = 0;
  let phase = 'read'; // 'read' | 'quiz'
  let difficulty = 'medium';

  const init = (diff = 'medium') => {
    difficulty = diff;
    queue = GameData.getSmartQueue('focusReading', GameData.focusReading, diff);
    sessionScore = 0; correct = 0; total = 0;
  };

  const render = (container) => {
    if (queue.length === 0) queue = GameData.getSmartQueue('focusReading', GameData.focusReading, difficulty);
    currentExercise = queue.shift();
    Storage.markSeen('focusReading', currentExercise.id);
    phase = 'read';
    total++;
    startTime = Date.now();

    const readTime = currentExercise.readTime || 30;
    let countdown = readTime;

    container.innerHTML = `
      <div class="phase-label" id="fr-phase">📖 READ CAREFULLY — Once Only!</div>
      <div class="question-counter">
        Exercise ${total} &nbsp;·&nbsp;
        <span class="difficulty-badge diff-${currentExercise.difficulty}">${currentExercise.difficulty}</span>
        &nbsp;·&nbsp; <span id="fr-countdown" style="font-weight:700;color:var(--amber)">⏱ ${countdown}s to read</span>
      </div>
      <div class="instruction-hint">Read the passage below. You have <strong>${readTime}</strong> seconds. It will hide, then you answer questions.</div>
      <div class="passage-text" id="fr-passage">${currentExercise.passage}</div>
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="fr-ready-btn">I'm Ready — Test Me!</button>
        <button class="btn btn-secondary" id="fr-skip-btn">Skip</button>
      </div>
    `;

    const cdEl = document.getElementById('fr-countdown');
    const readTimer = setInterval(() => {
      countdown--;
      if (cdEl) cdEl.textContent = `⏱ ${countdown}s to read`;
      if (countdown <= 5 && cdEl) cdEl.style.color = 'var(--red)';
      if (countdown <= 0) {
        clearInterval(readTimer);
        switchToQuiz(container);
      }
    }, 1000);

    document.getElementById('fr-ready-btn')?.addEventListener('click', () => {
      clearInterval(readTimer);
      switchToQuiz(container);
    });
    document.getElementById('fr-skip-btn')?.addEventListener('click', () => {
      clearInterval(readTimer);
      nextOrFinish(container, false);
    });
  };

  const switchToQuiz = (container) => {
    phase = 'quiz';
    const questions = currentExercise.questions;

    container.innerHTML = `
      <div class="phase-label">❓ COMPREHENSION QUESTIONS</div>
      <div class="question-counter">
        Answer without looking back at the passage!
      </div>
      <div class="instruction-hint">The passage is now hidden. Answer these ${questions.length} questions from memory.</div>
      <div class="questions-section">
        <div class="answer-review" id="fr-questions" style="max-height:none">
          ${questions.map((q, i) => `
            <div class="question-item" id="fr-q-${i}">
              <div class="question-text">${i+1}. ${q.q}</div>
              <input type="text" class="answer-input" id="fr-ans-${i}" placeholder="Your answer..." autocomplete="off"/>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="fr-submit-btn">Submit Answers</button>
      </div>
      <div id="fr-feedback" style="margin-top:12px;"></div>
    `;

    setTimeout(() => document.getElementById('fr-ans-0')?.focus(), 100);

    questions.forEach((q, i) => {
      document.getElementById(`fr-ans-${i}`)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const next = document.getElementById(`fr-ans-${i+1}`);
          if (next) next.focus();
          else submitQuiz(container, questions);
        }
      });
    });

    document.getElementById('fr-submit-btn')?.addEventListener('click', () => {
      submitQuiz(container, questions);
    });
  };

  const scoreAnswer = (userAns, question) => {
    if (!userAns || userAns.trim().length === 0) return false;
    const u = userAns.toLowerCase().trim();

    // Check keywords
    if (question.keywords && question.keywords.length > 0) {
      const kws = question.keywords.filter(k => k.length > 0);
      if (kws.length === 0) return u.length > 3; // generic question
      const matchCount = kws.filter(k => u.includes(k.toLowerCase())).length;
      return matchCount >= Math.ceil(kws.length * 0.5);
    }
    // Generic: any substantive answer
    return u.length > 3;
  };

  const submitQuiz = (container, questions) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    let correctCount = 0;
    const details = [];

    questions.forEach((q, i) => {
      const input = document.getElementById(`fr-ans-${i}`);
      const userAns = input?.value || '';
      const isCorrect = scoreAnswer(userAns, q);
      if (isCorrect) correctCount++;
      details.push({ q: q.q, a: q.a || '', userAns, correct: isCorrect });
      if (input) input.disabled = true;
      const qEl = document.getElementById(`fr-q-${i}`);
      if (qEl) qEl.style.borderLeft = `3px solid ${isCorrect ? 'var(--emerald)' : 'var(--red)'}`;
    });

    if (correctCount === questions.length) correct++;
    const pts = calcScore(correctCount, questions.length, timeTaken, currentExercise.difficulty);
    sessionScore += pts;

    const fb = document.getElementById('fr-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="reveal-answer" style="${correctCount === questions.length ? '' : 'background:rgba(245,158,11,0.1)'}">
          ${correctCount === questions.length ? '🧠 Excellent recall!' : `📖 ${correctCount}/${questions.length} correct`} &nbsp;·&nbsp; +${pts} pts
        </div>
        <div class="feedback-card" style="margin-top:12px;">
          <div class="feedback-title">Answer Review</div>
          ${details.map(d => `
            <div class="answer-row ${d.correct ? 'correct' : 'incorrect'}">
              <span class="status-icon">${d.correct ? '✅' : '❌'}</span>
              <div style="flex:1">
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">${d.q}</div>
                <div style="font-size:12px;">Your: <span class="your-answer" style="color:${d.correct ? 'var(--emerald)' : 'var(--red)'}">${d.userAns || '(blank)'}</span></div>
                ${!d.correct && d.a ? `<div style="font-size:11px;color:var(--text-muted)">Expected: ${d.a}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      `;
    }

    setTimeout(() => nextOrFinish(container, true), 4000);
  };

  const calcScore = (correctCount, total, timeTaken, diff) => {
    const base = { easy:100, medium:160, hard:240, expert:350 };
    const pct = correctCount / total;
    return Math.round((base[diff] || 100) * pct);
  };

  const nextOrFinish = (container, answered) => {
    if (queue.length > 0 && total < 3) {
      render(container);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      App.showResults('focusReading', sessionScore, correct, total, timeTaken);
    }
  };

  const getState = () => ({ score: sessionScore, correct, total });

  return { init, render, getState };
})();
