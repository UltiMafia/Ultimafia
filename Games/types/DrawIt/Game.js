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
      { name: "Reveal", length: 8 * 1000 },
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

    // TODO Wave 8 wire achievement grant — replace inline grants with proper
    // listener classes under Games/types/DrawIt/achievements/.
    this.events.on("aboutToFinish", () => {
      if (!this.achievementsAllowed || !this.achievementsAllowed()) return;
      for (const p of this.players) {
        if (!p || !p.user) continue;
        const earned = p.user.achievements || [];
        const played = (p.user.gamesPlayed || 0) + 1;
        // First Stroke — play your first Draw It game.
        if (played >= 1 && !earned.includes("DrawIt1")) {
          if (!p.EarnedAchievements.includes("DrawIt1"))
            p.EarnedAchievements.push("DrawIt1");
        }
        // Skribbler — play 25 Draw It games.
        if (played >= 25 && !earned.includes("DrawIt2")) {
          if (!p.EarnedAchievements.includes("DrawIt2"))
            p.EarnedAchievements.push("DrawIt2");
        }
      }
    });

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
      const fallback = defaultDecks.find((d) => d.id === "default-items");
      this.wordPool = Random.randomizeArray([...fallback.words]);
    }

    await super.start();
  }

  incrementState() {
    super.incrementState();
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
    this.currentStrokes = [];
    this.currentGuessers = [];
    this.currentWord = null;

    if (this.wordPool.length === 0) {
      this.wordPool = Random.randomizeArray([...this.usedWords]);
      this.usedWords = [];
    }

    const optionCount = Math.min(2, this.wordPool.length);
    this.currentWordOptions = this.wordPool.splice(0, optionCount);

    const drawer = this.getCurrentDrawer();
    if (drawer) {
      this.queueAlert(`${drawer.name} is choosing a word…`);
      drawer.queueAlert(
        `Pick a word: ${this.currentWordOptions.join(" / ")}`
      );
    }
  }

  beginDrawState() {
    if (!this.currentWord && this.currentWordOptions.length > 0) {
      this.currentWord = this.currentWordOptions[0];
    }
    this.usedWords.push(...this.currentWordOptions);
    this.currentWordOptions = [];

    const drawer = this.getCurrentDrawer();
    if (drawer) {
      this.queueAlert(`${drawer.name} is drawing!`);
      drawer.queueAlert(`Your word is: ${this.currentWord}`);
    }
  }

  beginRevealState() {
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

    this.queueAlert(`The word was "${this.currentWord}".`);
    if (drawer) {
      if (drawerPts > 0) {
        this.queueAlert(
          `${drawer.name} earned ${drawerPts} points (drawer average).`
        );
      } else {
        this.queueAlert(`${drawer.name} earned no points (no one guessed).`);
      }
    }

    this.drawingHistory.push({
      drawer: drawer ? drawer.name : null,
      word: this.currentWord,
      strokes: [...this.currentStrokes],
    });

    this.currentDrawerIndex += 1;
    if (this.currentDrawerIndex >= this.turnOrder.length) {
      this.currentDrawerIndex = 0;
      this.currentRound += 1;
    }
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
    return [4, 8, 16].includes(+s) ? +s : 8;
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
      this.queueAlert(`${player.name} guessed! (+${pts})`);

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

  checkWinConditions() {
    if (this.currentRound < this.roundAmt) {
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
      round: this.currentRound + 1,
      totalRounds: this.roundAmt,
      drawer: drawer ? drawer.name : null,
      wordLength: this.currentWord ? this.currentWord.length : null,
      guessers: this.currentGuessers.map((p) => p.name),
      scores,
      strokes: this.currentStrokes,
      wordOptions: this.currentWordOptions,
    };

    // Reveal everyone's word at end-of-turn so the WordDisplay banner can show it.
    if (info.name === "Reveal") {
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

  /**
   * Decide what should happen with a chat message before the meeting broadcasts it.
   * Returns an object: { allow: boolean, routeTo?: string }.
   * - allow=false: drop the message silently.
   * - routeTo: change recipients to those of the named meeting.
   */
  preprocessMessage(sender, content, meeting) {
    if (!meeting || !sender) return { allow: true };

    // Only filter the common Village meeting in DrawIt; all other meetings
    // (e.g. SecretChat, Pregame, Spectator) pass through untouched.
    if (meeting.name !== "Village") return { allow: true };

    const stateName = this.getStateName();

    // Drawer cannot talk during Pick/Draw to avoid leaking the word.
    // After Reveal, the round is over — speech is fine.
    if (this.isDrawer(sender)) {
      if (stateName === "Pick" || stateName === "Draw") {
        return { allow: false };
      }
      return { allow: true };
    }

    // Guess detection during the Draw state.
    if (
      stateName === "Draw" &&
      Array.isArray(this.currentGuessers) &&
      !this.currentGuessers.includes(sender)
    ) {
      if (this.handlePotentialGuess(sender, content)) {
        // The guess was correct — handlePotentialGuess already broadcast the
        // alert and added the sender to currentGuessers; suppress the raw chat
        // so the word itself isn't echoed to non-guessers.
        return { allow: false };
      }
    }

    // Once a player has guessed, route their subsequent messages to the
    // SecretChat meeting so non-guessers don't see hints/spoilers.
    if (
      Array.isArray(this.currentGuessers) &&
      this.currentGuessers.includes(sender)
    ) {
      return { allow: true, routeTo: "SecretChat" };
    }

    return { allow: true };
  }
};
