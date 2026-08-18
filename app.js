
const NASA_API_KEY = "FXMdnkVrcCieViC2VzjCr1FMUQYrX3cReQwYIZUk";

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes — see Risk Assessment: API rate limiting


const els = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  rangeText: document.getElementById("rangeText"),
  resultCount: document.getElementById("resultCount"),
  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  errorMessage: document.getElementById("errorMessage"),
  emptyState: document.getElementById("emptyState"),
  grid: document.getElementById("cardGrid"),
  retryBtn: document.getElementById("retryBtn"),
  filterBtns: document.querySelectorAll(".filter-btn"),
};

let allAsteroids = [];
let activeFilter = "all";


function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getDateRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 6);
  return { start: formatDate(start), end: formatDate(end) };
}


async function fetchNeoData(start, end) {
  const cacheKey = `neo-alert:${start}:${end}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${NASA_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("NASA's API rate limit was hit. Try again in a few minutes, or add your own free API key in app.js.");
    }
    throw new Error(`NASA's API returned an error (status ${response.status}).`);
  }

  const data = await response.json();
  writeCache(cacheKey, data);
  return data;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, payload } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeCache(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), payload }));
  } catch {
    // localStorage full or unavailable — fail silently, caching is a nice-to-have
  }
}


function flattenAndProcess(rawData) {
  const byDate = rawData.near_earth_objects || {};
  const list = [];

  Object.keys(byDate).forEach((date) => {
    byDate[date].forEach((neo) => {
      const approach = neo.close_approach_data && neo.close_approach_data[0];
      if (!approach) return;

      const diameterMin = neo.estimated_diameter.meters.estimated_diameter_min;
      const diameterMax = neo.estimated_diameter.meters.estimated_diameter_max;
      const avgDiameter = (diameterMin + diameterMax) / 2;
      const missDistanceKm = parseFloat(approach.miss_distance.kilometers);
      const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
      const lunarDistances = missDistanceKm / 384400; // Moon's average distance, a relatable yardstick

      list.push({
        id: neo.id,
        name: neo.name.replace(/[()]/g, ""),
        date: approach.close_approach_date,
        diameterMin,
        diameterMax,
        avgDiameter,
        missDistanceKm,
        velocityKmS,
        lunarDistances,
        isHazardous: neo.is_potentially_hazardous_asteroid,
        risk: getRiskTier(neo.is_potentially_hazardous_asteroid, lunarDistances),
      });
    });
  });

  list.sort((a, b) => new Date(a.date) - new Date(b.date));
  return list;
}

const LUNAR_CAUTION_THRESHOLD = 20;

function getRiskTier(isHazardous, lunarDistances) {
  if (isHazardous) return "hazard";
  if (lunarDistances <= LUNAR_CAUTION_THRESHOLD) return "caution";
  return "safe";
}


function renderCards(list) {
  els.grid.innerHTML = list.map(cardTemplate).join("");
}

function cardTemplate(neo) {
  const riskLabel = { safe: "Safe", caution: "Caution", hazard: "Hazardous" }[neo.risk];
  const dateLabel = new Date(neo.date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  return `
    <article class="card card--${neo.risk}">
      <div class="card__top">
        <h2 class="card__name">${escapeHtml(neo.name)}</h2>
        <span class="badge badge--${neo.risk}">${riskLabel}</span>
      </div>
      <p class="card__size">${Math.round(neo.diameterMin)}–${Math.round(neo.diameterMax)} m across</p>
      <div class="card__stats">
        <div>
          <p class="stat__label">Close approach</p>
          <p class="stat__value">${dateLabel}</p>
        </div>
        <div>
          <p class="stat__label">Velocity</p>
          <p class="stat__value">${Math.round(neo.velocityKmS).toLocaleString()} km/s</p>
        </div>
        <div>
          <p class="stat__label">Miss distance</p>
          <p class="stat__value">${Math.round(neo.missDistanceKm).toLocaleString()} km</p>
        </div>
        <div>
          <p class="stat__label">In moon-distances</p>
          <p class="stat__value">${neo.lunarDistances.toFixed(1)}×</p>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


function showState(state) {
  els.loadingState.hidden = state !== "loading";
  els.errorState.hidden = state !== "error";
  els.emptyState.hidden = state !== "empty";
  els.grid.hidden = state !== "loaded";
}

function setStatus(mode, text) {
  els.statusDot.className = "status-dot" + (mode ? ` is-${mode}` : "");
  els.statusText.textContent = text;
}


function applyFilter() {
  const filtered = activeFilter === "all"
    ? allAsteroids
    : allAsteroids.filter((n) => n.risk === activeFilter);

  els.resultCount.textContent = `${filtered.length} object${filtered.length === 1 ? "" : "s"} tracked`;

  if (filtered.length === 0) {
    showState("empty");
  } else {
    renderCards(filtered);
    showState("loaded");
  }
}

els.filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    els.filterBtns.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter;
    applyFilter();
  });
});


async function init() {
  showState("loading");
  setStatus(null, "Connecting to NASA…");

  const { start, end } = getDateRange();
  els.rangeText.textContent = `${start} → ${end}`;

  try {
    const raw = await fetchNeoData(start, end);
    allAsteroids = flattenAndProcess(raw);
    setStatus("live", "Live");
    applyFilter();
  } catch (err) {
    console.error(err);
    setStatus("error", "Offline");
    els.errorMessage.textContent = err.message || "We couldn't reach NASA's tracking feed. Check your connection and try again.";
    showState("error");
  }
}

els.retryBtn.addEventListener("click", init);

init();
