// Server-side scripted controller for new-user tutorial games.
//
// A tutorial game has exactly one human. Every other seat is a bot that this
// controller drives: it forces roles, posts in-character chat, casts votes and
// advances the game. All teaching is sent to the human as tutorial (system)
// messages, never as a player's chat. At each guided step only the scripted
// action is accepted; the human's chat is parsed leniently and the bots react
// in character when it is off, then a tutorial message steers them back.
//
// Storylines (./storylines) are plain objects:
//   { id, title, userRole, available, intro, states: { "Night1": async (t) => {}, "Day1": ... } }
// Each state handler receives this controller (the "t" API below) and runs
// while that state lasts; it ends with t.advance() or the game ending.

const shortid = require("shortid");
const User = require("../User");
const { TestSocket } = require("../../../lib/sockets");
const chatMatch = require("./chatMatch");
const storylines = require("./storylines");

// Seats in Frontier Justice and the bot that sits in each.
const CAST = {
  cop: { name: "Cassidy", role: "Cop" },
  journalist: { name: "Jesse", role: "Journalist" },
  sheriff: { name: "Wyatt", role: "Sheriff" },
  v1: { name: "Dolly", role: "Villager" },
  v2: { name: "Eli", role: "Villager" },
  v3: { name: "Hattie", role: "Villager" },
  janitor: { name: "Boone", role: "Janitor" },
  lawyer: { name: "Flint", role: "Lawyer:Loyal" },
  mafioso: { name: "Silas", role: "Mafioso" },
};

const SETUP = require("./setup");

const TUTORIAL_COLOR = "#7fb6ff";

class Cancelled extends Error {}

class TutorialController {
  constructor(game, { storylineId, humanUserId, timing } = {}) {
    const story = storylines.get(storylineId);
    if (!story || !story.available)
      throw new Error("That tutorial isn't available yet.");

    this.game = game;
    this.story = story;
    this.humanUserId = humanUserId;
    this.humanSeat = story.userSeat;
    // Delays in ms; tests set these to 0.
    this.timing = Object.assign(
      { chat: 1600, beat: 2500, silence: 45000, maxSilence: 3 },
      timing
    );
    this.cast = {};
    for (const key in CAST) this.cast[key] = Object.assign({ key }, CAST[key]);
    this.stateToken = 0;
    this.pending = null; // the guided action we're waiting on
    this.timeouts = new Set();
    this.log = [];
    this.branch = null;
    this.data = {};
    this.done = false;
  }

  static get CAST() {
    return CAST;
  }

  static setup() {
    return JSON.parse(JSON.stringify(SETUP));
  }

  // --- wiring ------------------------------------------------------------

  async addBots() {
    // userId -> role, applied by orderPlayers() when the game assigns roles.
    const forced = (this.forced = {});
    forced[this.humanUserId] = CAST[this.humanSeat].role;
    const bots = [];
    for (const key in CAST) {
      if (key === this.humanSeat) continue;
      const user = new User({
        id: `tutbot-${key}-${shortid.generate()}`,
        name: CAST[key].name,
        socket: new TestSocket(),
        settings: {},
        isTest: true,
      });
      user.tutorialBot = true;
      forced[user.id] = CAST[key].role;
      bots.push(user);
    }
    for (const user of bots) await this.game.userJoin(user, true);

    this.game.events.on("state", () => this.onState());
    this.game.events.on("aboutToFinish", () => this.onFinish());
  }

  players() {
    const ps = this.game.players;
    return Array.isArray(ps) ? ps : ps.array();
  }

  // Called from Game.assignRoles with the shuffled players: returns them in
  // the order of the roleset's slots so each gets its scripted role.
  orderPlayers(players, roleset) {
    const slots = [];
    for (const roleName in roleset)
      for (let j = 0; j < roleset[roleName]; j++) slots.push(roleName.split(":")[0]);
    const ordered = new Array(slots.length).fill(null);
    const rest = [];
    for (const player of players) {
      const want = this.forced && this.forced[player.user && player.user.id];
      const i = want
        ? slots.findIndex((slot, k) => ordered[k] === null && slot === want.split(":")[0])
        : -1;
      if (i === -1) rest.push(player);
      else ordered[i] = player;
    }
    for (let k = 0; k < ordered.length; k++) if (ordered[k] === null) ordered[k] = rest.shift() || null;
    return ordered.filter(Boolean).concat(rest);
  }

  human() {
    return this.players().find(
      (p) => p.user && p.user.id === this.humanUserId
    );
  }

  player(key) {
    if (key === this.humanSeat) return this.human();
    const name = CAST[key] && CAST[key].name;
    return this.players().find((p) => p.isBot && p.name === name);
  }

  nameOf(key) {
    const p = this.player(key);
    return p ? p.name : CAST[key].name;
  }

  meetingFor(player, meetingName) {
    if (!player) return null;
    return [...this.game.meetings].find(
      (m) => m.name === meetingName && m.members[player.id] && !m.finished
    );
  }

