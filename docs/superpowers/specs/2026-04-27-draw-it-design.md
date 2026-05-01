# Draw It — Design Spec

**Date:** 2026-04-27
**Status:** Draft (pending user approval)
**Type:** New minigame (game type)

## Summary

A turn-based drawing-and-guessing minigame in the Skribbl/Pictionary tradition. Each turn, one player ("drawer") picks one of two words from a word deck and draws it on a shared canvas; the rest ("guessers") type their guesses in the common chat. Server-side word matching moves correct guessers into a "secret chat" so they can't spoil the answer. Speed-tier scoring rewards fast guessers; the drawer earns the average of their guessers' scores, rewarding clarity over difficulty.

A new "Word Deck" creation system lets users build and share decks of 20–500 single-word nouns, mirroring the existing Anonymous Deck system. Six default decks (Items, Fruits & Veggies, Vehicles, Animals, Body & Faces, Sports & Games) ship in code and seed on startup.

## Goals

- Add Draw It as the 13th supported game type alongside Mafia, Wacky Words, etc.
- Reuse existing minigame infrastructure (Game/Player/Action/Card/Meeting class hierarchy, three-panel desktop layout, host-form pattern, AnonymousDeck-style deck management).
- Ship six default word decks plus a user-creatable Word Deck system.
- Mobile-playable from day one.

## Non-Goals (v1)

- Ranked / competitive / daily-challenge eligibility.
- Fill-bucket tool (cheese for "draw a giant pumpkin" = paint canvas orange).
- Close-guess hint ("Alice is close!" via Levenshtein).
- "Host picks word" alignment (the 2-word offering already gives drawer agency).
- Multi-deck blending or per-player decks.

## Game Mechanics

### Players

- Min: 3 (need ≥2 guessers for the speed tier to matter).
- Max: 12 (canvas chat gets noisy beyond this).

### Turn structure

A *turn* = one player drawing once. A *round* = every player having drawn once. Default 3 rounds.

Turn order is randomized at game start and fixed for the entire game (same order every round).

### State machine

| State | Length | Behavior |
|---|---|---|
| `Pick` | 5s fixed | Drawer sees up to 2 word options. Auto-pick first option on timeout. Other players see "Alice is choosing a word…". |
| `Draw` | 30–180s, default 80s | Drawer draws; guessers type in common chat; correct guesses move guesser to secret chat. State ends early when all non-drawer players have guessed. |
| `Reveal` | 5s fixed | Word and per-turn score deltas displayed. Transitions to next turn's `Pick` (or ends the game). |

After all players have drawn `roundAmt` rounds, `checkWinConditions` returns finished + Winners with the highest-scoring player(s).

### Scoring

Per turn:
- Guesser by guess order: `[10, 8, 6, 4, 2, 1, 1, 1, …]` — 6th onward all earn 1.
- Drawer: `round(average of all guesser scores from this turn)`. Zero guessers → drawer earns 0.

Tied highest score at game end → co-winners.

### Word pool & exhaustion

At game start: `wordPool = shuffle(deck.words)`. Each turn pops up to 2 words.

- **Pool < 2 remaining**: drawer gets only 1 word; UI hides the second slot.
- **Pool empty mid-turn** (deck < `rounds × players`): refill by re-shuffling used words. Edge case; warning prevents this in practice.
- **Host form pre-warning**: computes `rounds × players × 2`. Shows ✅ "X words spare" / ⚠️ "Will fall back to 1-word picks for Y turns" / ⛔ "Deck too small — words will repeat".

### Word matching

Server-side, on every chat message from a non-drawer non-guesser:
- Lowercase, strip punctuation, collapse whitespace on both guess and target.
- Compare exact-equal.
- On match: drop the chat message, post system alert `"<player> guessed!"`, assign speed-tier points, move player to secret chat.

Drawer's chat input is disabled in common chat during `Pick` and `Draw`. Drawer can chat in secret chat (alongside guessers) once their drawing turn ends.

### Secret chat

A second chat room visible in the right panel beneath the common chat (collapsible, header "Already Guessed"). Visible only to:
- Players who have guessed correctly this turn.
- The drawer (after the `Draw` state ends).

Hidden from non-guessers. Spectators see common chat only.

### Player flow edge cases

- **Mid-game leave during own draw turn**: turn ends immediately. Drawer earns 0; guessers keep what they earned.
- **Mid-game leave before own draw turn**: skipped in turn order.
- **Reconnect**: server sends current `strokes[]` array as `canvasState`; client redraws.

## Architecture

### Server-side (Node.js)

New directory `Games/types/DrawIt/`, mirroring `Games/types/WackyWords/`:

```
Games/types/DrawIt/
├── Game.js              # extends core Game; turn/round loop, word pool, strokes, scoring
├── Player.js            # thin subclass
├── Action.js            # thin subclass
├── Meeting.js           # thin subclass
├── Item.js              # thin subclass
├── Winners.js           # thin subclass
├── roles/
│   ├── Town/
│   │   └── Player.js    # single role, alignment "Town"
│   └── cards/
│       └── TownCore.js  # binds per-state meetings (Pick/Draw)
└── data/
    └── (none — words come from WordDeck)
```

`Game.js` holds:
- `turnOrder: Player[]` — fixed shuffle of players
- `currentDrawerIndex: number`
- `currentRound: number`
- `wordPool: string[]` — shuffled remaining words
- `currentWordOptions: string[]` — 1 or 2 words for the current Pick
- `currentWord: string | null`
- `currentStrokes: Stroke[]` — replayable canvas state
- `currentGuessers: Player[]` — in guess order
- `drawingHistory: Stroke[][]` — saved per turn for postgame replay

### Client-side (React)

New files:
- `react_main/src/pages/Game/DrawItGame.jsx` — three-panel layout
- `react_main/src/pages/Play/CreateSetup/CreateDrawItSetup.jsx` — setup-creator form
- `react_main/src/components/gameTypeHostForms/HostDrawIt.js` — host form
- `react_main/src/pages/Learn/gameTypes/LearnDrawIt.jsx` — rules page
- `react_main/src/pages/Community/Decks/WordDeck*.jsx` — deck list & editor
- `react_main/src/images/game_icons/DrawIt.png` — icon (placeholder)

### Three-panel desktop layout

```
┌──────────────┬─────────────────────────┬──────────────┐
│ Player List  │   Canvas (800×600)      │ Common Chat  │
│  + Score     │   ┌──────────────────┐  │              │
│  • Alice 24  │   │                  │  │  > you all   │
│  • Bob   18  │   │  drawer's strokes│  │              │
│  • Carol 12  │   │                  │  │              │
│  •  …        │   └──────────────────┘  ├──────────────┤
│              │   [palette] [3 brushes] │ Already      │
│  Round 2/3   │   [eraser][clear][undo] │ Guessed (▼)  │
│  Turn: Bob   │   Word: _ _ _ _ (4)     │  collapsible │
└──────────────┴─────────────────────────┴──────────────┘
```

Mobile: canvas scales to viewport width preserving 4:3 ratio; tool tray collapses into pop-out drawer; right panel becomes bottom-sheet.

## Drawing canvas

### Stroke model

A stroke is `{id, color, size, mode: "draw" | "erase", points: [[x, y], ...]}`. Coordinates are logical (0–800 / 0–600), not screen pixels.

### Transmission

Vector strokes over Socket.io:
- `pointermove` (covers mouse + touch + stylus) batches points at ~30Hz; client emits `drawStroke {strokeId, points: [...newPoints], color, size, mode}`.
- Server appends to `currentStrokes[strokeId]` and rebroadcasts to non-drawer connections.
- `pointerup` emits `endStroke` (server seals stroke).
- `clear`, `undo` are their own events; server rebroadcasts a delta (`{type: "undo", strokeId}`).
- On reconnect / late-spectator join: server sends current `strokes[]` snapshot as `canvasState`.

`currentStrokes` resets at the top of each `Pick`. Sealed strokes for the just-finished turn append to `drawingHistory[turnIndex]` for postgame replay.

### Tools (drawer-only widgets)

- 12-color palette (rainbow + black/white/gray/brown).
- 3 brush sizes: small 4px, medium 8px, large 16px (logical).
- Eraser toggle (paints with white at chosen size).
- Clear button — confirm modal, wipes `currentStrokes`, emits `clearCanvas`.
- Undo — pops last sealed stroke.
- No fill bucket.

### Anti-cheese / sanitization

Server-side: stroke points are clamped to 0–800 / 0–600; oversized point arrays per event are truncated; max stroke count per turn enforced; emit-rate-limited per drawer.

## Word Deck system

### Mongoose schema (`db/schemas.js`)

```js
const wordDeck = new mongoose.Schema({
  id: { type: String, index: true },               // shortid
  name: String,
  creator: { type: ObjectId, ref: "User" },        // null for default decks
  words: [String],
  voteCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  coverPhoto: String,
  isDefault: { type: Boolean, default: false },    // true = system deck, can't be edited/deleted
});
```

User schema: add `wordDecks: [ObjectId(WordDeck)]` and `itemsOwned.wordDeck: { type: Number, default: 0 }`.

### Slot economy

- Shop item "Word Deck Slot" — 100 coins each, max 5 owned per user.
- New constant `maxOwnedWordDecks = 5`.
- `itemsOwned.wordDeck` tracks purchased slots, `wordDecks.length` tracks used slots, identical pattern to `anonymousDeck`.

### Default decks (seeded on startup)

