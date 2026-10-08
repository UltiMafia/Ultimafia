# Ultimafia rule-violation classifier (`rules_ml/`)

A small, CPU-only classifier that decides whether an in-game chat message breaks Ultimafia's
rules. Built by (1) prompt-engineering a Jev (TypeSafe, via Experiential Labs) typed-decision
classifier, (2) labelling a sample of the game archive with it, and (3) distilling those labels
into a TF-IDF + logistic-regression model that runs in plain JavaScript with no dependencies.

**Not for moderation.** The intended use is to flag a message as it is sent and ask the author
to reconsider. Nothing here bans anyone.

---

## Pipeline

| step | script | output |
|---|---|---|
| sample the archive | `build_sample.py`, `build_supplement.py` | `sample.jsonl` (5,000), `supplement.jsonl` (207) |
| judge with Jev | `run_batch.py`, `run_supp.py`, `wait_and_validate3.py` | `decisions_v2.jsonl`, `decisions_supp.jsonl` |
| combine | `combine.py` | `decisions_all.jsonl` (5,207) |
| review | `analyze_v2.py`, `check_v2.py`, `final_check.py` | console report |
| train + export | `export_final2.py` | `model.json`, `model_char.json` |
| verify export | `dump_val2.py`, `validate_js.js` | console report |
| prompt definition | `jev_lib2.py` | — |
| validation harness | `validate_v2.py` | — |

Generated datasets (`sample.jsonl`, `supplement.jsonl`, `decisions_*.jsonl`, `val_preds.json`) are
**gitignored** — they are multi-megabyte, machine-generated, and reproducible from `mafia.db` plus
the API key. `decisions_sample.jsonl` (300 stratified rows) **is** committed so the label schema and
real example decisions are reviewable without pulling the full corpus.

## The judge (Jev)

`POST https://api.experientiallabs.ai/v1/systemone`, model `jev-latest`, key from
`EXPERIENTIAL_LABS_API_KEY` in the repo `.env` (never printed, never logged).

Each request carries the full rules explanation as the *state* plus per-item questions:
`noul` (probability the message breaks a rule), `choice` (which of 14 categories, or
`no_violation`) and `score` (severity). Messages are batched **4 per request** — the rules block
is ~2.5k tokens, so batching cuts cost from 2,744 to ~1,000 tokens per message. Batching was
validated against per-message judging: 16/16 agreement.

**The decision is driven by `noul`, not by `choice`.** Jev's `choice` is over-eager — it names a
category even for borderline messages where `noul` is low. `noul` separated every reference case
correctly. Final label:

```
violation  <=>  noul >= 0.5  AND  choice != "no_violation"
```

### Rules encoded

14 categories, from `react_main/src/pages/Policy/Rules.jsx`. **"Play to win" / gamethrowing is
deliberately excluded** — intent is not inferable from a single message.

Boundaries that were got wrong first and corrected:

* **OGI** is about outside *evidence*, not outside *reasoning*. Asserting meta and acting on it
  ("my meta on XYZ says they're mafia, vote them out") is allowed; sending a **link to a past
  game** to prove it is not. So are report threats, rule-accusations, non-game bribes/threats,
  pregame pacts, posting off-site during a game, and pretending to cheat.
* **Cheating** = multi-accounting *in the same game*. Saying "X is my alt" is not cheating.
* **GRA** = actually leaving (suing/suiciding) or urging it. "I'll stop trying" and defensive
  rule-talk ("you can't report me for GT") are not GRA; gamethrowing is out of scope entirely.
* Don't flag on a keyword. A message must actually break the rule.

## The distilled model

`model.json` — word (1,2)-gram TF-IDF + logistic regression (C=4, balanced), 4,044 features,
**157 KB**. `model_char.json` — char_wb (2,5)-grams, higher recall, 585 KB.

Input is the **target message only**; adding surrounding chat consistently *hurt* held-out
performance, so `use_context` is false.

Held-out (25% split, enriched sample):

| model | acc | P | R | F1 | AUC |
|---|---|---|---|---|---|
| word (1,2) | 0.857 | 0.533 | 0.649 | 0.585 | 0.864 |
| char_wb (2,5) | 0.858 | 0.530 | 0.752 | **0.622** | **0.897** |

**Threshold matters more than anything else here.** The training sample is deliberately enriched
(50% keyword-matched), so the model's raw probabilities are calibrated to a much higher base rate
than production. On the *representative* uniform subset (3.6% true rate), precision is only ~0.22
at threshold 0.5 but rises to ~0.41 at 0.7 and ~0.50 at 0.8. **For a "reconsider" prompt, raise
the threshold (~0.7–0.8) — nagging users is worse than missing a flag.**

### Verified

* portable Python re-implementation vs scikit-learn: `max|diff| = 2.0e-08`
* **`predict.js` (Node) vs Python: `max|diff| = 2.2e-16`** (exact)
* latency **0.024–0.030 ms/message**, single-threaded, no dependencies

Two subtle bugs found by that verification, both easy to reintroduce:
`TfidfVectorizer` lowercases **before** analysis (the char path must lowercase too), and the word
analyzer emits **n-grams** (`ngram_range=(1,2)` means unigrams *and* bigrams). Also, sklearn's
`char_wb` **breaks** out of the loop once a word is shorter than `n` — it does not emit longer
n-grams for short words.

## Usage (Node)

```js
const { loadModel, predict } = require('./predict');
const model = loadModel();                       // model.json, cached by the caller
const p = predict("im suing", ["alice: vote bob"], model);
if (p >= 0.7) { /* ask the author to reconsider */ }
```

## Known limitations

* **Small, enriched sample.** 5,207 decisions, 809 positives; only 90 positives in the uniform
  subset, so representative precision/recall are noisy (±1 case moves precision by ~0.05).
* **Rare slang is data-starved.** "suing" occurs in just 25 messages archive-wide and "suiciding"
  in 8 — none landed in the uniform sample, so 207 targeted messages were added as a supplement.
  This taught the model the slang but made it somewhat trigger-happy on "suicid*" tokens.
* **No real ground truth.** Labels come from Jev; the distilled model's ceiling is Jev's accuracy,
  which is itself unmeasured against moderator decisions.
* **Single-turn.** Multi-accounting, doxxing, cheating and bug abuse are largely not observable
  from one message; they are present as categories but rarely fire.
