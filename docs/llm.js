/*
 * Optional in-browser LLM (WebLLM / WebGPU) that PHRASES answers -- it never
 * computes or invents tactical numbers itself. It is given the exact
 * evidence-first text already produced by routes.js (real numbers from
 * ofi.js) as its only allowed source of facts, and told explicitly not to
 * add anything beyond it. The raw computed bullets are always shown
 * underneath in the UI so a reader can verify the LLM didn't drift.
 *
 * Requires a WebGPU-capable browser (recent Chrome/Edge on desktop; not yet
 * widely available on Safari/Firefox). Falls back cleanly if unsupported --
 * the rule-based answer from routes.js still works with no LLM at all.
 */
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;
let loadingPromise = null;
let modelId = null;

function isSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

async function supportsShaderF16() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!(adapter && adapter.features && adapter.features.has("shader-f16"));
  } catch {
    return false;
  }
}

async function pickSmallModel() {
  const list = webllm.prebuiltAppConfig.model_list;
  const small = list.filter((m) => /(^|[^0-9])(0\.5B|1B|360M|500M|1\.5B)([^0-9]|$)/i.test(m.model_id));
  let pool = small.length ? small : list;

  const hasF16 = await supportsShaderF16();
  const matchingQuant = pool.filter((m) => (hasF16 ? /f16/i.test(m.model_id) : /f32/i.test(m.model_id)));
  if (matchingQuant.length) pool = matchingQuant;
  else if (!hasF16) pool = pool.filter((m) => !/f16/i.test(m.model_id));

  if (!pool.length) throw new Error("No WebLLM model in the prebuilt list is compatible with this browser's GPU.");
  pool.sort((a, b) => (a.vram_required_MB || 1e9) - (b.vram_required_MB || 1e9));
  return pool[0].model_id;
}

async function ensureEngine(onProgress) {
  if (engine) return engine;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    modelId = await pickSmallModel();
    const eng = new webllm.MLCEngine();
    eng.setInitProgressCallback((report) => {
      if (onProgress) onProgress(report);
    });
    await eng.reload(modelId);
    engine = eng;
    return eng;
  })();
  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

async function phraseAnswer(question, groundingText) {
  const eng = await ensureEngine();
  const system =
    "You are a football tactics assistant. You must ONLY use the facts in the FACTS block below -- " +
    "never invent numbers, players, teams, or events that are not present there. Rephrase the facts into a " +
    "natural, concise answer (3-5 sentences) to the user's question, citing the actual numbers. If the facts " +
    "do not answer the question, say so plainly instead of guessing.\n\nFACTS:\n" + groundingText;
  const reply = await eng.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: question },
    ],
    temperature: 0.2,
    max_tokens: 220,
  });
  return reply.choices[0].message.content;
}

window.OFI_LLM = { ensureEngine, phraseAnswer, isSupported, getModelId: () => modelId };
