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

// Seats in Frontier Justice and the bot that sits in each (live-player
// cosmetics: Games/core/tutorial/cast.js).
const { CAST, buildCast } = require("./cast");

const SETUP = require("./setup");

const TUTORIAL_COLOR = "#7fb6ff";

const PAUSE_NOTE =
  "⏸ The clock is paused in this tutorial: a phase only ends when you click Continue in this box. In a real game time does NOT stop. Every phase ends on a timer, so act and read quickly.";

// One-time tour of the real game screen on the first Night and Day. Each
// step highlights that part of the UI.
const WALKTHROUGH = {
  night: [
    ["players", "Screen tour: this is the player list, everyone in the game. When someone dies they're marked dead and their role is usually shown."],
    ["actions", "Your actions live in the Actions panel: on a phone it's the Actions tab in the bottom bar, on a computer it's on the right. Each box is one action. Open it and pick a player."],
    ["chat", "This is the chat. At night only teams like the Mafia can talk. Private results (like a Cop's report) show up here as system messages when the day starts."],
  ],
  day: [
    ["chat", "Daytime: everyone talks in the town chat. Type in the chat box at the bottom. That's where you claim your role and share info."],
    ["actions", "The Village box in Actions is the condemn vote. Whoever has the most votes when the day ends is condemned. You can change your vote until then."],
  ],
};

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
      { chat: 1600, beat: 2500, silence: 45000, idle: 25000, vote: [500, 1200], fastVote: [200, 500], autoContinue: false },
      timing
    );
    // Eight live-player bots + the human. Roster assignment depends on seat.
    this.cast = buildCast(this.humanSeat);
    this.stateToken = 0;
    this.pending = null; // the guided action we're waiting on
    this.steps = []; // tutorial messages waiting for Next
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
    forced[this.humanUserId] = this.cast[this.humanSeat].role;
    // Bots are found by their user id, never by display name: the player may
    // share a bot's name (see humanJoined).
    const botIds = (this.botIds = {});
    const bots = [];
    for (const key in this.cast) {
      if (key === this.humanSeat) continue;
      const seat = this.cast[key];
      const settings = {};
      if (seat.nameColor) settings.nameColor = seat.nameColor;
      if (seat.textColor) settings.textColor = seat.textColor;
      // Z's flex assets (Sheriff tutorial): small :ez: :clap: emotes + big Jerry sticker.
      if (seat.flexAssets) {
        settings.customEmotes = {
          ":ez:": {
            name: "ez",
            path: "images/tutorial-bots/ez.webp",
          },
          ":clap:": {
            name: "clap",
            path: "images/tutorial-bots/clap.webp",
          },
        };
        settings.customStickers = {
          ":jerry:": {
            name: "jerry",
            path: "images/tutorial-bots/jerry-laugh.gif",
          },
        };
      }
      const user = new User({
        id: `tutbot-${key}-${shortid.generate()}`,
        name: seat.name,
        avatar: seat.avatar || false,
        socket: new TestSocket(),
        settings,
        isTest: true,
      });
      user.tutorialBot = true;
      botIds[key] = user.id;
      forced[user.id] = seat.role;
      bots.push(user);
    }
    for (const user of bots) await this.game.userJoin(user, true);

    // userJoin logs and swallows its errors, so check that every bot is
    // actually seated before the game is handed to the player.
    const seated = this.game.players.filter(
      (p) => p.user && p.user.tutorialBot
    ).length;
    if (seated !== bots.length)
      throw new Error(
        `Only ${seated} of ${bots.length} tutorial bots joined game ${this.game.id}.`
      );

    this.game.events.on("roleAssigned", (p) => this.restrictLitigate(p));
    this.game.events.on("state", () => this.onState());
    this.game.events.on("aboutToFinish", () => this.onFinish());
  }

  // Loyal Lawyer (human seat): Litigate lists only living Mafia teammates, so
  // town players never show up as targets (instead of Loyal blocking later).
  restrictLitigate(player) {
    if (!this.story.litigateTargets || !player || player !== this.human()) return;
    const mtg = player.role && player.role.meetings && player.role.meetings.Litigate;
    if (!mtg) return;
    mtg.targets = { include: ["Mafia"], exclude: ["dead", "self"] };
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
    const id = this.botIds && this.botIds[key];
    if (!id) return undefined;
    return this.players().find((p) => p.user && p.user.id === id);
  }

  // The player took their seat. No bot may share their name (in any case):
  // two "Z"s in the player list, a vote box or the story text can't be told
  // apart, and picking the wrong one fails the step. A bot with the player's
  // name is shown as "<name>bot" (or "<name>bot2", ...) for the whole game;
  // every step names bots through nameOf(), so the text follows. Runs before
  // the player is sent the player list.
  humanJoined(player) {
    if (!player || !player.user || player.user.id !== this.humanUserId) return;
    const norm = (n) => String(n || "").trim().toLowerCase();
    const taken = () => new Set(this.players().map((p) => norm(p.name)));
    for (const key in this.botIds || {}) {
      const bot = this.player(key);
      if (!bot || norm(bot.name) !== norm(player.name)) continue;
      const base = `${this.cast[key].name}bot`;
      let name = base;
      for (let n = 2; taken().has(norm(name)); n++) name = `${base}${n}`;
      this.log.push(`renamed ${key} ${bot.name} -> ${name}`);
      bot.name = name;
      if (bot.user) bot.user.name = name;
    }
  }

  nameOf(key) {
    if (key === this.humanSeat) {
      const h = this.human();
      return h ? h.name : "you";
    }
    const p = this.player(key);
    return p ? p.name : (this.cast[key] && this.cast[key].name);
  }

  // All eight bot names in this game, as shown (for assertions / matching).
  botNames() {
    return Object.keys(this.botIds || {}).map((key) => this.nameOf(key));
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
    // Before this state's meetings are made: keep the Loyal Litigate list
    // restricted to Mafia teammates.
    this.restrictLitigate(this.human());
    this.cancelPending();
    const info = this.game.getStateInfo();
    const key = String(info.name).replace(/\s+/g, "");
    const handler = this.story.states[key];
    this.log.push(`state ${key}`);
    this.phase = key;
    this.setContinue(false);
    if (key === "Night1") {
      if (this.story.intro) this.guide(this.story.intro);
      this.guide(PAUSE_NOTE);
      for (const [ui, text] of WALKTHROUGH.night) this.guide(text, { highlight: [{ ui }] });
    }
    if (key === "Day1") for (const [ui, text] of WALKTHROUGH.day) this.guide(text, { highlight: [{ ui }] });
    if (!handler) {
      this.advance(token).catch(() => {});
      return;
    }
    Promise.resolve()
      .then(() => handler(this, token))
      .catch((e) => {
        if (!(e instanceof Cancelled)) this.reportError(e);
      });
  }

  onFinish() {
    if (this.failed) return;
    this.done = true;
    this.cancelPending();
    this.setContinue(false);
    const epilogue = this.story.epilogue && this.story.epilogue(this);
    if (epilogue) for (const line of [].concat(epilogue)) this.guide(line);
    this.guide(
      "Tutorial complete! You can replay any tutorial from the Play page whenever you like.",
      { done: true }
    );
    if (this.onComplete) this.onComplete(this);
  }

  reportError(e) {
    this.log.push(`error ${e && e.message}`);
    if (this.logError) this.logError(e);
    // Lets a client (and the live smoke test) see that the script failed.
    const human = this.human();
    if (human) human.send("tutorialError", String((e && e.message) || e));
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

  // Tutorial messages are steps in a queue. The box shows the first one; the
  // player clicks Next to move on (never on a timer). A step that asks for an
  // action (choices) can't be skipped with Next: answering it moves on. Each
  // step's system alert goes to chat when the step is shown.
  guide(text, overlay) {
    this.log.push(`guide ${text}`);
    const p = this.pending;
    const head = this.steps[0];
    // A hint while a question is on screen rewrites that question's text.
    if (!overlay && p && head && head.pending === p) {
      head.text = text;
      this.showHead(true);
      return;
    }
    this.steps.push(Object.assign({ text }, overlay || {}));
    if (this.steps.length === 1) this.showHead(true);
    else this.sendOverlay(this.steps[0]);
  }

  showHead(alert) {
    const head = this.steps[0];
    const human = this.human();
    if (!head || !human) return;
    if (alert && head.text && !head.alerted) {
      head.alerted = true;
      this.game.sendAlert(`📘 ${head.text}`, [human], { color: TUTORIAL_COLOR });
    }
    this.sendOverlay(head);
  }

  sendOverlay(step) {
    const human = this.human();
    if (!human || !step) return;
    const data = {
      storyline: this.story.id,
      text: step.text,
      highlight: step.highlight,
      examples: step.examples,
      action: !!step.pending,
      done: step.done,
      failed: step.failed,
      hasNext: this.canNext(),
      canContinue: this.continueOpen(),
    };
    human.send("tutorial", data);
    if (this.timing.autoNext && data.hasNext) setImmediate(() => this.onNext(human));
  }

  // A reconnect, refresh or remount of the game page: send the current step,
  // its Next/Continue state and highlights again. No alert is repeated.
  resync(player) {
    if (!player || player !== this.human()) return false;
    this.sendPhase();
    if (this.steps[0]) this.sendOverlay(this.steps[0]);
    return true;
  }

  canNext() {
    const head = this.steps[0];
    return !!head && !head.pending && !head.done && this.steps.length > 1;
  }

  // Continue only once every message has been read and nothing is pending.
  continueOpen() {
    const head = this.steps[0];
    return !!this.canContinue && this.steps.length <= 1 && !(head && (head.pending || head.done));
  }

  onNext(player) {
    if (player !== this.human() || !this.canNext()) {
      this.log.push("next rejected");
      return false;
    }
    this.steps.shift();
    this.showHead(true);
    this.sendPhase();
    return true;
  }

  // The Continue button: disabled until the phase's required steps are done.
  setContinue(on) {
    this.canContinue = !!on;
    this.sendPhase();
    if (this.steps[0]) this.sendOverlay(this.steps[0]);
  }

  sendPhase() {
    const human = this.human();
    const open = this.continueOpen();
    if (human) human.send("tutorialPhase", { phase: this.phase, canContinue: open });
    if (open && this.timing.autoContinue) setImmediate(() => this.onContinue(this.human()));
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

  // Z's flex when the Sheriff shoots Gauss (fake Cop): :ez: :clap: (small
  // emotes, one message), then "LMAO", then the Jerry GIF as a big sticker.
  async ezClapFlex(token, meetingName = "Village") {
    const gap = Math.min(this.timing.chat || 400, 450);
    await this.say("cop", meetingName, ":ez: :clap:", token);
    await this.wait(gap, token);
    await this.say("cop", meetingName, "LMAO", token);
    await this.wait(gap, token);
    await this.say("cop", meetingName, ":jerry:", token);
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

  // Town votes land one at a time in a random order, a second or two apart
  // (about 5+ seconds for a full town), like real players.
  // entries: ["key", ...] (all vote `target`) or [["key", target], ...].
  // fast: the target is confirmed Mafia, so the town piles on (0.2-0.5 s).
  async townVote(entries, target, token, meetingName = "Village", { fast = false } = {}) {
    const list = entries
      .map((e) => (Array.isArray(e) ? e : [e, target]))
      .filter(([key]) => {
        const p = this.player(key);
        return p && p.alive && p !== this.human();
      });
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const [lo, hi] = fast ? this.timing.fastVote : this.timing.vote;
    for (const [key, tgt] of list) {
      await this.wait(lo + Math.random() * (hi - lo), token);
      if (this.vote(key, meetingName, tgt)) (this.voteTimes = this.voteTimes || []).push(Date.now());
    }
  }

  // Every living bot casts a Village (or other) vote before the condemn
  // proceeds, including the player being condemned. dissenters: { key: otherTarget }
  // lets a few vote elsewhere for flavor; everyone still votes.
  async everyoneVotes(target, token, meetingName = "Village", { fast = false, dissenters = {} } = {}) {
    const entries = [];
    for (const key in this.cast) {
      if (key === this.humanSeat) continue;
      const p = this.player(key);
      if (!p || !p.alive) continue;
      entries.push([key, dissenters[key] || target]);
    }
    await this.townVote(entries, null, token, meetingName, { fast });
  }

  // The most recently killed bot (e.g. by the Sheriff's gun): { key, name, role }.
  lastShot() {
    for (const key in this.cast) {
      if (key === this.humanSeat) continue;
      const p = this.player(key);
      if (p && !p.alive && !(this.data.seenDead || []).includes(key)) {
        (this.data.seenDead = this.data.seenDead || []).push(key);
        const role = p.role ? p.role.name : this.cast[key].role.split(":")[0];
        return { key, name: p.name, role };
      }
    }
    return null;
  }

  // target: a cast key, "*" (no one), or a literal option like "Yes".
  selectionFor(target) {
    if (CAST[target]) {
      const p = this.player(target);
      return p ? p.id : target;
    }
    return target;
  }

  // Everything required this phase is done: enable Continue and wait for the
  // player to click it. The phase never ends on a timer in a tutorial.
  async advance(token, text) {
    await this.wait(this.timing.beat, token);
    this.log.push("ready");
    this.setContinue(true);
    this.guide(
      text ||
        "That's everything for this phase. Read the chat, then click Continue in this box when you're ready."
    );
  }

  onContinue(player) {
    if (player !== this.human() || this.done || this.game.finished) return false;
    if (!this.continueOpen()) {
      this.log.push("continue rejected");
      return false;
    }
    this.canContinue = false;
    this.log.push("advance");
    // No one is kicked for not voting in a tutorial.
    for (const meeting of this.game.meetings) meeting.noVeg = true;
    this.game.gotoNextState();
    return true;
  }

  // A bad choice that ends this run: say why, then offer a retry.
  fail(lesson) {
    this.failed = true;
    this.log.push(`fail ${lesson}`);
    this.cancelPending();
    this.setContinue(false);
    this.steps = [];
    this.guide(`✗ ${lesson}`);
    this.guide("This run is over. Click Try again to replay this tutorial and pick a different option.", { done: true, failed: true });
    this.done = true;
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts.clear();
    throw new Cancelled();
  }

  // --- guided human actions -------------------------------------------------

  cancelPending() {
    if (!this.pending) return;
    const p = this.pending;
    this.pending = null;
    if (p.timer) clearTimeout(p.timer);
    const i = this.steps.findIndex((st) => st.pending === p);
    if (i !== -1) this.steps.splice(i, 1);
    p.reject(new Cancelled());
  }

  // Multiple choice. options: [{ id, label, say?: text, vote?: { meeting,
  // target }, bad?: { lesson, reactions?: [[key, line]], consequence?:
  // async (t, token) => {}, fatal?: bool } }]. Each button sends its chat line
  // or casts its vote for the player. A good option resolves with its id; a
  // bad one plays its consequence and lesson, then either ends the run (fatal)
  // or asks again. Voting directly in the meeting, or typing a line that
  // matches `want` (chatMatch), counts the same as the button.
  async decide(spec) {
    for (;;) {
      const id = await this.ask(spec);
      const opt = spec.options.find((o) => o.id === id);
      if (!opt || !opt.bad) return id;
      const bad = opt.bad;
      this.log.push(`bad ${id}`);
      if (bad.reactions)
        await this.chat(spec.meeting || "Village", bad.reactions.map(([k, l]) => [k, this.fill(l)]), spec.token);
      if (bad.consequence) await bad.consequence(this, spec.token);
      if (bad.fatal) return this.fail(bad.lesson);
      this.guide(`✗ ${bad.lesson}`);
      spec = Object.assign({}, spec, { options: spec.options.filter((o) => o !== opt) });
    }
  }

  fill(line) {
    const human = this.human();
    return String(line).replace(/\{name\}/g, human ? human.name : "you");
  }

  // A question answered only through the real game UI: a vote in a meeting
  // (highlighted for the player) or a line typed in chat. options: { id,
  // vote?: { meeting, target } (target "*other" = any other choice there),
  // say?: example line (good chat option), sample?/when?: a bad chat option
  // detected by when(text, result) }.
  ask({ text, options, meeting = "Village", want, match, reactions = {}, hints = {}, wrong, wrongReactions, idleHint, token }) {
    this.checkToken(token);
    const names = this.players().filter((p) => p !== this.human()).map((p) => p.name);
    const w = want && Object.assign({}, want);
    if (w && w.target) w.target = this.nameOf(w.target);
    return new Promise((resolve, reject) => {
      const pending = {
        kind: "decide",
        options,
        meeting,
        want: w,
        match,
        names,
        reactions: Object.assign({ wrongVote: wrongReactions || [] }, reactions),
        hints,
        wrong,
        text,
        idleHint,
        silences: 0,
        reactionIndex: {},
        resolve,
        reject,
      };
      this.pending = pending;
      this.log.push(`guide ${text}`);
      const highlight = [];
      for (const o of options)
        if (o.vote && !highlight.some((h) => h.meeting === o.vote.meeting && h.target === this.targetName(o.vote.target)))
          highlight.push({
            meeting: o.vote.meeting,
            target: o.vote.target === "*other" ? null : this.targetName(o.vote.target),
          });
      if (w || options.some((o) => o.say)) highlight.push({ chat: true });
      const examples = options.filter((o) => o.say).map((o) => o.say);
      this.steps.push({ text, pending, highlight, examples: examples.length ? examples : undefined });
      if (this.steps.length === 1) this.showHead(true);
      else this.sendOverlay(this.steps[0]);
      this.armSilence(pending);
    });
  }

  settle(p, id) {
    if (this.pending !== p) return;
    this.pending = null;
    if (p.timer) clearTimeout(p.timer);
    this.log.push(`human chose ${id}`);
    const i = this.steps.findIndex((st) => st.pending === p);
    if (i !== -1) this.steps.splice(i, 1);
    if (i === 0) this.showHead(true);
    this.sendPhase();
    setImmediate(() => p.resolve(id));
  }

  expectVote(meeting, target, opts = {}) {
    return this.decide(
      Object.assign({}, opts, {
        options: [
          { id: "go", vote: { meeting, target } },
        ].concat(opts.also || []),
      })
    );
  }

  targetName(target) {
    if (CAST[target]) return this.nameOf(target);
    if (target === "*") return "No one";
    return target;
  }

  // A claim the player types in the real chat. The example is shown as plain
  // text; `also` holds bad options (votes, or chat lines detected by when()).
  expectChat({ meeting, expect, text, example, reactions = {}, hints = {}, token, also = [], match }) {
    return this.decide({
      token,
      meeting,
      want: expect,
      match,
      text,
      reactions,
      hints,
      options: [{ id: "go", say: example }].concat(also),
    });
  }

  // Idle hints: while a question is on screen and nothing happens, the bots
  // nudge in character (chat questions) and the box adds a pointer to the
  // real control. It never answers for the player.
  armSilence(pending) {
    if (pending.timer) clearTimeout(pending.timer);
    const chatOnly = !!pending.want && !pending.options.some((o) => o.vote);
    pending.timer = setTimeout(() => {
      if (this.pending !== pending) return;
      if (!(this.steps[0] && this.steps[0].pending === pending)) return this.armSilence(pending);
      pending.silences++;
      if (chatOnly) this.react(pending, "silence");
      const hint = chatOnly
        ? pending.hints.silence ||
          "Type your claim in the chat box at the bottom of the chat (on a phone, open the Chat tab first)."
        : pending.idleHint ||
          "Still looking? Open the Actions tab (on a phone it's in the bottom bar; on a computer the actions are on the right), find the highlighted box and pick the highlighted player.";
      this.guide(`${pending.text} (${hint})`);
      this.armSilence(pending);
    }, chatOnly ? this.timing.silence : this.timing.idle);
  }

  react(pending, problem) {
    const lines = pending.reactions[problem] || pending.reactions.default || [];
    if (!lines.length) return;
    const i = (pending.reactionIndex[problem] || 0) % lines.length;
    pending.reactionIndex[problem] = i + 1;
    const [key, line] = lines[i];
    const player = this.player(key);
    const meeting = this.meetingFor(player, pending.meeting);
    const content = this.fill(line);
    this.log.push(`react ${problem} ${key}: ${content}`);
    if (meeting && player.alive) meeting.speak({ sender: player, content });
  }

  // --- hooks called from Player socket handlers ------------------------------

  // Returns false to reject the human's vote.
  allowVote(player, meeting, selection) {
    if (player !== this.human()) return true;
    const p = this.pending;
    if (p && !(this.steps[0] && this.steps[0].pending === p)) {
      const h = this.human();
      if (h) this.game.sendAlert("📘 Read the tutorial box and click Next first.", [h], { color: TUTORIAL_COLOR });
      return false;
    }
    if (p) {
      const match =
        p.options.find(
          (o) => o.vote && o.vote.meeting === meeting.name && o.vote.target !== "*other" && this.selectionFor(o.vote.target) === selection
        ) || p.options.find((o) => o.vote && o.vote.meeting === meeting.name && o.vote.target === "*other");
      if (match) {
        this.settle(p, match.id);
        return true;
      }
      this.react(p, "wrongVote");
      if (typeof p.wrong === "function") p.wrong(meeting, selection);
      else
        this.guide(
          p.wrong || `Not that one. Follow the tutorial box: the right choice is highlighted.`
        );
      return false;
    }
    // No vote is expected right now: only free votes the story allows.
    if (this.story.freeVote && this.story.freeVote(this, meeting, selection)) return true;
    this.guide("Hold on — there's nothing to vote on right now. Follow the tutorial box.");
    return false;
  }

  // Typed chat: a line matching the good option counts as clicking it.
  onHumanSpeak(player, meeting, content) {
    if (player !== this.human()) return;
    const p = this.pending;
    if (!p || meeting.name !== p.meeting) return;
    if (!p.want && !p.match) return;
    if (!(this.steps[0] && this.steps[0].pending === p)) return;
    const result = chatMatch.evaluate(content, p.want || {}, p.names);
    this.log.push(`human said "${content}" -> ${result.problem || "ok"}`);
    const bad = p.options.find((o) => o.when && o.when(content, result, this));
    if (bad) return this.settle(p, bad.id);
    if (result.ok) {
      if (p.match && !p.match(content, result, this)) {
        this.react(p, "incomplete");
        this.guide((p.hints && p.hints.incomplete) || p.text);
        this.armSilence(p);
        return;
      }
      return this.settle(p, "go");
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
