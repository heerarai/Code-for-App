/* ============================================================
   Social Skills Trainer - app.js
   Screens: home -> categories -> scenario -> feedback -> next
   All progress is stored locally in the browser (localStorage),
   so it works fully offline with no backend required.
   ============================================================ */

const STORAGE_KEY = "sbt_state_v1";
const DAILY_GOAL = 5;
const XP_FIRST_TRY = 15;
const XP_RETRY = 5;
const XP_PER_LEVEL = 100;

let appData = {};
let state = null;
let currentCategory = null;
let currentScenario = null;
let firstTryStreak = 0;

/* ---------------------- State ---------------------- */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState() {
  return {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    dailyDate: null,
    dailyCount: 0,
    categories: {}, // { categoryName: { attempts: { scenarioId: { tries, solved, solvedFirstTry } } } }
    badges: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
  } catch (e) {
    state = defaultState();
  }
  // reset daily counter on a new day
  if (state.dailyDate !== todayStr()) {
    state.dailyDate = todayStr();
    state.dailyCount = 0;
  }
  saveState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCategoryStats(category) {
  if (!state.categories[category]) {
    state.categories[category] = { attempts: {} };
  }
  return state.categories[category];
}

function getLevel() {
  return Math.floor(state.xp / XP_PER_LEVEL) + 1;
}

function getXpIntoLevel() {
  return state.xp % XP_PER_LEVEL;
}

/* ---------------------- Boot ---------------------- */

window.onload = async function () {
  const res = await fetch("data.json");
  appData = await res.json();
  loadState();
  renderHomeScreen();
};

/* ---------------------- Screen helpers ---------------------- */

function getScreens() {
  return {
    home: document.getElementById("home-screen"),
    category: document.getElementById("category-screen"),
    scenario: document.getElementById("scenario-screen"),
    badges: document.getElementById("badges-screen"),
  };
}

function showScreen(name) {
  const screens = getScreens();
  Object.keys(screens).forEach((key) => {
    screens[key].style.display = key === name ? "block" : "none";
  });
}

/* ---------------------- Analytics helpers ---------------------- */

function categoryProgress(category) {
  const total = appData[category].length;
  const stats = getCategoryStats(category);
  const solved = Object.values(stats.attempts).filter((a) => a.solved).length;
  return { solved, total };
}

function categoryMastery(category) {
  const stats = getCategoryStats(category);
  const attempted = Object.values(stats.attempts);
  if (attempted.length === 0) return null;
  const firstTry = attempted.filter((a) => a.solvedFirstTry).length;
  return Math.round((firstTry / attempted.length) * 100);
}

// Picks the category to recommend: prefer categories that have been
// attempted but have the lowest first-try mastery; fall back to the
// first category that hasn't been started yet.
function recommendCategory() {
  const categories = Object.keys(appData);
  let started = categories
    .map((c) => ({ c, mastery: categoryMastery(c), progress: categoryProgress(c) }))
    .filter((x) => x.mastery !== null && x.progress.solved < x.progress.total);

  if (started.length > 0) {
    started.sort((a, b) => a.mastery - b.mastery);
    return started[0];
  }

  const notStarted = categories.find((c) => {
    const p = categoryProgress(c);
    return p.solved < p.total;
  });
  if (notStarted) {
    return { c: notStarted, mastery: null, progress: categoryProgress(notStarted) };
  }
  // everything complete
  return { c: categories[0], mastery: categoryMastery(categories[0]), progress: categoryProgress(categories[0]) };
}

function allCategoriesComplete() {
  return Object.keys(appData).every((c) => {
    const p = categoryProgress(c);
    return p.solved >= p.total;
  });
}

/* ---------------------- Badges ---------------------- */

const BADGE_INFO = {
  first_steps: { icon: "\u{1F31F}", name: "Getting Started", desc: "Completed your first scenario." },
  streak_3: { icon: "\u{1F525}", name: "Consistency Star", desc: "3-day learning streak." },
  streak_7: { icon: "\u{1F3C6}", name: "Habit Hero", desc: "7-day learning streak." },
  sharp_shooter: { icon: "\u{1F3AF}", name: "Sharp Shooter", desc: "5 correct answers in a row on the first try." },
  social_champion: { icon: "\u{1F451}", name: "Social Skills Champion", desc: "Completed every category." },
};

function categoryBadgeId(category) {
  return `cat_${category}`;
}

function awardBadge(id, extraInfo) {
  if (!state.badges.includes(id)) {
    state.badges.push(id);
    if (extraInfo) BADGE_INFO[id] = extraInfo;
    saveState();
    return true;
  }
  return false;
}

function checkBadges(category) {
  const newlyAwarded = [];

  if (awardBadge("first_steps")) newlyAwarded.push("first_steps");

  if (state.streak >= 3 && awardBadge("streak_3")) newlyAwarded.push("streak_3");
  if (state.streak >= 7 && awardBadge("streak_7")) newlyAwarded.push("streak_7");

  if (firstTryStreak >= 5 && awardBadge("sharp_shooter")) newlyAwarded.push("sharp_shooter");

  const progress = categoryProgress(category);
  if (progress.solved >= progress.total) {
    const id = categoryBadgeId(category);
    if (awardBadge(id, { icon: "\u2B50", name: `${category} Star`, desc: `Completed the ${category} category.` })) {
      newlyAwarded.push(id);
    }
  }

  if (allCategoriesComplete() && awardBadge("social_champion")) {
    newlyAwarded.push("social_champion");
  }

  return newlyAwarded;
}

/* ---------------------- Streak + daily tracking ---------------------- */

function recordDailyActivity() {
  const today = todayStr();
  if (state.lastActiveDate === today) {
    // already counted today
  } else if (state.lastActiveDate === yesterdayStr()) {
    state.streak += 1;
    state.lastActiveDate = today;
  } else {
    state.streak = 1;
    state.lastActiveDate = today;
  }
  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyCount = 0;
  }
  state.dailyCount += 1;
  saveState();
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ---------------------- Home Screen ---------------------- */

function renderHomeScreen() {
  showScreen("home");
  const el = document.getElementById("home-screen");

  const level = getLevel();
  const xpIntoLevel = getXpIntoLevel();
  const rec = recommendCategory();
  const dailyDone = Math.min(state.dailyCount, DAILY_GOAL);
  const totalScenarios = Object.values(appData).reduce((s, arr) => s + arr.length, 0);
  const totalSolved = Object.keys(appData).reduce((s, c) => s + categoryProgress(c).solved, 0);

  let boostMessage;
  if (rec.mastery === null) {
    boostMessage = `Let's start with <strong>${rec.c}</strong> today!`;
  } else if (rec.mastery < 70) {
    boostMessage = `You're at ${rec.mastery}% on <strong>${rec.c}</strong> so far. Let's practice that today!`;
  } else {
    boostMessage = `Great work overall! Let's keep sharpening <strong>${rec.c}</strong>.`;
  }

  el.innerHTML = `
    <div class="home-header">
      <div>
        <h1 style="margin-bottom:0;">\u2728 Social Skills Trainer</h1>
        <p class="subtitle">Welcome back! Here's where you left off.</p>
      </div>
      <button class="badges-button" onclick="renderBadgesScreen()">\u{1F3C5} Badges (${state.badges.length})</button>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-value">${level}</div>
        <div class="stat-label">Level</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${state.xp}</div>
        <div class="stat-label">Total XP</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${state.streak}\u{1F525}</div>
        <div class="stat-label">Day Streak</div>
      </div>
    </div>

    <div class="progress-block">
      <div class="progress-label-row">
        <span>Level ${level} progress</span>
        <span>${xpIntoLevel} / ${XP_PER_LEVEL} XP</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(xpIntoLevel / XP_PER_LEVEL) * 100}%;"></div>
      </div>
    </div>

    <div class="card daily-card">
      <h3>\u{1F4CB} Today's Goal</h3>
      <p>Complete ${DAILY_GOAL} scenarios today</p>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(dailyDone / DAILY_GOAL) * 100}%; background-color:#7fd8a2;"></div>
      </div>
      <p class="small-note">${dailyDone} / ${DAILY_GOAL} completed today</p>
    </div>

    <div class="card boost-card">
      <h3>\u{1F4A1} Daily Boost</h3>
      <p>${boostMessage}</p>
      <button class="primary-button" onclick="startCategory('${rec.c}')">Start ${rec.c}</button>
    </div>

    <p class="overall-progress">Overall: ${totalSolved} / ${totalScenarios} scenarios mastered</p>

    <button class="primary-button" onclick="renderCategoryScreen()">Browse All Categories</button>
  `;
}

/* ---------------------- Category Screen ---------------------- */

function renderCategoryScreen() {
  showScreen("category");
  const container = document.getElementById("category-screen");
  const rec = recommendCategory();

  let html = `
    <div class="screen-header">
      <button class="icon-button" onclick="renderHomeScreen()">${backArrowSvg()}</button>
      <h2>Select a Category</h2>
      <span></span>
    </div>
    <div class="category-grid">
  `;

  for (let category in appData) {
    const { solved, total } = categoryProgress(category);
    const mastery = categoryMastery(category);
    const isRecommended = category === rec.c && solved < total;

    html += `
      <div class="category-card ${isRecommended ? "recommended" : ""}" onclick="startCategory('${category}')">
        ${isRecommended ? '<div class="recommend-tag">Recommended</div>' : ""}
        <h3>${category}</h3>
        <p>${solved}/${total} complete</p>
        ${mastery !== null ? `<p class="mastery-text">${mastery}% first-try accuracy</p>` : ""}
        <div class="bar-track">
          <div class="bar-fill" style="width:${(solved / total) * 100}%;"></div>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

/* ---------------------- Scenario Screen ---------------------- */

function startCategory(category) {
  currentCategory = category;
  currentScenario = pickNextScenario(category);
  renderScenario();
}

// Picks the next unsolved scenario in the category (loops back to start
// if everything has been solved at least once, so users can keep practicing).
function pickNextScenario(category) {
  const stats = getCategoryStats(category);
  const scenarios = appData[category];
  const unsolved = scenarios.filter((s) => !stats.attempts[s.id] || !stats.attempts[s.id].solved);
  const pool = unsolved.length > 0 ? unsolved : scenarios;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderScenario() {
  showScreen("scenario");
  const container = document.getElementById("scenario-screen");
  const scenario = currentScenario;

  container.innerHTML = `
    <div class="screen-header">
      <button class="icon-button" onclick="renderCategoryScreen()">${backArrowSvg()}</button>
      <span class="category-pill">${currentCategory}</span>
      <button class="text-button" onclick="skipScenario()">Skip \u2192</button>
    </div>
    <img src="${scenario.image}" alt="Scenario" class="scene" onerror="this.style.display='none'">
    <p class="question">${scenario.question}</p>
    <div class="choices">
      ${scenario.choices
        .map((c, i) => {
          const safeChoice = c.replace(/'/g, "\\'");
          return `<button class="choice-button" id="choice-${i}" onclick="submitChoice(this, '${safeChoice}')">${c}</button>`;
        })
        .join("")}
    </div>
    <div id="feedback-panel"></div>
  `;
}

function skipScenario() {
  currentScenario = pickNextScenario(currentCategory);
  renderScenario();
}

function submitChoice(button, choice) {
  const scenario = currentScenario;
  const stats = getCategoryStats(currentCategory);
  if (!stats.attempts[scenario.id]) {
    stats.attempts[scenario.id] = { tries: 0, solved: false, solvedFirstTry: false };
  }
  const record = stats.attempts[scenario.id];
  record.tries += 1;

  const feedbackPanel = document.getElementById("feedback-panel");
  const correct = choice.trim().toLowerCase() === scenario.correct.trim().toLowerCase();

  if (correct) {
    const firstTry = record.tries === 1;
    record.solved = true;
    record.solvedFirstTry = record.solvedFirstTry || firstTry;
    firstTryStreak = firstTry ? firstTryStreak + 1 : 0;

    const xpEarned = firstTry ? XP_FIRST_TRY : XP_RETRY;
    state.xp += xpEarned;
    recordDailyActivity();
    const newBadges = checkBadges(currentCategory);
    saveState();

    disableAllButtons();
    button.classList.add("correct");
    if (typeof confetti === "function") showConfetti();

    feedbackPanel.innerHTML = `
      <div class="feedback correct-feedback">
        <p class="feedback-title">\u2705 Nice work! +${xpEarned} XP</p>
        <p class="feedback-explanation">${scenario.explanation}</p>
        ${newBadges.length ? renderNewBadgeCallout(newBadges) : ""}
        <button class="primary-button" onclick="nextAfterCorrect()">Continue</button>
      </div>
    `;
  } else {
    firstTryStreak = 0;
    button.disabled = true;
    button.classList.add("incorrect");

    feedbackPanel.innerHTML = `
      <div class="feedback incorrect-feedback">
        <p class="feedback-title">Almost! Let's think about it.</p>
        <p class="feedback-explanation">${scenario.explanation}</p>
        <p class="small-note">Give it another try below.</p>
      </div>
    `;
  }
}

function renderNewBadgeCallout(badgeIds) {
  const items = badgeIds
    .map((id) => {
      const b = BADGE_INFO[id];
      return b ? `<span class="badge-chip">${b.icon} ${b.name}</span>` : "";
    })
    .join("");
  return `<div class="new-badge-row"><span class="small-note">New badge earned:</span> ${items}</div>`;
}

function nextAfterCorrect() {
  currentScenario = pickNextScenario(currentCategory);
  renderScenario();
}

function disableAllButtons() {
  document.querySelectorAll(".choice-button").forEach((btn) => (btn.disabled = true));
}

/* ---------------------- Badges Screen ---------------------- */

function renderBadgesScreen() {
  showScreen("badges");
  const container = document.getElementById("badges-screen");

  let html = `
    <div class="screen-header">
      <button class="icon-button" onclick="renderHomeScreen()">${backArrowSvg()}</button>
      <h2>Your Badges</h2>
      <span></span>
    </div>
  `;

  if (state.badges.length === 0) {
    html += `<p class="small-note" style="text-align:center;">No badges yet - complete a scenario to earn your first one!</p>`;
  } else {
    html += `<div class="badge-grid">`;
    state.badges.forEach((id) => {
      const b = BADGE_INFO[id];
      if (!b) return;
      html += `
        <div class="badge-card">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
}

/* ---------------------- Misc ---------------------- */

function backArrowSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#333"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
}

function showConfetti() {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}
