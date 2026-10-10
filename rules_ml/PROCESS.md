# rules_ml — how the Ultimafia rule-violation classifier was built

**What this is.** A small CPU-only model that decides whether an in-game chat message
breaks Ultimafia's rules of conduct. It is **not for moderation**. The intended use is
to flag a message *as it is sent* and ask the author to reconsider.

**The shipped artifact.** `finetune_cls3_out/model.int8.onnx` — MiniLM-L6 fine-tuned to
4 classes, quantised to int8, 23 MB, ~13 ms/message in Node via `onnxruntime-node`.

Classes: `no_violation` · `abuse` · `outside_game_influence` · `other`.
The binary "is this a violation" decision is `1 − P(no_violation)` from the same model.

Measured on a held-out split of games, using the **int8 artifact itself** (not the fp32
weights it came from — those differ by up to 0.40 on individual messages, though the
aggregate is nearly identical):

```
AUC 0.9483   precision 0.736   recall 0.726   F1 0.731
```

---

## 1. The rubric — `jev_lib2.py`

The rules text lives here, written for a *decision model* to apply (we used Clef, a 27B
model, via the Experiential Labs gateway). Six categories:

`personal_attacks_harassment` · `hazing` · `doxxing` · `outside_game_influence` ·
`antagonization` · `exploits`

The parts that matter, all of which came from developer feedback on real disagreements
rather than guesswork:

- **The targeting test (personal attacks).** Find the *object* of the insult. A violation
  requires a **person** as that object. Same vocabulary, different object:
  `you are fucking terrible` violates, `that vote is fucking terrible` does not.
