/*
 * Wires the page together. All metrics are computed live in the browser by
 * ofi.js (a verified JS port of ofi.py) -- nothing here is precomputed on a
 * server. See ofi.js and routes.js for the actual computation and answer
 * formatting; this file just handles UI state.
 */

const DEFAULT_EVENTS_URL = "data_default_match_events.json";
const SIMILARITY_URL = "data_similarity.json";
const PROVENANCE_URL = "data_provenance.json";

let state = {
  events: null,
  provenance: null,
  similarityData: null,
  isDefaultMatch: true,
};

function fixtureLine(prov) {
  return `Match: ${prov.fixture} - ${prov.competition}${prov.date ? " (" + prov.date + ")" : ""}, `
    + `${prov.n_events} events${prov.source ? ", " + prov.source : ""}.`;
}

async function loadDefaultMatch() {
  const [rawEvents, prov, similarity] = await Promise.all([
    fetch(DEFAULT_EVENTS_URL).then((r) => r.json()),
    fetch(PROVENANCE_URL).then((r) => r.json()),
    fetch(SIMILARITY_URL).then((r) => r.json()),
  ]);
  let events = window.OFI.flattenEvents(rawEvents);
  events = events.filter((e) => e.period != null && e.period <= 4);
  state = { events, provenance: prov, similarityData: similarity, isDefaultMatch: true };
}

async function loadMatch(matchIdStr) {
  const matchId = parseInt(matchIdStr, 10);
  if (!Number.isInteger(matchId)) throw new Error("match_id must be a whole number");
  const events = await window.OFI_LOADER.fetchMatchEvents(matchId);
  const teams = window.OFI.teamList(events);
  const prov = {
    match_id: matchId,
    fixture: teams.join(" vs "),
    competition: "StatsBomb open data",
    date: "",
    source: "StatsBomb Open Data (fetched live)",
    n_events: events.length,
  };
  state = { events, provenance: prov, similarityData: null, isDefaultMatch: false };
}

// ---------------------------------------------------------------------------

function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inlineMd(line.slice(2))}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.length) html += `<p>${inlineMd(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function inlineMd(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function renderAnswer(route, llmText) {
  const answerEl = document.getElementById("answer");
  const imgWrap = document.getElementById("answer-image");
  let html = "";
  if (llmText) {
    html += `<div class="llm-answer"><p class="llm-label">Local LLM (phrased from the computed facts below):</p>${renderMarkdown(llmText)}</div>`;
    html += `<div class="evidence-label">Computed evidence:</div>`;
  }
  html += renderMarkdown(route.text);
  answerEl.innerHTML = html;
  imgWrap.innerHTML = route.image ? `<img src="${route.image}" alt="Supporting figure">` : "";
}

async function ask() {
  const question = document.getElementById("question").value;
  const route = window.OFI_ROUTES.routeQuestion(question, state.events, state.provenance, state.similarityData);
  renderAnswer(route, null);

  if (llmEnabled && question.trim()) {
    const statusEl = document.getElementById("llm-status");
    const LLM_TIMEOUT_MS = 45000;
    try {
      statusEl.textContent = "Local LLM is thinking... (falls back to computed evidence if this takes too long)";
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timed out (this device's GPU may be too slow for the local LLM)")), LLM_TIMEOUT_MS)
      );
      const llmText = await Promise.race([window.OFI_LLM.phraseAnswer(question, route.text), timeout]);
      renderAnswer(route, llmText);
      statusEl.textContent = `Local LLM ready (${window.OFI_LLM.getModelId() || "model"}).`;
    } catch (e) {
      statusEl.textContent = "Local LLM couldn't answer in time (" + e.message + "); showing computed evidence only.";
    }
  }
}

let llmEnabled = false;

function setupLlmToggle() {
  const btn = document.getElementById("llm-toggle");
  const statusEl = document.getElementById("llm-status");
  if (!window.OFI_LLM || !window.OFI_LLM.isSupported()) {
    btn.disabled = true;
    statusEl.textContent = "Local LLM needs a WebGPU browser (recent desktop Chrome or Edge).";
    return;
  }
  btn.addEventListener("click", async () => {
    if (llmEnabled) {
      llmEnabled = false;
      btn.textContent = "Enable local LLM";
      statusEl.textContent = "Local LLM disabled.";
      return;
    }
    btn.disabled = true;
    statusEl.textContent = "Downloading local model (first time only, can take a while)...";
    try {
      await window.OFI_LLM.ensureEngine((report) => {
        statusEl.textContent = report.text || "Loading model...";
      });
      llmEnabled = true;
      btn.textContent = "Disable local LLM";
      statusEl.textContent = `Local LLM ready (${window.OFI_LLM.getModelId()}). Answers will be phrased by it below the computed evidence.`;
    } catch (e) {
      statusEl.textContent = "Could not load local LLM: " + e.message;
    } finally {
      btn.disabled = false;
    }
  });
}

async function onLoadMatch() {
  const input = document.getElementById("match-id");
  const statusEl = document.getElementById("load-status");
  const val = input.value.trim();
  if (!val) {
    await loadDefaultMatch();
    statusEl.textContent = `Loaded default match. ${fixtureLine(state.provenance)}`;
  } else {
    statusEl.textContent = "Loading match from StatsBomb open data...";
    try {
      await loadMatch(val);
      statusEl.textContent = `Loaded. ${fixtureLine(state.provenance)}`;
    } catch (e) {
      statusEl.textContent = "Could not load that match: " + e.message;
      return;
    }
  }
  document.getElementById("fixture-line").textContent = fixtureLine(state.provenance);
  renderAnswer(window.OFI_ROUTES.buildOverview(state.events, state.provenance), null);
}

const EXAMPLES = [
  "Why was France passive for the first 70 minutes?",
  "How aggressive was Argentina's press in each phase of the game?",
  "Who was France's most important passer?",
  "Which of France's other World Cup matches is the Final most similar to?",
  "Compare Argentina and France's progressive passing and final-third entries.",
  "What happened in extra time?",
  "Give me the full team comparison.",
];

function setupExamples() {
  const wrap = document.getElementById("examples");
  for (const ex of EXAMPLES) {
    const btn = document.createElement("button");
    btn.className = "example-btn";
    btn.textContent = ex;
    btn.addEventListener("click", () => {
      document.getElementById("question").value = ex;
      ask();
    });
    wrap.appendChild(btn);
  }
}

async function init() {
  await loadDefaultMatch();
  document.getElementById("fixture-line").textContent = fixtureLine(state.provenance);
  setupExamples();
  renderAnswer(window.OFI_ROUTES.buildOverview(state.events, state.provenance), null);

  document.getElementById("ask-btn").addEventListener("click", ask);
  document.getElementById("question").addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask();
  });
  document.getElementById("load-btn").addEventListener("click", onLoadMatch);

  // llm.js is a module script and may still be evaluating; wait for it
  // (up to a few seconds) instead of checking exactly once.
  waitForLlmModule();
}

function waitForLlmModule(attempt = 0) {
  if (window.OFI_LLM || attempt > 50) {
    setupLlmToggle();
    return;
  }
  setTimeout(() => waitForLlmModule(attempt + 1), 100);
}

init();
