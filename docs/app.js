/*
 * Rule-based question router over precomputed OFI answers (data.json).
 * Every answer's text was generated once by ofi.py from real StatsBomb event
 * data (see scripts/build_static_site.py) -- this file only picks which
 * precomputed answer to show. No numbers are computed or invented here.
 */
let DATA = null;

const ROUTES = [
  { re: /press|ppda|intensity/i, key: "press" },
  { re: /\bxg\b|expected goal|shot/i, key: "xg" },
  { re: /progress|final.?third|zone.?14|entr(y|ies)/i, key: "progression" },
  { re: /similar|historical|compare.*tournament|other.*match/i, key: "similarity" },
  { re: /passive|why.*struggl|why.*comeback|why.*control/i, key: "why_passive" },
  { re: /half|phase|extra time|minute|before|after/i, key: "phase" },
  { re: /possess|control|overview|summary|dominant|comparison|compare$/i, key: "overview" },
];

function findTeam(question) {
  const q = question.toLowerCase();
  return DATA.teams.find((t) => q.includes(t.toLowerCase()));
}

function routeQuestion(question) {
  const q = (question || "").trim();
  if (!q) {
    return { text: "Ask a tactical question, or pick one of the examples below.", image: null };
  }
  const lower = q.toLowerCase();
  if (/network|passer|playmaker|centrality|isolat|key player/.test(lower)) {
    const team = findTeam(lower) || DATA.teams[0];
    const route = DATA.routes[`network_${team.toLowerCase()}`];
    if (route) return route;
  }
  for (const { re, key } of ROUTES) {
    if (re.test(lower) && DATA.routes[key]) {
      return DATA.routes[key];
    }
  }
  const fallback = DATA.routes.overview;
  return {
    text:
      "_Couldn't match that to a specific metric, so here's the full team comparison instead. " +
      "Try one of the example questions below for a more targeted answer._\n\n" +
      fallback.text,
    image: fallback.image,
  };
}

// Minimal markdown -> HTML: bold, italics, bullet lists, paragraphs. No external deps.
function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inlineMd(line.slice(2))}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (line.length) {
        html += `<p>${inlineMd(line)}</p>`;
      }
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

function renderAnswer(route) {
  const answerEl = document.getElementById("answer");
  const imgWrap = document.getElementById("answer-image");
  answerEl.innerHTML = renderMarkdown(route.text);
  if (route.image) {
    imgWrap.innerHTML = `<img src="figures/${route.image}" alt="Supporting figure">`;
  } else {
    imgWrap.innerHTML = "";
  }
}

function ask() {
  const question = document.getElementById("question").value;
  renderAnswer(routeQuestion(question));
}

function init() {
  document.getElementById("ask-btn").addEventListener("click", ask);
  document.getElementById("question").addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask();
  });

  const examplesEl = document.getElementById("examples");
  DATA.examples.forEach((ex) => {
    const btn = document.createElement("button");
    btn.className = "example-btn";
    btn.textContent = ex;
    btn.addEventListener("click", () => {
      document.getElementById("question").value = ex;
      renderAnswer(routeQuestion(ex));
    });
    examplesEl.appendChild(btn);
  });

  const p = DATA.provenance;
  document.getElementById("fixture-line").textContent =
    `Default match: ${p.fixture} - ${p.competition} (${p.date}), ${p.n_events} events, ${p.source}.`;

  renderAnswer(DATA.routes.overview);
}

fetch("data.json")
  .then((r) => r.json())
  .then((data) => {
    DATA = data;
    init();
  })
  .catch((err) => {
    document.getElementById("answer").textContent =
      "Could not load data.json: " + err;
  });
