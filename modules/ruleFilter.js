// Chat rule filter: score one message with the int8 MiniLM in rules_ml/.
// Not moderation: the score only decides whether the author is asked to
// reconsider before the message is sent. See rules_ml/README.md.
const path = require("path");

if (!process.env.CLS_MODEL_DIR) {
  process.env.CLS_MODEL_DIR = path.join(
    __dirname,
    "..",
    "rules_ml",
    "finetune_cls3_out"
  );
}

const cls = require("../rules_ml/harness/cls.js");

// rules_ml/README.md measures 0.50 as the best precision/recall balance for a
// "reconsider" prompt (0.70 drops recall to 0.688 for +0.012 precision).

let initPromise = null;
let ready = false;

function init() {
  if (!initPromise) {
    initPromise = cls
      .init()
      .then(() => {
        ready = true;
        return true;
      })
      .catch((e) => {
        console.error("Chat rule filter model failed to load:", e.message);
        return false;
      });
  }
  return initPromise;
}

function isReady() {
  return ready;
}

// Returns { prob, category } or null when the model is unavailable, so callers
// can fail open and never block a message.
async function classify(text) {
  if (!ready && !(await init())) return null;
  try {
    const result = await cls.score(text);
    return { prob: result.prob, category: result.category };
  } catch (e) {
    console.error("Chat rule filter score failed:", e.message);
    return null;
  }
}

module.exports = { init, isReady, classify };
