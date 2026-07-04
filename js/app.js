// ===== app.js — Core App Orchestrator =====

const App = (() => {
  let currentPage = 'dashboard';
  let currentGame = null;
  let selectedDifficulty = 'medium';
  let dailyCompleted = [];

  const GAME_MODULES = {
    numberMemory: NumberMemoryGame,
    findDifference: FindDifferenceGame,
    reverseMemory: ReverseMemoryGame,
    wordAssociation: WordAssociationGame,
    mentalMath: MentalMathGame,
    focusReading: FocusReadingGame,
    patternRecognition: PatternRecognitionGame,
  };

  const GAME_META = {
    numberMemory:     { name:'Number Memory',       icon:'🔢', color:'violet', skill:'Working Memory',    count:80 },
    findDifference:   { name:'Find the Difference', icon:'🔍', color:'cyan',   skill:'Attention',         count:75 },
    reverseMemory:    { name:'Reverse Memory',      icon:'🔄', color:'pink',   skill:'Working Memory',    count:70 },
    wordAssociation:  { name:'Word Association',    icon:'💭', color:'emerald',skill:'Creativity',        count:60 },
    mentalMath:       { name:'Mental Math',         icon:'🧮', color:'amber',  skill:'Processing Speed',  count:100 },
    focusReading:     { name:'Focus Reading',       icon:'📖', color:'red',    skill:'Comprehension',     count:50 },
    patternRecognition:{ name:'Pattern Recognition',icon:'🔮', color:'indigo', skill:'Logic',             count:65 },
  };

  // ===== Navigation =====
  const navigate = (page) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');

    // Hide game/results screens
    document.getElementById('game-screen')?.classList.remove('active');
    document.getElementById('results-screen')?.classList.remove('active');

    currentPage = page;

    // Re-render page content
    switch(page) {
      case 'dashboard': renderDashboard(); break;
      case 'games': renderGameHub(); break;
      case 'challenge': renderChallenge(); break;
      case 'achievements': renderAchievements(); break;
      case 'stats': renderStats(); break;
    }

    UI.updateTopBar();
  };

  // ===== Dashboard =====
  const renderDashboard = () => {
    const profile = Storage.getProfile();
    const streak = Storage.getStreak();
    const scores = Storage.getScores();
    const weekly = Storage.getWeeklyScores();
    const skills = Storage.getSkillRatings();
    const daily = GameData.getDailyWorkout();

    // Completed today
    const todayCompleted = dailyCompleted;
    const totalDailyGames = daily.games.length;
    const completedCount = todayCompleted.length;

    // Stats cards
    const totalGames = Object.values(scores).reduce((s, g) => s + (g.gamesPlayed || 0), 0);
    const bestToday = weekly[6] || 0;

    // XP progress to next level
    const currentXp = profile.xp;
    const nextLevelXp = profile.level * profile.level * 100;
    const xpPct = Math.min(100, Math.round((currentXp % (profile.level * 100)) / (profile.level * 100) * 100));

    const dashboard = document.getElementById('page-dashboard');
    if (!dashboard) return;

    dashboard.innerHTML = `
      <div class="page-header">
        <h1>Good ${getGreeting()}, Brain Trainer! 🧠</h1>
        <p>${getTodayString()} &nbsp;·&nbsp; Level ${profile.level} &nbsp;·&nbsp; ${currentXp.toLocaleString()} XP</p>
      </div>

      <!-- XP Bar -->
      <div class="card mb-6" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08));">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:700;color:var(--violet-light)">Level ${profile.level}</span>
          <span style="font-size:12px;color:var(--text-muted)">${currentXp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP</span>
          <span style="font-size:14px;font-weight:700;color:var(--violet-light)">Level ${profile.level + 1}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${xpPct}%"></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Daily Workout -->
        <div class="card workout-card">
          <div class="card-title">Today's Workout</div>
          <div class="workout-progress">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" id="daily-progress-bar" style="width:${Math.round(completedCount/totalDailyGames*100)}%"></div>
            </div>
            <div class="progress-label">
              <span>${completedCount} of ${totalDailyGames} games complete</span>
              <span>${Math.round(completedCount/totalDailyGames*100)}%</span>
            </div>
          </div>
          <div class="workout-games">
            ${daily.games.map(g => `
              <div class="workout-game-badge ${todayCompleted.includes(g.id) ? 'completed' : ''}"
                onclick="App.launchGame('${g.id}')" style="cursor:pointer">
                ${g.icon} ${g.name}
                ${todayCompleted.includes(g.id) ? '<span>✓</span>' : `<span style="color:var(--text-muted)">${g.time}min</span>`}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Streak -->
        <div class="card">
          <div class="card-title">Daily Streak</div>
          <div class="streak-display">
            <div class="streak-flame">🔥</div>
            <div class="streak-number">${streak.current}</div>
          </div>
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:12px">Best: ${streak.longest} days</div>
          <div class="streak-calendar" id="streak-cal"></div>
        </div>

        <!-- Mini stats -->
        <div class="card">
          <div class="card-title">Quick Stats</div>
          <div class="stats-mini-grid">
            <div class="mini-stat">
              <div class="mini-stat-icon">🎮</div>
              <div class="mini-stat-value" id="stat-total-games">${totalGames}</div>
              <div class="mini-stat-label">Total Games</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon">⭐</div>
              <div class="mini-stat-value">${bestToday}</div>
              <div class="mini-stat-label">Today's XP</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon">🏆</div>
              <div class="mini-stat-value">${Storage.getAchievements().length}</div>
              <div class="mini-stat-label">Badges</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon">📅</div>
              <div class="mini-stat-value">${Storage.getChallenge().completedDays?.length || 0}</div>
              <div class="mini-stat-label">Challenge Days</div>
            </div>
          </div>
        </div>

        <!-- Weekly Chart -->
        <div class="card" style="grid-column:1/3">
          <div class="card-title">This Week's Score</div>
          <div class="chart-wrap">
            <canvas id="weeklyChart"></canvas>
          </div>
        </div>

        <!-- Skill Radar -->
        <div class="card">
          <div class="card-title">Skill Profile</div>
          <div class="radar-wrap">
            <canvas id="skillRadar" width="200" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Play -->
      <div style="margin-top:32px">
        <div class="card-title" style="margin-bottom:16px">Quick Play</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${Object.entries(GAME_META).map(([id, meta]) => `
            <button class="btn btn-secondary" onclick="App.launchGame('${id}')"
              style="gap:8px">
              ${meta.icon} ${meta.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Render streak calendar (last 14 days)
    const calEl = document.getElementById('streak-cal');
    if (calEl) {
      const days = streak.daysCompleted || [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toDateString();
        const isToday = i === 0;
        const isDone = days.includes(ds);
        const dot = document.createElement('div');
        dot.className = `day-dot${isDone ? ' done' : ''}${isToday ? ' today' : ''}`;
        dot.title = ds;
        dot.textContent = d.getDate();
        calEl.appendChild(dot);
      }
    }

    // Draw charts
    setTimeout(() => {
      UI.drawWeeklyChart('weeklyChart', weekly);
      UI.drawRadarChart('skillRadar', skills);
    }, 100);
  };

  // ===== Game Hub =====
  const renderGameHub = () => {
    const scores = Storage.getScores();
    const hub = document.getElementById('page-games');
    if (!hub) return;

    hub.innerHTML = `
      <div class="page-header">
        <h1>Brain Training Games</h1>
        <p>7 games · ${GameData.totalCount()}+ exercises · 4 difficulty levels</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;" id="diff-filter">
        ${['all','easy','medium','hard','expert'].map(d => `
          <button class="btn btn-secondary ${d === 'all' ? 'selected-diff' : ''}" data-diff="${d}"
            onclick="App.setDifficulty('${d}', this)">
            ${d === 'all' ? '🎯 All Levels' : d.charAt(0).toUpperCase()+d.slice(1)}
          </button>
        `).join('')}
      </div>
      <div class="games-grid">
        ${Object.entries(GAME_META).map(([id, meta]) => {
          const sc = scores[id] || {};
          return `
            <div class="game-card" data-color="${meta.color}" onclick="App.launchGame('${id}')">
              <div class="game-play-btn">▶</div>
              <div class="game-card-icon icon-${meta.color}">${meta.icon}</div>
              <div class="game-card-title">${meta.name}</div>
              <div class="game-card-desc">${getGameDesc(id)}</div>
              <div class="game-card-meta">
                <span class="game-card-badge badge-${meta.color}">${meta.skill}</span>
                <span class="game-card-score">${sc.gamesPlayed || 0} played · Best: ${sc.bestScore || 0}</span>
              </div>
              <div style="margin-top:12px;position:relative;z-index:1">
                <div class="progress-bar-wrap" style="height:4px">
                  <div class="progress-bar-fill" style="width:${Math.min(100, (sc.gamesPlayed || 0) * 2)}%"></div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${meta.count}+ exercises</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const setDifficulty = (diff, btn) => {
    selectedDifficulty = diff === 'all' ? 'medium' : diff;
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('selected-diff'));
    btn?.classList.add('selected-diff');
  };

  // ===== Launch a Game =====
  const launchGame = (gameId, diff = null) => {
    const useDiff = diff || selectedDifficulty;
    currentGame = gameId;
    const meta = GAME_META[gameId];
    if (!meta) return;

    UI.showInstructions(gameId, () => {
      startGame(gameId, useDiff);
    });
  };

  const startGame = (gameId, diff) => {
    // Hide pages, show game screen
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('game-screen')?.classList.add('active');
    document.getElementById('results-screen')?.classList.remove('active');

    const meta = GAME_META[gameId];
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;

    gameScreen.innerHTML = `
      <div class="game-header">
        <button class="game-back-btn" onclick="App.navigate('games')">
          ← Back
        </button>
        <div class="game-info">
          <span style="font-size:24px">${meta.icon}</span>
          <span class="game-title-display">${meta.name}</span>
          <span class="difficulty-badge diff-${diff}">${diff}</span>
        </div>
        <div class="game-session-info">
          <span id="session-score-display">Score: 0</span>
        </div>
      </div>
      <div class="game-content-card" id="game-content"></div>
    `;

    // Initialize and render game
    const module = GAME_MODULES[gameId];
    if (!module) return;
    module.init(diff);

    const content = document.getElementById('game-content');
    if (content) module.render(content);

    // Update top bar
    UI.updateTopBar();
  };

  // ===== Show Results =====
  const showResults = (gameId, score, correctCount, totalCount, timeTaken) => {
    const meta = GAME_META[gameId];
    const { isNewBest } = Storage.recordScore(gameId, score, correctCount, totalCount, timeTaken);
    Storage.updateStreak();
    UI.checkAndAwardAchievements(gameId, score, correctCount, totalCount, timeTaken);

    // Mark daily workout complete
    if (!dailyCompleted.includes(gameId)) dailyCompleted.push(gameId);

    const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const xpEarned = score;
    const grade = pct === 100 ? 'Perfect!' : pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : pct >= 40 ? 'Keep Practicing!' : 'Try Again!';
    const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '💪' : '🧠';

    if (pct >= 80) UI.triggerConfetti();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('game-screen')?.classList.remove('active');
    const resultsScreen = document.getElementById('results-screen');
    if (resultsScreen) resultsScreen.classList.add('active');

    if (resultsScreen) {
      resultsScreen.innerHTML = `
        <div class="results-header">
          <div class="results-emoji">${emoji}</div>
          <div class="results-title text-gradient">${grade}</div>
          <div class="results-subtitle">${meta.icon} ${meta.name}</div>
        </div>

        <div class="results-score-card">
          <div class="score-big">${score.toLocaleString()}</div>
          <div class="score-label">Total Score</div>
          <div style="margin-top:12px">
            <div class="xp-earned">⭐ +${xpEarned} XP Earned</div>
          </div>
          ${isNewBest ? '<div style="margin-top:8px;color:var(--amber);font-size:13px;font-weight:600">🎯 New Personal Best!</div>' : ''}
        </div>

        <div class="results-stats">
          <div class="result-stat">
            <div class="result-stat-value" style="color:${pct >= 60 ? 'var(--emerald)' : 'var(--red)'}">${correctCount}/${totalCount}</div>
            <div class="result-stat-label">Correct</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-value" style="color:var(--violet-light)">${pct}%</div>
            <div class="result-stat-label">Accuracy</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-value">${timeTaken.toFixed(0)}s</div>
            <div class="result-stat-label">Time</div>
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn-primary btn-lg" onclick="App.launchGameDirect('${gameId}')">
            🔄 Play Again
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('games')">
            🎮 All Games
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('dashboard')">
            🏠 Dashboard
          </button>
        </div>
      `;
    }

    UI.updateTopBar();
  };

  const launchGameDirect = (gameId) => {
    startGame(gameId, selectedDifficulty);
  };

  // ===== Challenge Page =====
  const renderChallenge = () => {
    const challenge = Storage.getChallenge();
    const challengePage = document.getElementById('page-challenge');
    if (!challengePage) return;

    const dailyPlan = [
      // 30 days of exercises
      ['numberMemory','reverseMemory','mentalMath'],
      ['findDifference','patternRecognition','focusReading'],
      ['mentalMath','numberMemory','wordAssociation'],
      ['reverseMemory','focusReading','patternRecognition'],
      ['patternRecognition','mentalMath','findDifference'],
      ['wordAssociation','numberMemory','reverseMemory'],
      ['focusReading','findDifference','mentalMath'],
      ['numberMemory','patternRecognition','wordAssociation'],
      ['mentalMath','reverseMemory','focusReading'],
      ['findDifference','wordAssociation','numberMemory'],
      ...Array(20).fill(null).map((_,i) => {
        const all = Object.keys(GAME_META);
        return [all[i%7], all[(i+1)%7], all[(i+2)%7]];
      })
    ];

    challengePage.innerHTML = `
      <div class="page-header">
        <h1>30-Day Challenge 📅</h1>
        <p>Build a daily brain training habit over 30 days</p>
      </div>
      <div class="challenge-header">
        <div class="challenge-title">The 30-Day Brain Challenge</div>
        <div class="challenge-desc">Train your brain for 20-25 minutes every day. Each day unlocks new exercises.</div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div class="mini-stat" style="background:rgba(255,255,255,0.05);padding:12px 20px;border-radius:12px;">
            <div class="mini-stat-value" style="color:var(--emerald)">${challenge.completedDays?.length || 0}</div>
            <div class="mini-stat-label">Days Done</div>
          </div>
          <div class="mini-stat" style="background:rgba(255,255,255,0.05);padding:12px 20px;border-radius:12px;">
            <div class="mini-stat-value" style="color:var(--amber)">${30 - (challenge.completedDays?.length || 0)}</div>
            <div class="mini-stat-label">Days Left</div>
          </div>
          ${!challenge.started ? `<button class="btn btn-primary btn-lg" onclick="App.startChallenge()">🚀 Start Challenge</button>` :
            `<div class="mini-stat" style="background:rgba(16,185,129,0.1);padding:12px 20px;border-radius:12px;border:1px solid rgba(16,185,129,0.3)">
              <div class="mini-stat-icon">✅</div><div class="mini-stat-label" style="color:var(--emerald)">In Progress!</div>
            </div>`}
        </div>
      </div>
      <div class="challenge-grid">
        ${Array.from({length:30},(_,i) => {
          const day = i+1;
          const isDone = challenge.completedDays?.includes(day);
          const isToday = challenge.started && challenge.completedDays?.length === i;
          const plan = dailyPlan[i] || [];
          return `
            <div class="challenge-day ${isDone ? 'completed' : ''} ${isToday ? 'today' : ''}"
              onclick="${isToday || isDone ? `App.showDayPlan(${day}, ${JSON.stringify(plan)})` : ''}"
              title="Day ${day}: ${plan.map(id => GAME_META[id]?.name).join(', ')}"
              style="cursor:${isToday || isDone ? 'pointer' : 'default'}">
              <div class="day-num">${isDone ? '✓' : day}</div>
              <div class="day-label">${isDone ? 'Done' : isToday ? 'Today!' : `Day ${day}`}</div>
            </div>`;
        }).join('')}
      </div>
    `;
  };

  const startChallenge = () => {
    Storage.startChallenge();
    Storage.addAchievement('challenge_started') && UI.showAchievement('challenge_started');
    renderChallenge();
    UI.showToast('30-Day Challenge started! Play every day to build your streak! 🔥', 'success');
  };

  const showDayPlan = (day, games) => {
    UI.showToast(`Day ${day}: Play ${games.map(id => GAME_META[id]?.name).join(', ')}`, 'info', 5000);
  };

  // ===== Achievements Page =====
  const renderAchievements = () => {
    const unlockedIds = Storage.getAchievements().map(a => a.id);
    const achievePage = document.getElementById('page-achievements');
    if (!achievePage) return;

    achievePage.innerHTML = `
      <div class="page-header">
        <h1>Achievements 🏆</h1>
        <p>${unlockedIds.length} of ${Object.keys(UI.ACHIEVEMENTS_DEF).length} unlocked</p>
      </div>
      <div class="games-grid">
        ${Object.entries(UI.ACHIEVEMENTS_DEF).map(([id, def]) => {
          const unlocked = unlockedIds.includes(id);
          return `
            <div class="card" style="${unlocked ? 'border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.05)' : 'opacity:0.5'}">
              <div style="font-size:40px;margin-bottom:12px;${unlocked ? '' : 'filter:grayscale(1)'}">${def.icon}</div>
              <div style="font-size:16px;font-weight:700;margin-bottom:4px">${def.name}</div>
              <div style="font-size:13px;color:var(--text-muted)">${def.desc}</div>
              ${unlocked ? `<div style="margin-top:8px;font-size:11px;color:var(--amber);font-weight:700">✅ UNLOCKED</div>` : `<div style="margin-top:8px;font-size:11px;color:var(--text-muted)">🔒 Locked</div>`}
            </div>`;
        }).join('')}
      </div>
    `;
  };

  // ===== Stats Page =====
  const renderStats = () => {
    const scores = Storage.getScores();
    const statsPage = document.getElementById('page-stats');
    if (!statsPage) return;

    statsPage.innerHTML = `
      <div class="page-header">
        <h1>Performance Stats 📊</h1>
        <p>Track your progress across all 7 games</p>
      </div>
      <div style="display:grid;gap:16px">
        ${Object.entries(GAME_META).map(([id, meta]) => {
          const sc = scores[id] || { gamesPlayed:0, bestScore:0, avgScore:0, history:[] };
          const history = (sc.history || []).slice(-7);
          return `
            <div class="card">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                <span style="font-size:28px">${meta.icon}</span>
                <div style="flex:1">
                  <div style="font-size:16px;font-weight:700">${meta.name}</div>
                  <div style="font-size:12px;color:var(--text-muted)">${meta.skill}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:24px;font-weight:800;color:var(--violet-light)">${sc.bestScore.toLocaleString()}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Best Score</div>
                </div>
              </div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
                <div class="mini-stat" style="flex:1;min-width:80px">
                  <div class="mini-stat-value">${sc.gamesPlayed || 0}</div>
                  <div class="mini-stat-label">Played</div>
                </div>
                <div class="mini-stat" style="flex:1;min-width:80px">
                  <div class="mini-stat-value">${sc.avgScore || 0}</div>
                  <div class="mini-stat-label">Avg Score</div>
                </div>
                <div class="mini-stat" style="flex:1;min-width:80px">
                  <div class="mini-stat-value" style="color:var(--emerald)">${history.length > 0 ? Math.max(...history.map(h=>h.score)).toLocaleString() : 0}</div>
                  <div class="mini-stat-label">Recent Best</div>
                </div>
              </div>
              <button class="btn btn-primary" onclick="App.launchGame('${id}')" style="width:100%">
                Play ${meta.name}
              </button>
            </div>`;
        }).join('')}
      </div>
    `;
  };

  // ===== Helpers =====
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const getTodayString = () => new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const getGameDesc = (id) => ({
    numberMemory: 'Memorize long number sequences, then recall them from memory. Builds working memory capacity.',
    findDifference: 'Spot the one character that breaks the repeating pattern as fast as possible.',
    reverseMemory: 'Remember a mixed sequence and type it in perfect reverse order. Trains mental manipulation.',
    wordAssociation: 'Build a vivid story from random words, then recall all of them. Trains associative memory.',
    mentalMath: 'Solve arithmetic problems in your head without a calculator, under time pressure.',
    focusReading: 'Read a passage once, then answer comprehension questions without looking back.',
    patternRecognition: 'Find the hidden rule in number sequences and predict what comes next.',
  }[id] || '');

  // ===== Init =====
  const init = () => {
    Storage.init();
    UI.initParticles();
    UI.updateTopBar();

    // Set up nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) navigate(page);
      });
    });

    // Initial page
    navigate('dashboard');

    // Update streak on load
    Storage.updateStreak();
  };

  return {
    init, navigate, renderDashboard, renderGameHub,
    launchGame, launchGameDirect, startGame, showResults,
    setDifficulty, startChallenge, showDayPlan,
    renderChallenge, renderAchievements, renderStats,
    GAME_META,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
