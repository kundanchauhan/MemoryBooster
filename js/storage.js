// ===== storage.js — LocalStorage Abstraction =====

const Storage = (() => {
  const PREFIX = 'mb_';
  const KEYS = {
    profile: 'profile',
    scores: 'scores',
    streak: 'streak',
    challenge: 'challenge',
    seenExercises: 'seen',
    achievements: 'achievements',
    settings: 'settings',
  };

  const get = (key) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const set = (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  };

  const defaultProfile = () => ({
    name: 'Brain Trainer',
    xp: 0,
    level: 1,
    totalGamesPlayed: 0,
    createdAt: Date.now(),
  });

  const defaultScores = () => ({
    numberMemory: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    findDifference: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    reverseMemory: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    wordAssociation: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    mentalMath: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    focusReading: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
    patternRecognition: { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] },
  });

  const defaultStreak = () => ({
    current: 0,
    longest: 0,
    lastDate: null,
    daysCompleted: [],
  });

  const defaultChallenge = () => ({
    started: false,
    startDate: null,
    completedDays: [],
  });

  const defaultAchievements = () => ([]);

  // Initialize storage if empty
  const init = () => {
    if (!get(KEYS.profile)) set(KEYS.profile, defaultProfile());
    if (!get(KEYS.scores)) set(KEYS.scores, defaultScores());
    if (!get(KEYS.streak)) set(KEYS.streak, defaultStreak());
    if (!get(KEYS.challenge)) set(KEYS.challenge, defaultChallenge());
    if (!get(KEYS.achievements)) set(KEYS.achievements, defaultAchievements());
    if (!get(KEYS.settings)) set(KEYS.settings, { sound: true, difficulty: 'medium' });
  };

  const getProfile = () => get(KEYS.profile) || defaultProfile();
  const saveProfile = (p) => set(KEYS.profile, p);

  const getScores = () => get(KEYS.scores) || defaultScores();

  const recordScore = (gameId, score, correct, total, timeTaken) => {
    const scores = getScores();
    if (!scores[gameId]) scores[gameId] = { bestScore: 0, gamesPlayed: 0, avgScore: 0, history: [] };
    const g = scores[gameId];
    g.gamesPlayed++;
    if (score > g.bestScore) g.bestScore = score;
    g.history.push({ score, correct, total, timeTaken, date: Date.now() });
    if (g.history.length > 50) g.history = g.history.slice(-50);
    const recent = g.history.slice(-10);
    g.avgScore = Math.round(recent.reduce((a, b) => a + b.score, 0) / recent.length);
    set(KEYS.scores, scores);

    // Update profile XP
    const profile = getProfile();
    profile.xp += score;
    profile.totalGamesPlayed++;
    profile.level = Math.floor(1 + Math.sqrt(profile.xp / 100));
    saveProfile(profile);

    return { isNewBest: score >= g.bestScore };
  };

  const getWeeklyScores = () => {
    const scores = getScores();
    const days = Array(7).fill(0);
    const now = Date.now();
    const DAY = 86400000;
    Object.values(scores).forEach(game => {
      (game.history || []).forEach(h => {
        const daysAgo = Math.floor((now - h.date) / DAY);
        if (daysAgo < 7) days[6 - daysAgo] += h.score;
      });
    });
    return days;
  };

  const getSkillRatings = () => {
    const scores = getScores();
    const map = {
      numberMemory: 'Working Memory',
      findDifference: 'Attention',
      reverseMemory: 'Working Memory',
      wordAssociation: 'Creativity',
      mentalMath: 'Processing Speed',
      focusReading: 'Comprehension',
      patternRecognition: 'Logic',
    };
    const result = { 'Working Memory': 0, 'Attention': 0, 'Creativity': 0, 'Processing Speed': 0, 'Comprehension': 0, 'Logic': 0 };
    const counts = { ...result };
    Object.entries(scores).forEach(([id, data]) => {
      const skill = map[id];
      if (skill && data.avgScore) { result[skill] += data.avgScore; counts[skill]++; }
    });
    return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, counts[k] ? Math.min(100, Math.round(v / counts[k])) : 20]));
  };

  const getStreak = () => get(KEYS.streak) || defaultStreak();

  const updateStreak = () => {
    const streak = getStreak();
    const today = new Date().toDateString();
    if (streak.lastDate === today) return streak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastDate === yesterday) {
      streak.current++;
    } else if (streak.lastDate !== today) {
      streak.current = 1;
    }
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastDate = today;
    if (!streak.daysCompleted.includes(today)) streak.daysCompleted.push(today);
    set(KEYS.streak, streak);
    return streak;
  };

  const getChallenge = () => get(KEYS.challenge) || defaultChallenge();
  const saveChallenge = (c) => set(KEYS.challenge, c);

  const startChallenge = () => {
    const c = getChallenge();
    if (!c.started) {
      c.started = true;
      c.startDate = Date.now();
      c.completedDays = [];
      saveChallenge(c);
    }
    return c;
  };

  const completeDay = (dayNum) => {
    const c = getChallenge();
    if (!c.completedDays.includes(dayNum)) c.completedDays.push(dayNum);
    saveChallenge(c);
  };

  const getAchievements = () => get(KEYS.achievements) || [];
  const addAchievement = (id) => {
    const a = getAchievements();
    if (!a.find(x => x.id === id)) {
      a.push({ id, unlockedAt: Date.now() });
      set(KEYS.achievements, a);
      return true;
    }
    return false;
  };

  const hasAchievement = (id) => (getAchievements()).some(a => a.id === id);

  const getSettings = () => get(KEYS.settings) || { sound: true, difficulty: 'medium' };
  const saveSettings = (s) => set(KEYS.settings, s);

  const getSeenExercises = (gameId) => {
    const seen = get(KEYS.seenExercises) || {};
    return seen[gameId] || [];
  };

  const markSeen = (gameId, exerciseId) => {
    const seen = get(KEYS.seenExercises) || {};
    if (!seen[gameId]) seen[gameId] = [];
    if (!seen[gameId].includes(exerciseId)) {
      seen[gameId].push(exerciseId);
      if (seen[gameId].length > 200) seen[gameId] = seen[gameId].slice(-100);
      set(KEYS.seenExercises, seen);
    }
  };

  return {
    init,
    getProfile, saveProfile,
    getScores, recordScore, getWeeklyScores, getSkillRatings,
    getStreak, updateStreak,
    getChallenge, startChallenge, completeDay,
    getAchievements, addAchievement, hasAchievement,
    getSettings, saveSettings,
    getSeenExercises, markSeen,
  };
})();
