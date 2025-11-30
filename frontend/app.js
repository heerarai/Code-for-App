let appData;
let currentCategory = null;
let currentScenarioIndex = 0;

window.onload = async function () {
  const res = await fetch('data.json');
  appData = await res.json();
  renderCategoryScreen();
};

function renderCategoryScreen() {
  const container = document.getElementById("category-screen");
  const scenarioDiv = document.getElementById("scenario-screen");
  scenarioDiv.style.display = "none";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
  container.style.gap = "1rem";
  container.style.padding = "1rem";
  container.innerHTML = "<h2 style='grid-column: 1/-1;'>Select a Category</h2>";

  for (let category in appData) {
    const progress = getProgress(category);
    const total = appData[category].length;

    const card = document.createElement("div");
    card.className = "category-card";
    card.style.border = "2px solid #ccc";
    card.style.borderRadius = "12px";
    card.style.padding = "1rem";
    card.style.backgroundColor = "#fff0f4";
    card.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    card.style.cursor = "pointer";
    card.addEventListener('click', () => startCategory(category));

    const title = document.createElement("h3");
    title.style.marginBottom = "0.5rem";
    title.textContent = category;

    const progressText = document.createElement("p");
    progressText.style.marginBottom = "0.5rem";
    progressText.textContent = `${progress}/${total} complete`;

    const bar = document.createElement("div");
    bar.style.height = "10px";
    bar.style.backgroundColor = "#ddd";
    bar.style.borderRadius = "8px";
    bar.style.overflow = "hidden";
    bar.innerHTML = `<div style="width: ${(progress / total) * 100}%; height: 100%; background-color: #ec4899;"></div>`;

    card.appendChild(title);
    card.appendChild(progressText);
    card.appendChild(bar);

    container.appendChild(card);
  }
}

function startCategory(category) {
  currentCategory = category;
  currentScenarioIndex = getCurrentScenarioIndex(category);
  renderScenario();
}

function renderScenario() {
  const container = document.getElementById("scenario-screen");
  const categoryDiv = document.getElementById("category-screen");
  categoryDiv.style.display = "none";
  container.style.display = "block";
  container.style.padding = "1rem";

  const scenario = appData[currentCategory][currentScenarioIndex];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <button onclick="renderCategoryScreen()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 0 24 24" width="28" fill="#333"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></button>
      <button onclick="restartCategory()" style="font-size: 0.8rem; background: #ccc; border: none; border-radius: 6px; padding: 0.25rem 0.5rem; cursor: pointer;">⟳ Restart</button>
    </div>
    <img src="${scenario.image}" alt="Scenario Image" class="scene" style="width: 100%; max-width: 400px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <p class="question" style="font-size: 1.2rem; margin-top: 1rem;">${scenario.question}</p>
    <div class="choices" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
      ${scenario.choices.map((c, i) => {
        const safeChoice = c.replace(/'/g, "\\'");
        return `<button style="padding: 0.75rem; font-size: 1rem; border-radius: 8px; background-color: #f3f4f6; border: 1px solid #ccc; cursor: pointer;" onclick="submitChoice(this, '${safeChoice}')">${c}</button>`;
      }).join("")}
    </div>
    <p id="feedback" style="font-weight: bold; margin-top: 1rem;"></p>
  `;
}

function restartCategory() {
  localStorage.setItem(`progress_${currentCategory}`, 0);
  localStorage.setItem(`current_${currentCategory}`, 0);
  currentScenarioIndex = 0;
  renderScenario();
}

function submitChoice(button, choice) {
  const scenario = appData[currentCategory][currentScenarioIndex];
  const feedback = document.getElementById("feedback");
  if (choice.trim().toLowerCase() === scenario.correct.trim().toLowerCase()) {
    feedback.textContent = "✅ Good job!";
    showConfetti();
    incrementProgress(currentCategory);
    disableAllButtons();
    setTimeout(() => {
      currentScenarioIndex++;
      localStorage.setItem(`current_${currentCategory}`, currentScenarioIndex);
      if (currentScenarioIndex < appData[currentCategory].length) {
        renderScenario();
      } else {
        renderCategoryScreen();
      }
    }, 1500);
  } else {
    feedback.textContent = "❌ Try again.";
    button.disabled = true;
    button.style.opacity = 0.6;
  }
}

function disableAllButtons() {
  const buttons = document.querySelectorAll(".choices button");
  buttons.forEach(btn => btn.disabled = true);
}

function getProgress(category) {
  return parseInt(localStorage.getItem(`progress_${category}`)) || 0;
}

function getCurrentScenarioIndex(category) {
  return parseInt(localStorage.getItem(`current_${category}`)) || 0;
}

function incrementProgress(category) {
  const current = getProgress(category);
  const total = appData[category].length;
  const updated = Math.min(current + 1, total);
  localStorage.setItem(`progress_${category}`, updated);
}
