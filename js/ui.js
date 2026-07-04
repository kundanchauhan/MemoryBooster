// ===== ui.js — Shared UI Utilities =====

const UI = (() => {
  // ===== Particle Background =====
  const initParticles = () => {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticles = () => {
      particles = [];
      const count = Math.min(60, Math.floor(window.innerWidth / 20));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? '124,58,237' : '6,182,212',
        });
      }
    };
    createParticles();

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      drawLines();
      animId = requestAnimationFrame(animate);
    };
    animate();
  };

  // ===== Timer Ring =====
  let timerInterval = null;
  let timerRemaining = 0;

  const createTimerRing = (containerId, seconds, onTick, onComplete) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const radius = 40;
    const circ = 2 * Math.PI * radius;
    container.innerHTML = `
      <svg class="timer-ring-svg" width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#7c3aed"/>
            <stop offset="100%" style="stop-color:#06b6d4"/>
          </linearGradient>
        </defs>
        <circle class="timer-ring-bg" cx="50" cy="50" r="${radius}" stroke-width="6"/>
        <circle class="timer-ring-progress" id="timer-progress-ring" cx="50" cy="50" r="${radius}"
          stroke-width="6"
          stroke-dasharray="${circ}"
          stroke-dashoffset="0"/>
        <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
          font-family="JetBrains Mono, monospace" font-size="18" font-weight="700"
          fill="#f1f5f9" id="timer-text-ring"></text>
      </svg>
    `;

    if (timerInterval) clearInterval(timerInterval);
    timerRemaining = seconds;
    const updateRing = () => {
      const ring = document.getElementById('timer-progress-ring');
      const txt = document.getElementById('timer-text-ring');
      if (!ring || !txt) return;
      const pct = timerRemaining / seconds;
      ring.style.strokeDashoffset = circ * (1 - pct);
      if (pct < 0.3) ring.style.stroke = '#ef4444';
      else if (pct < 0.6) ring.style.stroke = '#f59e0b';
      else ring.style.stroke = 'url(#timerGradient)';
      txt.textContent = timerRemaining;
    };
    updateRing();

    timerInterval = setInterval(() => {
      timerRemaining--;
      if (onTick) onTick(timerRemaining);
      updateRing();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        if (onComplete) onComplete();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  };

  const getTimerRemaining = () => timerRemaining;

  // ===== Toast =====
  const showToast = (msg, type = 'info', duration = 3000) => {
    let toast = document.getElementById('feedback-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'feedback-toast';
      toast.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(100px);
        background:rgba(13,20,36,0.95); backdrop-filter:blur(20px);
        border:1px solid rgba(255,255,255,0.12); border-radius:12px;
        padding:12px 24px; font-size:14px; font-weight:600; z-index:2000;
        transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
        display:flex; align-items:center; gap:10px;
        box-shadow:0 8px 40px rgba(0,0,0,0.5); max-width:400px;
      `;
      document.body.appendChild(toast);
    }
    const colors = { success: '#10b981', error: '#ef4444', info: '#06b6d4', warning: '#f59e0b' };
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.style.borderColor = colors[type] + '55';
    toast.innerHTML = `<span>${icons[type]}</span><span style="color:${colors[type]}">${msg}</span>`;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(100px)'; }, duration);
  };

  // ===== Achievement Toast =====
  const ACHIEVEMENTS_DEF = {
    'first_game': { icon: '🎮', name: 'First Steps', desc: 'Played your first game!' },
    'streak_3': { icon: '🔥', name: 'On Fire!', desc: '3-day streak achieved!' },
    'streak_7': { icon: '⚡', name: 'Week Warrior', desc: '7-day streak achieved!' },
    'streak_30': { icon: '💎', name: 'Diamond Mind', desc: '30-day streak achieved!' },
    'perfect_math': { icon: '🧮', name: 'Math Wizard', desc: 'Perfect score in Mental Math!' },
    'perfect_memory': { icon: '🧠', name: 'Memory Palace', desc: 'Perfect score in Number Memory!' },
    'speed_demon': { icon: '⚡', name: 'Speed Demon', desc: 'Found difference in under 5 seconds!' },
    'reader': { icon: '📖', name: 'Speed Reader', desc: 'Aced Focus Reading!' },
    'pattern_master': { icon: '🔮', name: 'Pattern Master', desc: 'Got all patterns correct!' },
    'level_5': { icon: '🚀', name: 'Rising Star', desc: 'Reached Level 5!' },
    'level_10': { icon: '🌟', name: 'Brain Champion', desc: 'Reached Level 10!' },
    'games_10': { icon: '🎯', name: 'Dedicated', desc: 'Played 10 games!' },
    'games_50': { icon: '🏆', name: 'Champion Trainer', desc: 'Played 50 games!' },
    'challenge_started': { icon: '📅', name: 'Challenger', desc: 'Started the 30-Day Challenge!' },
    'challenge_complete': { icon: '🥇', name: 'Challenge Master', desc: 'Completed the 30-Day Challenge!' },
  };

  const showAchievement = (id) => {
    const def = ACHIEVEMENTS_DEF[id];
    if (!def) return;
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;
    toast.querySelector('.toast-icon').textContent = def.icon;
    toast.querySelector('.toast-name').textContent = def.name;
    toast.querySelector('.toast-desc').textContent = def.desc;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  const checkAndAwardAchievements = (gameId, score, correct, total, timeTaken) => {
    const profile = Storage.getProfile();
    const awarded = [];
    const tryAward = (id) => {
      if (Storage.addAchievement(id)) { showAchievement(id); awarded.push(id); }
    };

    if (profile.totalGamesPlayed === 0) tryAward('first_game');
    if (profile.totalGamesPlayed >= 10) tryAward('games_10');
    if (profile.totalGamesPlayed >= 50) tryAward('games_50');
    if (profile.level >= 5) tryAward('level_5');
    if (profile.level >= 10) tryAward('level_10');

    const streak = Storage.getStreak();
    if (streak.current >= 3) tryAward('streak_3');
    if (streak.current >= 7) tryAward('streak_7');
    if (streak.current >= 30) tryAward('streak_30');

    if (gameId === 'mentalMath' && correct === total) tryAward('perfect_math');
    if (gameId === 'numberMemory' && correct === total) tryAward('perfect_memory');
    if (gameId === 'findDifference' && timeTaken < 5) tryAward('speed_demon');
    if (gameId === 'focusReading' && correct === total) tryAward('reader');
    if (gameId === 'patternRecognition' && correct === total && total > 3) tryAward('pattern_master');

    return awarded;
  };

  // ===== Confetti =====
  const triggerConfetti = () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const pieces = [];
    const colors = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#22d3ee'];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 3 + 2,
        spin: (Math.random() - 0.5) * 0.2,
        sway: (Math.random() - 0.5) * 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.x += p.sway + Math.sin(frame / 20 + p.angle) * 0.5;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        if (p.shape === 'rect') {
          ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      frame++;
      if (pieces.some(p => p.y < canvas.height)) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animate();
  };

  // ===== Weekly Bar Chart =====
  const drawWeeklyChart = (canvasId, data) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data, 1);
    const barW = (W - 60) / 7 - 6;
    const today = new Date().getDay();
    const todayIdx = today === 0 ? 6 : today - 1;

    data.forEach((val, i) => {
      const x = 30 + i * ((W - 60) / 7);
      const barH = val > 0 ? ((val / maxVal) * (H - 50)) : 4;
      const y = H - 25 - barH;

      // Glow effect for today
      if (i === todayIdx) {
        ctx.shadowColor = '#7c3aed';
        ctx.shadowBlur = 12;
      } else { ctx.shadowBlur = 0; }

      // Bar gradient
      const grad = ctx.createLinearGradient(0, y, 0, H - 25);
      if (i === todayIdx) {
        grad.addColorStop(0, '#7c3aed');
        grad.addColorStop(1, '#5b21b6');
      } else {
        grad.addColorStop(0, 'rgba(124,58,237,0.4)');
        grad.addColorStop(1, 'rgba(6,182,212,0.2)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + (barW - barW) / 2 + 3, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = i === todayIdx ? '#a78bfa' : 'rgba(148,163,184,0.6)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2 + 3, H - 8);

      // Value
      if (val > 0) {
        ctx.fillStyle = 'rgba(241,245,249,0.6)';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(val > 999 ? (val / 1000).toFixed(1) + 'k' : val, x + barW / 2 + 3, y - 4);
      }
    });
  };

  // ===== Radar Chart =====
  const drawRadarChart = (canvasId, skills) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 200;
    const H = canvas.offsetHeight || 200;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const r = Math.min(cx, cy) - 20;
    const labels = Object.keys(skills);
    const values = Object.values(skills);
    const n = labels.length;
    const angleStep = (Math.PI * 2) / n;

    // Grid circles
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      for (let j = 0; j < n; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const pr = r * i / 4;
        const px = cx + pr * Math.cos(angle);
        const py = cy + pr * Math.sin(angle);
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis lines
    for (let j = 0; j < n; j++) {
      const angle = j * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const angle = j * angleStep - Math.PI / 2;
      const val = Math.max(5, values[j]) / 100;
      const px = cx + r * val * Math.cos(angle);
      const py = cy + r * val * Math.sin(angle);
      j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(124,58,237,0.4)');
    grad.addColorStop(1, 'rgba(6,182,212,0.15)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    for (let j = 0; j < n; j++) {
      const angle = j * angleStep - Math.PI / 2;
      const val = Math.max(5, values[j]) / 100;
      const px = cx + r * val * Math.cos(angle);
      const py = cy + r * val * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
    }

    // Labels
    for (let j = 0; j < n; j++) {
      const angle = j * angleStep - Math.PI / 2;
      const lx = cx + (r + 16) * Math.cos(angle);
      const ly = cy + (r + 16) * Math.sin(angle);
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Wrap long label
      const lbl = labels[j];
      ctx.fillText(lbl.length > 7 ? lbl.substring(0, 7) : lbl, lx, ly);
    }
  };

  // ===== Instructions Modal =====
  const showInstructions = (game, onStart) => {
    const modal = document.getElementById('instructions-modal');
    if (!modal) return;
    const def = {
      numberMemory: {
        icon: '🔢', title: 'Number Memory', subtitle: 'Memorize the sequence, then recall it from memory.',
        steps: ['A number sequence will appear on screen.', 'Study it carefully during the countdown.', 'When the timer ends, type the sequence from memory.', 'Score is based on accuracy and speed.']
      },
      findDifference: {
        icon: '🔍', title: 'Find the Difference', subtitle: 'Spot the one character that breaks the pattern.',
        steps: ['A grid of repeating patterns appears.', 'One character is different from the rest.', 'Click on the odd character as fast as you can.', 'Bonus points for finding it quickly!']
      },
      reverseMemory: {
        icon: '🔄', title: 'Reverse Memory', subtitle: 'Remember the sequence — then reverse it!',
        steps: ['A sequence of letters/numbers appears.', 'Study it during the memorization phase.', 'Then type the sequence in REVERSE order.', 'Separate items with spaces.']
      },
      wordAssociation: {
        icon: '💭', title: 'Word Association', subtitle: 'Build a story using all the given words.',
        steps: ['A set of words is shown on screen.', 'Create a memorable story using ALL words.', 'The stranger the story, the better!', 'You will be asked to recall the words afterward.']
      },
      mentalMath: {
        icon: '🧮', title: 'Mental Math', subtitle: 'Solve all problems without a calculator!',
        steps: ['A set of math problems is presented.', 'Solve each one mentally as fast as possible.', 'Press Enter or Tab to move between fields.', 'Submit all answers before the timer ends.']
      },
      focusReading: {
        icon: '📖', title: 'Focus Reading', subtitle: 'Read once, then answer comprehension questions.',
        steps: ['A passage will appear on screen.', 'Read it carefully — you only see it once!', 'After the reading phase, answer 3 questions.', 'Do NOT look back at the passage.']
      },
      patternRecognition: {
        icon: '🔮', title: 'Pattern Recognition', subtitle: 'Find the rule and predict the next number.',
        steps: ['A sequence of numbers is shown.', 'Find the pattern or rule.', 'Enter the next number in the sequence.', 'Bonus: try to identify the pattern type!']
      }
    };
    const d = def[game] || {};
    modal.querySelector('.modal-icon').textContent = d.icon || '🧠';
    modal.querySelector('.modal-title').textContent = d.title || 'Game';
    modal.querySelector('.modal-subtitle').textContent = d.subtitle || '';
    const stepsEl = modal.querySelector('.instruction-steps');
    stepsEl.innerHTML = (d.steps || []).map((s, i) => `
      <div class="instruction-step">
        <span class="step-num">${i + 1}</span>
        <span>${s}</span>
      </div>`).join('');
    modal.classList.add('show');
    const startBtn = modal.querySelector('#modal-start-btn');
    if (startBtn) {
      startBtn.onclick = () => {
        modal.classList.remove('show');
        if (onStart) onStart();
      };
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    }, { once: true });
  };

  // ===== Level/XP Display =====
  const updateTopBar = () => {
    const profile = Storage.getProfile();
    const streak = Storage.getStreak();
    const xpEl = document.getElementById('top-xp');
    const levelEl = document.getElementById('top-level');
    const streakEl = document.getElementById('top-streak');
    if (xpEl) xpEl.textContent = profile.xp.toLocaleString();
    if (levelEl) levelEl.textContent = `Lvl ${profile.level}`;
    if (streakEl) streakEl.textContent = `${streak.current}🔥`;
  };

  // ===== Progress ring animation helper =====
  const animateValue = (el, from, to, duration = 600) => {
    if (!el) return;
    const start = performance.now();
    const update = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  return {
    initParticles,
    createTimerRing,
    stopTimer,
    getTimerRemaining,
    showToast,
    showAchievement,
    checkAndAwardAchievements,
    triggerConfetti,
    drawWeeklyChart,
    drawRadarChart,
    showInstructions,
    updateTopBar,
    animateValue,
    ACHIEVEMENTS_DEF,
  };
})();