Six bundled in `data/wordDecks.js`, upserted by `id` with `isDefault: true, creator: null, featured: true`. Cannot be edited or disabled by users (server-side guard on the routes).

- **Items** (~80): chair, lamp, cup, key, hammer, bottle, …
- **Fruits & Veggies** (~60): apple, banana, carrot, broccoli, …
- **Vehicles** (~50): car, plane, bicycle, train, scooter, …
- **Animals** (~100): dog, cat, elephant, octopus, owl, …
- **Body & Faces** (~50): nose, hand, eye, smile, hair, …
- **Sports & Games** (~50): football, chess, dart, racquet, …

### Word constraints

- 20–500 words per deck.
- Single-word only (no spaces).
- 2–30 chars; ASCII letters and hyphen only.
- Lowercased and de-duped on save.

### Routes (`routes/wordDeck.js`)

Cribbed from `routes/anonymousDeck.js`. Endpoints: `POST /create`, `POST /delete`, `POST /coverPhoto`, `GET /featured`, `GET /popular`, `GET /search`, `GET /yours`, `GET /:id`, `GET /slots/info`, `POST /disable` (mod), `POST /feature` (mod). Default decks reject edit/delete with 403.

## Settings & registration

### `data/constants.js` updates

- `gameTypes`: append `"Draw It"`
- `alignments["Draw It"] = ["Town"]`
- `startStates["Draw It"] = ["Pick"]`
- `configurableStates["Draw It"] = { Draw: { min: 30_000, max: 180_000, default: 80_000 } }`

### Host form fields

- `wordDeckId` — deck picker (required), searches own + featured + default decks.
- `roundAmt` — 1–10, default 3.
- `stateLengths.Draw` — 30/60/80/120/180s, default 80s.
- `stateLengths.Pick` — 5s fixed (not exposed).
- `stateLengths.Reveal` — 5s fixed (not exposed).

## Postgame

Drawing replay viewer per turn: renders saved `drawingHistory[turnIndex]` strokes with play/pause/scrub controls. Same Game.jsx canvas component, postgame-mode flag.

## Achievements (starter set)

- "First Stroke" — play 1 Draw It game.
- "Skribbler" — play 25 Draw It games.
- "Crystal Clear" — drawer earns max-average (10) on a turn (everyone guesses immediately).
- "Bullseye" — first to guess 5 times in one game.

## Testing

`test/Games/DrawIt/` — Mocha + Chai, following the existing harness (`makeGame`, `getRoles`, etc.):
- Turn rotation across rounds.
- Scoring math (speed tier, drawer average, zero-guesser case).
- Word matching: case-insensitive, punctuation-stripped, exact-equal only.
- Word pool exhaustion fallback (1-word turns when pool low).
- Mid-turn leaver ends the turn early.
- Secret-chat visibility rules.

## File checklist

### Backend (new)
- `Games/types/DrawIt/Game.js`
- `Games/types/DrawIt/Player.js`
- `Games/types/DrawIt/Action.js`
- `Games/types/DrawIt/Meeting.js`
- `Games/types/DrawIt/Item.js`
- `Games/types/DrawIt/Winners.js`
- `Games/types/DrawIt/roles/Town/Player.js`
- `Games/types/DrawIt/roles/cards/TownCore.js`
- `data/wordDecks.js`
- `routes/wordDeck.js`

### Backend (edits)
- `data/constants.js` — register game type, states, alignments, slots constant.
- `db/schemas.js` — add `wordDeck` schema, `itemsOwned.wordDeck`, `User.wordDecks` field.
- `db/models.js` — register `WordDeck` model.
- `routes/index.js` — mount `/wordDeck` router.
- Server startup — seed default word decks.
- Shop logic — add Word Deck Slot purchase item.

### Frontend (new)
- `react_main/src/pages/Game/DrawItGame.jsx`
- `react_main/src/pages/Play/CreateSetup/CreateDrawItSetup.jsx`
- `react_main/src/components/gameTypeHostForms/HostDrawIt.js`
- `react_main/src/pages/Learn/gameTypes/LearnDrawIt.jsx`
- `react_main/src/pages/Community/Decks/WordDeckList.jsx`
- `react_main/src/pages/Community/Decks/WordDeckEditor.jsx`
- `react_main/src/images/game_icons/DrawIt.png` — placeholder icon.

### Frontend (edits)
- Game type registry / routing — register Draw It page and setup creator.
- Shop UI — surface Word Deck Slot purchase.
- Community/Decks navigation — add Word Decks tab.

### Tests (new)
- `test/Games/DrawIt/basic.js`
- `test/Games/DrawIt/scoring.js`
- `test/Games/DrawIt/wordPool.js`
- `test/Games/DrawIt/leaver.js`

## Open Questions

None blocking. Edge cases like real-time stroke compression and very-large-deck pagination can be addressed during implementation if they surface.
