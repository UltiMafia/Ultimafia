const Game = require("../../core/Game");
const Player = require("./Player");
const Random = require("../../../lib/Random");
const models = require("../../../db/models");
const defaultDecks = require("../../../data/wordDecks");
const Winners = require("../../core/Winners");
const { matchesWord } = require("./wordMatch");
const { guesserScore, drawerScore } = require("./scoring");

module.exports = class DrawItGame extends Game {
  constructor(options) {
    super(options);
    this.type = "Draw It";
    this.Player = Player;
    this.disableObituaries = true;

    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      { name: "Pick", length: 10 * 1000 },
      { name: "Draw", length: options.settings.stateLengths["Draw"] },
      { name: "Reveal", length: 5 * 1000 },
    ];

    this.roundAmt = options.settings.roundAmt;
    this.wordDeckId = options.settings.wordDeckId;

    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.turnOrder = [];
    this.wordPool = [];
    this.usedWords = [];
    this.currentWordOptions = [];
    this.currentWord = null;
    this.currentStrokes = [];
    this.currentGuessers = [];
    this.drawingHistory = [];
  }

  async start() {
    this.turnOrder = Random.randomizeArray([...this.players]);

    if (this.wordDeckId) {
      try {
        const deck = await models.WordDeck.findOne({
          id: this.wordDeckId,
          disabled: false,
        }).select("words");
        if (deck && deck.words && deck.words.length >= 1) {
          this.wordPool = Random.randomizeArray([...deck.words]);
        }
      } catch (e) {
        // fall through to fallback
      }
    }
    if (!this.wordPool.length) {
      const fallback = defaultDecks.find((d) => d.id === "default");
      this.wordPool = Random.randomizeArray([...fallback.words]);
    }

    await super.start();
  }

  incrementState() {
    super.incrementState();

    // Reset GuessedWord effects on every state transition — the speech-circle
    // membership only lasts for the state in which the guess happened.
    for (const p of this.players) {
      if (!Array.isArray(p.effects)) continue;
      const toRemove = p.effects.filter(
        (e) => e && e.name === "GuessedWord"
      );
      for (const e of toRemove) e.remove();
    }

    const stateName = this.getStateName();

    if (stateName === "Pick") {
      this.beginPickState();
    } else if (stateName === "Draw") {
      this.beginDrawState();
    } else if (stateName === "Reveal") {
      this.beginRevealState();
    }
  }

  beginPickState() {
    // Reveal is the showdown (previous drawing + word visible). Pick is for
    // word selection on a clean canvas — wipe the previous drawing now.
    // We push a full canvasState (rather than a clearCanvas delta) because
    // canvasState is what the React canvas listens to for authoritative
    // resyncs; deltas can race with state-info prop updates and get
    // silently overwritten.
    this.currentStrokes = [];
    this.broadcastCanvasState();

    this.currentGuessers = [];
    this.currentWord = null;

    // Rotate to the next drawer here (rather than at the end of Reveal) so
    // Reveal still highlights the player who actually drew this turn. The
    // very first Pick of a game leaves currentDrawerIndex at 0 (untouched
    // because there's no previous Reveal to advance from).
    if (this.drawingHistory && this.drawingHistory.length > 0) {
      this.currentDrawerIndex += 1;
      if (this.currentDrawerIndex >= this.turnOrder.length) {
        this.currentDrawerIndex = 0;
        this.currentRound += 1;
      }
    }

    if (this.wordPool.length === 0) {
      this.wordPool = Random.randomizeArray([...this.usedWords]);
      this.usedWords = [];
    }

    const optionCount = Math.min(2, this.wordPool.length);
    this.currentWordOptions = this.wordPool.splice(0, optionCount);

    const drawer = this.getCurrentDrawer();
    if (drawer) {
      this.queueAlert(`${drawer.name} is drawing.`);
    }
  }

  beginDrawState() {
    if (!this.currentWord && this.currentWordOptions.length > 0) {
      this.currentWord = this.currentWordOptions[0];
    }
    this.usedWords.push(...this.currentWordOptions);
    this.currentWordOptions = [];
  }

  beginRevealState() {
    // Showdown: explicitly resync every client's canvas to the final drawing.
    // The drawer's mode flips from "drawer" to "viewer" at this transition,
    // which used to wipe their local canvas via React's useEffect before the
    // state-info prop could repopulate it. Pushing canvasState here makes
    // the drawing reliably visible to everyone for the 5-second showdown.
    this.broadcastCanvasState();

    // Belt-and-braces: re-emit the guesser list so clients render a check
    // mark for the player whose guess triggered the state transition. The
    // mid-Draw drawGuessers event sometimes races the state event on the
    // client and the snapshot carried in extraInfo can lose the last entry.
    this.broadcast(
      "drawGuessers",
      this.currentGuessers.map((p) => p.name)
    );

    const drawer = this.getCurrentDrawer();
    const ranks = this.currentGuessers.map((_, i) => i);
    const drawerPts = drawerScore(ranks);
    if (drawer) drawer.addScore(drawerPts);

    // Crystal Clear — drawer earns max-average (10) on a single turn.
    // TODO Wave 8 wire achievement grant via listener class.
    if (
      drawer &&
      drawerPts === 10 &&
      this.achievementsAllowed &&
      this.achievementsAllowed() &&
      drawer.user &&
      !(drawer.user.achievements || []).includes("DrawIt3") &&
      !drawer.EarnedAchievements.includes("DrawIt3")
    ) {
      drawer.EarnedAchievements.push("DrawIt3");
    }

    const now = Date.now();
    this.broadcast("drawToast", {
      message: `Word: ${this.currentWord}`,
      time: now,
    });
    if (drawer) {
      this.broadcast("drawToast", {
        message:
          drawerPts > 0
            ? `${drawer.name} earned ${drawerPts} (drawer)`
            : `${drawer.name} earned 0 (no one guessed)`,
        time: now + 1,
      });
    }

    // Per-player score events for the inline "+X" popups beside each name in
    // the player list. Kinds: "first" (first guesser, star), "drawer"
    // (drawer, paintbrush), "guesser" (everyone else who guessed).
    const scoreEvents = this.currentGuessers.map((p, i) => ({
      name: p.name,
      delta: guesserScore(i),
      kind: i === 0 ? "first" : "guesser",
    }));
    if (drawer && drawerPts > 0) {
      scoreEvents.push({
        name: drawer.name,
        delta: drawerPts,
        kind: "drawer",
      });
    }
    this.broadcast("drawScoreEvents", scoreEvents);

    this.drawingHistory.push({
      drawer: drawer ? drawer.name : null,
      word: this.currentWord,
      strokes: [...this.currentStrokes],
    });

    // The drawer index is rotated at Pick start, not here. During Reveal
    // we want extraInfo.drawer to still point at the player who actually
    // drew this round (paintbrush stays on them, the last-guesser's check
    // mark isn't masked).
  }

  getCurrentDrawer() {
    return this.turnOrder[this.currentDrawerIndex];
  }

  isDrawer(player) {
    return player === this.getCurrentDrawer();
  }

  handleStrokeEvent(player, eventType, payload) {
    if (this.getStateName() !== "Draw") return;
    if (!this.isDrawer(player)) return;

    if (eventType === "drawStroke") {
      if (!payload.strokeId || typeof payload.strokeId !== "string") return;

      let stroke = this.currentStrokes.find((s) => s.id === payload.strokeId);
      if (!stroke) {
        stroke = {
          id: payload.strokeId.slice(0, 32),
          color: this.sanitizeColor(payload.color),
          size: this.sanitizeSize(payload.size),
          mode: payload.mode === "erase" ? "erase" : "draw",
          points: [],
          sealed: false,
        };
        // Cap total strokes per turn to avoid runaway memory.
        if (this.currentStrokes.length < 500) {
          this.currentStrokes.push(stroke);
        } else {
          return;
        }
      }

      if (Array.isArray(payload.points)) {
        const truncated = payload.points.slice(0, 200);
        const pts = [];
        for (const pair of truncated) {
          if (!Array.isArray(pair) || pair.length < 2) continue;
          const x = +pair[0];
          const y = +pair[1];
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          pts.push([
            Math.max(0, Math.min(800, x)),
            Math.max(0, Math.min(600, y)),
          ]);
        }
        stroke.points.push(...pts);
        this.broadcastStrokeDelta({
          type: "strokePoints",
          strokeId: stroke.id,
          color: stroke.color,
          size: stroke.size,
          mode: stroke.mode,
          points: pts,
        });
      }
    } else if (eventType === "endStroke") {
      const stroke = this.currentStrokes.find((s) => s.id === payload.strokeId);
      if (stroke) stroke.sealed = true;
      this.broadcastStrokeDelta({ type: "endStroke", strokeId: payload.strokeId });
    } else if (eventType === "undo") {
      const last = this.currentStrokes.pop();
      if (last) this.broadcastStrokeDelta({ type: "undo", strokeId: last.id });
    } else if (eventType === "clearCanvas") {
      this.currentStrokes = [];
      this.broadcastStrokeDelta({ type: "clearCanvas" });
    }
  }

  sanitizeColor(c) {
    return /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#000000";
  }

  sanitizeSize(s) {
    return [10, 25, 40].includes(+s) ? +s : 25;
  }

  // Send everyone (players + spectators) the authoritative canvas state.
  // Used at state transitions where strokes change wholesale (Reveal start
  // for the showdown, Pick start to wipe the previous drawing) and for the
  // late-join / reconnect path during Draw.
  broadcastCanvasState() {
    const payload = { strokes: this.currentStrokes };
    for (const p of this.players) {
      if (p && p.send) p.send("canvasState", payload);
    }
    if (Array.isArray(this.spectators)) {
      for (const s of this.spectators) {
        if (s && s.send) s.send("canvasState", payload);
      }
    }
  }

  broadcastStrokeDelta(delta) {
    // Drawer's local canvas already reflects their own pointer events for
    // strokePoints/endStroke, so we skip the drawer for those. But for
    // undo/clearCanvas the drawer's local strokesRef hasn't been mutated, so
    // they need the broadcast too — otherwise their own canvas keeps the
    // strokes after they hit Undo or Clear.
    const includeDrawer =
      delta.type === "undo" || delta.type === "clearCanvas";
    for (const p of this.players) {
      if (this.isDrawer(p) && !includeDrawer) continue;
      if (p.send) p.send("drawDelta", delta);
    }
    // Spectators
    if (Array.isArray(this.spectators)) {
      for (const s of this.spectators) {
        if (s.send) s.send("drawDelta", delta);
      }
    }
  }

  // Available for explicit canvas re-broadcast on reconnect. The standard
  // sendStateInfo() path already includes `strokes` in extraInfo, so explicit
  // invocation is generally not required — kept here as a targeted hook in
  // case a future client wants a discrete `canvasState` event.
  sendCanvasState(player) {
    if (this.getStateName() !== "Draw") return;
    if (player && player.send) {
      player.send("canvasState", { strokes: this.currentStrokes });
    }
  }

  handlePotentialGuess(player, message) {
    if (this.getStateName() !== "Draw") return false;
    if (this.isDrawer(player)) return false;
    if (this.currentGuessers.includes(player)) return false;
    if (!this.currentWord) return false;

    if (matchesWord(message, this.currentWord)) {
      const rank = this.currentGuessers.length;
      this.currentGuessers.push(player);
      // Mark the player as a member of the post-guess speech circle.
      // Subsequent Village messages from them will be filtered to reach only
      // the drawer + other GuessedWord-effect holders (see preprocessMessage).
      // No try/catch: if this throws, scoring would still mark the player as
      // a guesser while speech-filtering wouldn't — the resulting drift is a
      // far worse failure mode (word leaks to non-guessers) than crashing.
      player.giveEffect("GuessedWord");

      // Bullseye — first to guess 5 times in one game.
      // TODO Wave 8 wire achievement grant via listener class.
      if (rank === 0) {
        if (!player._drawItFirstGuesses) player._drawItFirstGuesses = 0;
        player._drawItFirstGuesses += 1;
        if (
          player._drawItFirstGuesses === 5 &&
          this.achievementsAllowed &&
          this.achievementsAllowed() &&
          player.user &&
          !(player.user.achievements || []).includes("DrawIt4") &&
          !player.EarnedAchievements.includes("DrawIt4")
        ) {
          player.EarnedAchievements.push("DrawIt4");
        }
      }

      const pts = guesserScore(rank);
      player.addScore(pts);
      // Private confirmation in the guesser's own chat — the canvas overlay
      // hides the word from non-drawers during Draw, so they can otherwise
      // miss confirmation that they got the answer right.
      player.sendAlert(`You've guessed the word: ${this.currentWord}`);
      this.broadcast("drawToast", {
        message: `${player.name} guessed! (+${pts})`,
        time: Date.now(),
      });
      // Live-update everyone's guesser list so the player-list check marks
      // appear immediately. extraInfo.guessers is only refreshed at state
      // transitions, so without this clients wouldn't see the marks until
      // Reveal.
      this.broadcast(
        "drawGuessers",
        this.currentGuessers.map((p) => p.name)
      );

      const remaining = this.players.filter(
        (p) => !this.isDrawer(p) && !this.currentGuessers.includes(p)
      );
      if (remaining.length === 0) {
        this.gotoNextState && this.gotoNextState();
      }
      return true;
    }
    return false;
  }

  checkAllMeetingsReady() {
    // Draw and Reveal must run for their full timer regardless of meeting state.
    // (Drawing happens via socket events, not meetings, so the engine's default
    // "all meetings ready -> advance" check would skip Draw instantly.)
    const stateName = this.getStateName();
    if (stateName === "Draw" || stateName === "Reveal") return;

    // Pick advances as soon as the drawer's Pick Word meeting is ready (i.e. they
    // voted). If they don't pick within the timer, beginDrawState auto-picks.
    super.checkAllMeetingsReady();
  }

  // Skip the engine's default veg-kick countdown for our states. Pick falls back
  // to auto-pick on timeout; Draw/Reveal must run their full timer; nobody should
  // be kicked for failing to act.
  createNextStateTimer(stateInfo) {
    const name = stateInfo && stateInfo.name;
    if (name === "Pick" || name === "Draw" || name === "Reveal") {
      this.createTimer("main", stateInfo.length, () => this.gotoNextState());
      this.checkAllMeetingsReady();
      return;
    }
    super.createNextStateTimer(stateInfo);
  }

  checkWinConditions() {
    // End detection keys off drawingHistory.length (one push per completed
    // turn, applied inside beginRevealState BEFORE the engine's next
    // checkGameEnd) rather than currentRound. currentRound only ticks at
    // the start of a new round's Pick, which would be too late — the game
    // would otherwise spill into an extra Pick state and display N+1/N.
    const totalTurns = this.roundAmt * this.turnOrder.length;
    if (this.drawingHistory.length < totalTurns) {
      return [false, undefined];
    }

    const winners = new Winners(this);
    let highest = -1;
    let leaders = [];
    for (const p of this.players) {
      const s = p.getScore();
      if (s > highest) {
        highest = s;
        leaders = [p];
      } else if (s === highest) {
        leaders.push(p);
      }
    }
    for (const p of leaders) winners.addPlayer(p, p.name);
    if (leaders.length === 0) winners.addGroup("No one");
    winners.determinePlayers();
    return [true, winners];
  }

  getStateInfo(state) {
    const info = super.getStateInfo(state);
    const drawer = this.getCurrentDrawer();

    const scores = {};
    for (const p of this.players) scores[p.name] = p.getScore();

    info.extraInfo = {
      round: Math.min(this.currentRound + 1, this.roundAmt),
      totalRounds: this.roundAmt,
      drawer: drawer ? drawer.name : null,
      wordLength: this.currentWord ? this.currentWord.length : null,
      guessers: this.currentGuessers.map((p) => p.name),
      scores,
      strokes: this.currentStrokes,
      wordOptions: this.currentWordOptions,
    };

    // Expose currentWord during Draw and Reveal — the drawer's overlay needs
    // it during Draw, and at Reveal everyone sees the answer. Non-drawers'
    // UI deliberately doesn't render the word during Draw.
    if (info.name === "Draw" || info.name === "Reveal") {
      info.extraInfo.currentWord = this.currentWord;
    }

    // For Postgame, also expose the full drawing history for replay.
    if (info.name === "Postgame") {
      info.extraInfo.drawingHistory = this.drawingHistory;
    }

    return info;
  }

  getGameTypeOptions() {
    return {
      roundAmt: this.roundAmt,
      wordDeckId: this.wordDeckId,
    };
  }

  // Returns true if the player currently holds the GuessedWord effect, i.e.
  // they have guessed correctly this round.
  hasGuessedEffect(player) {
    if (!player || !Array.isArray(player.effects)) return false;
    return player.effects.some((e) => e && e.name === "GuessedWord");
  }

  // The current speech circle: drawer + everyone holding GuessedWord. These
  // are the only players who can both read and write the post-guess chatter
  // hidden inside the Village meeting.
  getSpeechCircle() {
    return this.players.filter(
      (p) => this.isDrawer(p) || this.hasGuessedEffect(p)
    );
  }

  /**
   * Decide what should happen with a chat message before the Village meeting
   * broadcasts it. Returns an object: { allow: boolean, recipients?: array }.
   * - allow=false: drop the message silently.
   * - recipients: deliver only to this restricted player list.
   */
  preprocessMessage(sender, content, meeting) {
    if (!meeting || !sender) return { allow: true };

    // Only filter the common Village meeting; all others (Pregame, Spectator)
    // pass through untouched.
    if (meeting.name !== "Village") return { allow: true };

    const stateName = this.getStateName();

    // Drawer can't speak during Pick (no word chosen yet — no speech circle
    // exists, easy to leak). Drop those messages.
    if (this.isDrawer(sender) && stateName === "Pick") {
      return { allow: false };
    }

    // Guess detection during Draw — only for non-drawers who haven't already
    // entered the speech circle.
    if (
      stateName === "Draw" &&
      !this.isDrawer(sender) &&
      !this.hasGuessedEffect(sender)
    ) {
      if (this.handlePotentialGuess(sender, content)) {
        // The guess was correct — alert was broadcast and the GuessedWord
        // effect applied; suppress the raw chat so the word itself isn't
        // echoed to non-guessers.
        return { allow: false };
      }
    }

    // Inside the speech circle (drawer during Draw, or anyone with the
    // GuessedWord effect): the message stays in Village but reaches only the
    // circle. Everyone outside the circle never sees these messages.
    if (
      this.hasGuessedEffect(sender) ||
      (this.isDrawer(sender) && stateName === "Draw")
    ) {
      return { allow: true, recipients: this.getSpeechCircle() };
    }

    return { allow: true };
  }
};