  // --- state loop ----------------------------------------------------------

  onState() {
    if (this.done || this.game.finished) return;
    const token = ++this.stateToken;
    this.cancelPending();
    const info = this.game.getStateInfo();
    const key = String(info.name).replace(/\s+/g, "");
    const handler = this.story.states[key];
    this.log.push(`state ${key}`);
    if (key === "Night1" && this.story.intro) this.guide(this.story.intro);
    if (!handler) return;
    Promise.resolve()
      .then(() => handler(this, token))
      .catch((e) => {
        if (!(e instanceof Cancelled)) this.reportError(e);
      });
  }

  onFinish() {
    this.done = true;
    this.cancelPending();
    const epilogue = this.story.epilogue && this.story.epilogue(this);
    if (epilogue) for (const line of [].concat(epilogue)) this.guide(line);
    this.guide(
      "Tutorial complete! You can replay any tutorial from the Play page whenever you like."
    );
    this.sendOverlay({ text: "Tutorial complete!", done: true });
    if (this.onComplete) this.onComplete(this);
  }

  reportError(e) {
    this.log.push(`error ${e && e.message}`);
    if (this.game.logError) this.game.logError(e);
  }

  checkToken(token) {
    if (token !== undefined && token !== this.stateToken) throw new Cancelled();
    if (this.done || this.game.finished) throw new Cancelled();
  }