- **The site glossary.** `dumbtell`, `gt`/`gting`, `hc`, `cc` (counterclaim), `fos`, `meta`,
  `report` (a cop's night result — *not* a threat), `alt`, `noob`… Ordinary game vocabulary
  that otherwise reads as an insult. Also: **names containing rule words** (`Gamethrower11`)
  are names, not accusations.
- **Negated or quoted insults** are not insults (`i didn't call you an idiot`).
- **The recall bias is scoped to substance, not vocabulary.** We do want to err toward
  flagging *borderline rule questions*; we do not want to flag messages merely because they
  contain a swear word.

## 2. Building the corpus

`mafia.db` (repo root, 2.4 GB SQLite) holds ~7,300 games.

```
build_sample.py            -> sample.jsonl        5,000 messages (2,500 uniform + 2,500 keyword-enriched)
build_supplement.py        -> supplement.jsonl      rare GRA slang (suing/suiciding/sue me)
mine_praise.py             -> praise.jsonl          300 praise/banter hard negatives
mine_game.py               -> game.jsonl            300 "game"-mentioning hard negatives
prep_targeted.py           -> targeted.jsonl        targeted buckets: gt / dox / targeted / untargeted
mine_ogi.py                -> ogi_new.jsonl          OGI accusation forms
mine_play.py               -> play_new.jsonl        play-directed vs person-directed profanity
```

Each batch is labelled by `run_batch.py` (batched, resumable, retrying) against the rubric,
producing `decisions_clef*.jsonl`. The `run_*.py` files are thin per-batch wrappers:

```
run_batch.py          the labelling engine (--workers --batch --model)
run_supp.py           supplement
run_praise.py         praise
run_game.py           game
run_targeted.py       targeted
run_ogi.py            ogi
run_playdir.py        play
```

**The hard-negative rounds exist for a reason.** Every one was added because the model
over-flagged a specific, reproducible thing: compliments (`great game`), play criticism
(`that vote is fucking terrible`), and ordinary profanity aimed at nobody.

## 3. Label corrections

Three corrections were applied after looking at real disagreements, and each is a script
here because each changed the training target:

- **`relabel_size.py` + `run_relabel.py`** — the *targeting* fix. Only rows currently
  labelled a violation that contain profanity/insult/game vocabulary can change, because the
  rubric edit can only *remove* violations. 1,466 rows relabelled; **304 labels flipped,
  236 of them `personal_attacks → no_violation`.**
- **`run_gra_merge.py`** — GRA folded into OGI (162 rows).
- **`run_merge_intol.py`** — intolerance folded into abuse (51 rows).

**`merge_and_train.py`** assembles the final corpus (`decisions_final_clef.jsonl`,
9,207 rows) from the seven `decisions_clef*.jsonl` files.

### Why those two categories were removed

Neither is a modelling convenience — both are forced by what a *message* can express:

- **GRA → OGI.** GRA scored F1 **0.357** on its own, indistinguishable from OGI's 0.358, with
  9/16 GRA cases called `no_violation` and 2 called *OGI*. Actually leaving a game is an
  **action**, not a chat message, so a text model can only ever observe the threat or
  announcement of it — which is OGI by definition. Merging was worth **+0.167 F1** on OGI.
- **intolerance → abuse.** It scored F1 **0.000** (5 test / 25 train examples). Slurs are rare
  on this site by design — there's a slur filter, and moderators treat them as a permaban
  matter — so there is no prospect of training it. Folding it into abuse at least makes its
  examples useful, and cost that class nothing (0.776 → 0.772).

## 4. Train and export

```
finetune_cls3.py     -> finetune_cls3_out/    MiniLM-L6, 4 classes, 3 epochs,
                                              grouped split by game (no game in two splits)
export_cls_onnx.py   -> model.int8.onnx       legacy exporter (dynamo=False), fixed batch=1,
                                              then dynamic int8 quantisation
```

Two export notes that cost real time to find:

- The **dynamo exporter splits external weight files**, which breaks int8 shape inference
  (`Inferred shape and existing shape differ in dimension 0`). The legacy exporter emits a
  single file that quantises cleanly.
- The **quantised graph is fixed batch=1** — feed it a batch and it errors on rank.

## 5. Running it — `harness/`

```
serve.js        :8899   the test harness: score a message, see the category and per-class
                        probabilities, compare against the earlier linear models
cls.js          Node runtime: WordPiece tokenizer + int8 ONNX scoring
gameview.js     :8901   whole-game viewer (see below)
eval_server.js  :8900   the hand-check reviewer
```

`cls.js`'s tokenizer is hand-written (the harness has no `transformers` dependency) and was
verified to match HuggingFace to 4 decimal places — a silent mismatch there would corrupt
every number downstream.

**`gameview.js`** renders a whole game with flags marked and a threshold slider, for tuning
sensitivity, with a dropdown to switch between several pre-scored games. It scores with the
**int8 model**, deliberately: it reads `game_views.json`, produced by

```
score_games.py                     -> game_views.json    (a spread: the most toxic games
                                                          that stay readable, plus clean ones)
score_games.py <id> <id> ...       -> game_views.json    (specific games instead)
```

Game ids come straight from `games.id`. Re-run it after adding games and reload the page.

## 6. Evaluation

```
eval_build.py     -> eval_set.jsonl   400 messages from HELD-OUT games, stratified by the
                                      model's confidence (150 flagged / 150 passed / 100 boundary)
eval_server.js                        hand-check reviewer: your call pre-filled with the
                                      model's, one keystroke to accept or override
eval_done.json                        the recorded human judgements - irreplaceable
eval_report.py / eval_rescore.py      metrics against those judgements
eval_final.py                         the final numbers: shipped int8, fitted/clean split,
                                      stratum-weighted, with the trivial baselines
eval_skipped.json                     rows skipped in the reviewer - a separate file on
                                      purpose, so eval_done.json keeps its shape and no
                                      metrics script needs special-casing
roc.py                                ROC + precision/recall-vs-threshold plot
eval_int8.py                          the shipped int8 artifact on the test split
threshold_analysis.py                 precision/recall at each threshold
binary_vs_cls.py                      dedicated binary head vs the 4-class head's binary view
ambiguity_new.py                      agreement by confidence stratum
clean_compare.py / label_or_model.py  the diagnostics that drove the targeting fix
validate_tgt2.py                      rubric sanity check before spending API budget
```

**Why a hand-checked set exists.** Earlier rounds optimised against a small list of cases
chosen by the author, and improved those cases while the aggregate drifted down — fitting the
test. The hand-check set measures against judgments made by one of the site's developers on
real messages instead. **All 400 rows are judged** (399 recorded; index 342 was missed by the
reviewer UI). Rows 0–121 were used to write the targeting rule, so they are reported
separately; **rows 122–399 are the clean validation**.

### What it currently says

Every number here is measured with the **shipped int8 model** and the **current rubric**, on
the 277 clean rows.

| | agreement with the human | precision | recall |
|---|---|---|---|
| **teacher (Clef, current rubric)** | **82.3%** | 0.736 | 0.639 |
| student (int8, p≥0.50) | 81.6% | 0.686 | 0.711 |
| student (int8, p≥0.40) | 80.9% | 0.653 | 0.771 |
| always say OK | 70.0% | — | — |
| always say VIOLATION | — | 0.196 | 1.000 |

**The student is 0.7 points below its teacher.** Distillation has essentially saturated: there
is no meaningful capacity headroom left, and a larger encoder should not be expected to help.
**18% of the set is teacher-versus-human disagreement**, which caps any clone of this teacher
at 82.3%. Of the student's remaining errors, **48% of its false positives and 58% of its false
negatives are rows the teacher gets wrong too** — shared label noise, not model failure.

**What the model is and isn't confident about.** 97% agreement where it is confident a message
is *fine* — "the model says this is fine" is a trustworthy signal, and that is the half that
matters for a flag-on-send tool. But among the messages it flags, confidence separates its
errors not at all: **73%** where it is confident of a violation, **71%** in the uncertain
band. The remaining false positives therefore cannot be removed by moving the threshold.

### Three traps this section has already fallen into

- **Stale teacher labels.** `eval_set.jsonl`'s `clef`/`clef_p` fields were produced by the
  **pre-targeting-fix** rubric. Comparing those labels to the human while scoring a post-fix
  student reported a **4.7-point** distillation gap that is really **0.7**. The stale values
  survive as `clef_prev`/`clef_p_prev` and in `eval_set.pre_refresh.jsonl`. Never join a
  teacher label to a human judgement without checking which rubric produced it.
- **Pooling fitted and clean rows.** Rows 0–121 are the cases the targeting rule was derived
  from and are systematically harder. Report them separately or they misstate the model in
  whichever direction the split happens to fall.
- **Measuring the wrong artifact.** Every headline number must come from the int8 ONNX that
  ships, not the fp32 weights behind it.

### Two properties worth re-checking whenever the judge changes

- **The judge is deterministic.** Re-judging the same 40 items with byte-identical inputs
  reproduced the same verdict on **40/40 rows**, so `run_batch.py` is safe to resume and a
  single label per message is not a noisy draw.
- **Surrounding chat is nearly inert.** Stripping the recent chat changed the verdict on
  **13/277 rows (5%)** and moved agreement from 82.3% to 82.7% — a wash. It can be dropped
  (fewer tokens, simpler prompt) at no measurable cost.

## 7. Known limitations

- **`other` is a bucket, not a class.** Doxxing has 24 examples and lands at `no_violation`
  ~0.87. It needs synthetic data or a non-ML rule.
- **The `you're the ___` frame.** The construction generalises from `you're the worst/dumbest`
  to praise: `UR THE GOAT BRO` scores 0.48 while `he is the goat` scores 0.04. It's the
  frame, not the word — the corpus has 15 `goat` rows and all are non-violating.
- **int8 vs fp32 shifts individual messages by up to 0.40** while leaving aggregate metrics
  essentially unchanged. Tune thresholds against the int8 model, since that's what ships.
- **Precision/recall is a real dial, not a bug.** At 0.35–0.40 the recall bias is intentional
  (a false nudge costs a sender nothing); the cost is that roughly a third of flags are wrong.
