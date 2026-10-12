# Ultimafia rule-violation classifier (`rules_ml/`)

A small, CPU-only classifier that decides whether an in-game chat message breaks Ultimafia's
rules of conduct.

**Not for moderation.** The intended use is to flag a message *as it is sent* and ask the author
to reconsider sending it. Nothing here bans anyone, and no output of this model should be shown
to a moderator as an accusation.

**If you are integrating this, read "Integrating it" below and stop there.** Everything after it
is background.

---

## Integrating it

### The artifact

```
rules_ml/finetune_cls3_out/model.int8.onnx      21.9 MB, int8 quantised, CPU only
```

Do **not** ship the fp32 weights it came from: on individual messages they differ by up to 0.40,
and every number below is measured on the int8 file.

### Dependencies

One: `onnxruntime-node` (`^1.30.0`, already pinned in `harness/package.json`). No Python, no
`transformers`, no network access at inference time.

### The contract

| | |
|---|---|
| **Input** | **one message, exactly as sent.** No chat history, no game state |
| **Output** | a 4-class softmax over `no_violation · abuse · outside_game_influence · other` |
| **The decision** | `p = 1 − probs[0]` — one minus the `no_violation` probability |
| **Category** | `argmax`, for a message like "you're gamethrowing" |
| **Latency** | ~13 ms per message, single-threaded, on a laptop CPU |

Context is deliberately not used. It was tested: stripping the surrounding chat changed the
verdict on 13 of 277 hand-judged messages (5%) and moved agreement from 82.3% to 82.7% — a wash.
Score a bare string and keep the integration trivial.

### Reference implementation

**`harness/cls.js`** is the working one-file implementation: a hand-written WordPiece tokenizer
plus the ONNX session, ~120 lines, no build step. Copy it, or `require` it directly.

```js
const cls = require('./harness/cls.js');

await cls.init();                      // loads the ONNX session and vocab.txt
const r = await cls.score("im suing");
// r = { prob: 0.856, category: 'outside_game_influence',
//       categoryLabel: 'outside game influence', categoryConf: 0.856 }

if (r.prob >= 0.50) {
  // ask the author to reconsider before sending
}
```

Its tokenizer was verified to produce ids identical to HuggingFace's for representative inputs
(`im suing` -> `101 10047 24086 3070 102`). **If you reimplement the tokenizer, re-run that
check** — a silent mismatch corrupts every score without erroring.

### Two gotchas that cost real time

- **The quantised graph is fixed batch=1.** Feed it a batch and it errors on rank. Score one
  message per call, or loop.
- **Class order is load-bearing:** `['no_violation', 'abuse', 'outside_game_influence', 'other']`,
  matching `CLASSES` in `cls.js` and `finetune_cls3.py`.

### Choosing the threshold

Measured on 277 hand-judged messages (a held-out set the model never trained on), against
judgements made by one of the site's developers:

| threshold | precision | recall | agreement |
|---|---|---|---|
| 0.35 | 0.700 | 0.875 | 85.6% |
| **0.50** | **0.731** | **0.850** | **86.6%** |
| 0.70 | 0.743 | 0.688 | 84.1% |

For a "reconsider" prompt the asymmetry favours the low end: **a false nudge costs the sender
nothing, a missed violation costs the community.** Start at **0.40–0.50**.

### How good is it, honestly

86.6% agreement with the developer's own judgements. For scale: never flagging anything scores
71.1% on the same rows, so the model is worth about 15 points over doing nothing.

Its ceiling is its teacher, **Clef** (Cloudflare, via the same gateway), which agrees with the
developer 87.0% of the time — so the model is 0.4 points from that ceiling, and the remaining
error is chiefly the *teacher's* disagreement with the human rather than a modelling failure.
13% of the set is teacher-versus-human disagreement; no model trained on this teacher fixes it.

> **Do not tune against the held-out test split.** Its labels *are* the teacher's, so any case
> where the model correctly disagrees with the teacher scores there as an error. Only the
> hand-check set measures agreement with a human.

---

## Background

Judged by **Clef** through the Experiential Labs gateway (`POST /v1/systemone`) applying a single
frozen rubric (`jev_lib2.py`), which a developer has ruled on case by case. 10,741 messages from
4,075 games are labelled this way; the model is a fine-tuned MiniLM-L6 distilled from them.

The rules come from `react_main/src/pages/Policy/Rules.jsx`. **"Play to win" / gamethrowing is
deliberately not judged** — intent is not inferable from one message — except that *accusing*
another player of it is itself a violation.

Boundaries that were got wrong first and corrected:

- **OGI is about outside *evidence*, not outside *reasoning*.** Asserting meta and acting on it
  ("my meta on XYZ says they're mafia, vote them out") is allowed; sending a **link to a past
  game** to prove it is not. Report threats, rule-accusations, non-game bribes/threats, pregame
  pacts, off-site posting during a game, and pretending to cheat also violate it.
- **Cheating** = multi-accounting *in the same game*. Saying "X is my alt" is not cheating.
- **Leaving** ("sui" / "suiciding" / "suing") for an in-game reason violates, including the
  threat. `sue me` is a dare, **not** leave-talk.
- **Don't flag on a keyword.** The message must actually break the rule. A bare dismissal
  (`stfu`, `shut up`) is not a personal attack; criticising someone's *play* or *skill* is not
  either — only an insult aimed at a person is.

`PROCESS.md` documents the whole pipeline: corpus construction, the label corrections, the
export pitfalls, the evaluation tooling, and every trap found along the way.

## Known limitations

- **`other` is not learnable.** 9 training examples, 4 in test. Doxxing lands at `no_violation`
  ~0.90. It needs synthetic data or a non-ML rule.
- **The `you're the ___` frame over-fires.** `UR THE GOAT BRO` scores ~0.48 while `he is the goat`
  scores ~0.04 — the construction generalises from insult to praise. `you rock` is flagged, which
  is intended: it reads as praise or as "as dumb as a rock", and ambiguity resolves toward
  flagging.
- **The hand-check set is 277 rows judged by one person, who later retracted 8 of their own
  calls.** The metric's own resolution is roughly ±2–4 points, so differences smaller than that
  are not meaningful.
- **Terse gamethrowing accusations are the known weak spot** (`gt sheriff`, `that is a
  gamethrow`, `youre obviously a throw account`) — the teacher under-calls them, and the model
  inherits that. They are now worked examples in the rubric; the fix is a relabel, not more
  training.