  wait(ms, token) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.timeouts.delete(t);
        try {
          this.checkToken(token);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, ms);
      this.timeouts.add(t);
    });
  }

  destroy() {
    this.done = true;
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts.clear();
    this.cancelPending();
  }

  // --- talking to the human -----------------------------------------------

  // A tutorial message: a system alert to the human only, plus the overlay.
  guide(text, overlay) {
    const human = this.human();
    this.log.push(`guide ${text}`);
    if (!human) return;
    this.game.sendAlert(`📘 ${text}`, [human], { color: TUTORIAL_COLOR });
    this.sendOverlay(Object.assign({ text }, overlay || {}));
  }

  sendOverlay(data) {
    const human = this.human();
    if (human) human.send("tutorial", Object.assign({ storyline: this.story.id }, data));
  }

  // --- bot actions --------------------------------------------------------

  async say(key, meetingName, text, token) {
    await this.wait(this.timing.chat, token);
    const player = this.player(key);
    const meeting = this.meetingFor(player, meetingName);
    this.log.push(`say ${key}@${meetingName}: ${text}`);
    if (!meeting || !player.alive) return;
    meeting.speak({ sender: player, content: text });
  }

  // Several lines in order: [[key, text], ...] in one meeting.
  async chat(meetingName, lines, token) {
    for (const [key, text] of lines) await this.say(key, meetingName, text, token);
  }

  vote(key, meetingName, target) {
    const player = this.player(key);
    const meeting = this.meetingFor(player, meetingName);
    if (!meeting || !player.alive) return false;
    const selection = this.selectionFor(target);
    this.log.push(`vote ${key}@${meetingName} -> ${target}`);
    meeting.vote(player, selection);
    return true;
  }

  // target: a cast key, "*" (no one), or a literal option like "Yes".
  selectionFor(target) {
    if (CAST[target]) {
      const p = this.player(target);
      return p ? p.id : target;
    }
    return target;
  }

  // Ends the current state unless something already did.
  async advance(token) {
    await this.wait(this.timing.beat, token);
    this.log.push("advance");
    // No one is kicked for not voting in a tutorial.
    for (const meeting of this.game.meetings) meeting.noVeg = true;
    this.game.gotoNextState();
  }

  // --- guided human actions -------------------------------------------------

  cancelPending() {
    if (!this.pending) return;
    const p = this.pending;
    this.pending = null;
    if (p.timer) clearTimeout(p.timer);
    p.reject(new Cancelled());
  }

  // Wait for the human to vote one of `options` in their meetings.
  // options: [{ id, label, meeting, target }]
  // wrongReactions: [[botKey, line], ...] said in character on a wrong vote.
  choose(options, { text, wrong, wrongReactions, token } = {}) {
    this.checkToken(token);
    return new Promise((resolve, reject) => {
      this.pending = {
        kind: "vote",
        options,
        wrong,
        reactions: { wrongVote: wrongReactions || [] },
        reactionIndex: {},
        meeting: "Village",
        resolve,
        reject,
      };
      const human = this.human();
      // Each choice carries the vote it stands for, so the overlay button can
      // cast it directly.
      this.guide(text, {
        highlight: options.map((o) => ({
          meeting: o.meeting,
          target: o.target && this.targetName(o.target),
        })),
        choices: options.map((o) => {
          const meeting = this.meetingFor(human, o.meeting);
          return {
            id: o.id,
            label: o.label,
            meetingId: meeting ? meeting.id : null,
            selection: this.selectionFor(o.target),
          };
        }),
      });
    });
  }

  expectVote(meeting, target, opts = {}) {
    return this.choose(
      [{ id: "go", label: opts.label || `Vote ${this.targetName(target)}`, meeting, target }],
      opts
    );
  }

  targetName(target) {
    if (CAST[target]) return this.nameOf(target);
    if (target === "*") return "No one";
    return target;
  }

  // Wait for the human to say something matching expect: { role, target (cast
  // key), verdict }. Bots react from `reactions` when it is off or the human
  // stays quiet; reactions[problem] = [[botKey, line], ...] (lines may use
  // {name} for the human's name). `hints[problem]` is the tutorial follow-up.
  expectChat({ meeting, expect, text, example, reactions = {}, hints = {}, token }) {
    this.checkToken(token);
    const names = this.players().filter((p) => p !== this.human()).map((p) => p.name);
    const want = Object.assign({}, expect);
    if (want.target) want.target = this.nameOf(want.target);

    return new Promise((resolve, reject) => {
      const pending = {
        kind: "chat",
        meeting,
        want,
        names,
        reactions,
        hints,
        text,
        silences: 0,
        reactionIndex: {},
        resolve,
        reject,
      };
      this.pending = pending;
      const m = this.meetingFor(this.human(), meeting);
      this.guide(text, {
        highlight: [{ meeting, chat: true }],
        example,
        meetingId: m ? m.id : null,
      });
      this.armSilence(pending);
    });
  }

  armSilence(pending) {
    if (pending.timer) clearTimeout(pending.timer);
    pending.timer = setTimeout(() => {
      if (this.pending !== pending) return;
      pending.silences++;
      this.react(pending, "silence");
      if (pending.silences >= this.timing.maxSilence) {
        // Keep the story moving; the scripted outcome doesn't depend on it.
        this.guide("Let's keep going — the town has moved on.");
        this.pending = null;
        pending.resolve({ ok: false, problem: "silence" });
        return;
      }
      this.guide(pending.hints.silence || pending.text);
      this.armSilence(pending);
    }, this.timing.silence);
  }

  react(pending, problem) {
    const lines = pending.reactions[problem] || pending.reactions.default || [];
    if (!lines.length) return;
    const i = (pending.reactionIndex[problem] || 0) % lines.length;
    pending.reactionIndex[problem] = i + 1;
    const human = this.human();
    const [key, line] = lines[i];
    const player = this.player(key);
    const meeting = this.meetingFor(player, pending.meeting);
    const content = line.replace(/\{name\}/g, human ? human.name : "you");
    this.log.push(`react ${problem} ${key}: ${content}`);
    if (meeting && player.alive) meeting.speak({ sender: player, content });
  }

  // --- hooks called from Player socket handlers ------------------------------

  // Returns false to reject the human's vote.
  allowVote(player, meeting, selection) {
    if (player !== this.human()) return true;
    const p = this.pending;
    if (p && p.kind === "vote") {
      const match = p.options.find(
        (o) => o.meeting === meeting.name && this.selectionFor(o.target) === selection
      );
      if (match) {
        this.pending = null;
        this.log.push(`human chose ${match.id}`);
        // Resolve after the vote lands.
        setImmediate(() => p.resolve(match.id));
        return true;
      }
      this.react(p, "wrongVote");
      if (typeof p.wrong === "function") p.wrong(meeting, selection);
      else
        this.guide(
          p.wrong ||
            `Not that one. Your options: ${p.options
              .map((o) => `${o.label}${o.meeting ? ` (${o.meeting})` : ""}`)
              .join(" or ")}.`
        );
      return false;
    }
    // No vote is expected right now: only free votes the story allows.
    if (this.story.freeVote && this.story.freeVote(this, meeting, selection)) return true;
    this.guide("Hold on — there's nothing to vote on right now. Follow the tutorial steps.");
    return false;
  }

  // A tutorial game has one human; the chat clicks happen here after speaking.
  onHumanSpeak(player, meeting, content) {
    if (player !== this.human()) return;
    const p = this.pending;
    if (!p || p.kind !== "chat" || meeting.name !== p.meeting) return;
    const result = chatMatch.evaluate(content, p.want, p.names);
    this.log.push(`human said "${content}" -> ${result.problem || "ok"}`);
    if (result.ok) {
      this.pending = null;
      clearTimeout(p.timer);
      setImmediate(() => p.resolve(result));
      return;
    }
    // Bots react in character, then the tutorial steers back.
    const reactionDelay = Math.min(this.timing.chat, 1200);
    const t = setTimeout(() => {
      this.timeouts.delete(t);
      if (this.pending !== p) return;
      this.react(p, result.problem);
      this.guide(p.hints[result.problem] || p.text);
      this.armSilence(p);
    }, reactionDelay);
    this.timeouts.add(t);
  }
}

TutorialController.Cancelled = Cancelled;
module.exports = TutorialController;
