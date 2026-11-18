const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Games/core/Game binds a worker port and opens Redis/Mongo connections on
// import, so these cases execute the real Meeting/SpeedUpMeeting source with
// inert dependencies instead of loading the infrastructure-active core Game.
function load(file, dependencies, globals = {}) {
  const filename = path.resolve(__dirname, "../../../", file);
  const module = { exports: {} };
  vm.runInNewContext(
    fs.readFileSync(filename, "utf8"),
    {
      module,
      ...globals,
      require(request) {
        assert.ok(
          Object.hasOwn(dependencies, request),
          `Unexpected import: ${request} in ${file}`
        );
        return dependencies[request];
      },
    },
    { filename }
  );
  return module.exports;
}

const ArrayHash = load("Games/core/ArrayHash.js", {});
const Meeting = load("Games/core/Meeting.js", {
  shortid: { generate: () => "m" + Math.random().toString(36).slice(2, 10) },
  "./Message": class {},
  "./Quote": class {},
  "../../lib/Random": {},
  "./ArrayHash": ArrayHash,
  "../../data/constants": {},
  "./Player": class {},
  "../../data/roles": {},
});
const SpeedUpMeeting = load("Games/types/WackyWords/SpeedUpMeeting.js", {
  "../../core/Meeting": Meeting,
});

const NAMES = ["Alice", "Bob", "Carol", "Dave", "Erin"];

function makePlayer(name) {
  return {
    id: name,
    name,
    alive: true,
    left: false,
    housed: false,
    exorcised: false,
    spectator: false,
    joinedMeeting() {},
    leftMeeting() {},
    sendMeeting() {},
    sendAlert() {},
    send() {},
    seeVote: () => null,
    seeUnvote: () => null,
    checkVoteKick() {},
    warnOfVoteKick() {},
    hasVotedInAllMeetings: () => true,
    getVotePower: () => 1,
  };
}

// core Games/core/Game.js checkAllMeetingsReady() sets allReady = false for any
// meeting whose `ready` is false, then calls gotoNextState(). Mirrored here so a
// unit case can assert the gate without importing the core Game class.
function allMeetingsReady(game) {
  return game.meetings.every((meeting) => meeting.ready);
}

function fixture() {
  const players = NAMES.map(makePlayer);
  const timers = [];
  const alerts = [];
  const vegged = [];
  let advances = 0;
  let spedUp = 0;

  const game = {
    type: "Wacky Words",
    players,
    meetings: [],
    currentState: 2,
    started: true,
    finished: false,
    tutorial: undefined,
    vegKickMeeting: undefined,
    events: { emit() {}, on() {} },
    getStateName: () => "Day",
    getPlayer: (id) => players.find((player) => player.id === id),
    isMajorityVoting: () => false,
    isHiddenVotes: () => false,
    isMustAct: () => false,
    isMustCondemn: () => false,
    isTalkingDead: () => false,
    isVotingDead: () => false,
    isNoAct: () => false,
    isNoVeg: () => false,
    isWhispers: () => false,
    isSpectatorMeeting: () => false,
    queueAlert() {},
    removeMeeting() {},
    sendAlert: (message) => alerts.push(message),
    createTimer: (name, delay, then) => timers.push({ name, delay, then }),
    clearTimer() {},
    vegPlayer: async (player) => vegged.push(player.name),
    speedUp: () => spedUp++,
    gotoNextState: () => advances++,
    checkAllMeetingsReady() {
      if (allMeetingsReady(this)) this.gotoNextState();
    },
  };

  const speedUp = new SpeedUpMeeting(game);
  game.meetings.push(speedUp);
  for (const player of players) speedUp.join(player);

  // Wacky People: the current question owner has no response and no guess
  // meeting at all, so nothing of theirs is in game.meetings.
  const owner = players[0];
  const actions = players.slice(1).map((player) => {
    const meeting = new Meeting(game, "Pick Favorite Response");
    meeting.join(player, { flags: ["voting"], targets: ["answer"] });
    game.meetings.push(meeting);
    return { player, meeting };
  });

  return {
    game,
    players,
    owner,
    actions,
    speedUp,
    timers,
    alerts,
    vegged,
    advances: () => advances,
    spedUp: () => spedUp,
    castBallot(player) {
      speedUp.enableVote(player);
      speedUp.vote(player);
    },
    castAction(entry) {
      entry.meeting.vote(entry.player, "answer");
    },
  };
}

describe("Wacky Words Speed Up phase gate", function () {
  it("does not let a Speed Up ballot mark the meeting unready", function () {
    const h = fixture();
    assert.equal(
      h.actions.some((entry) => entry.player === h.owner),
      false,
      "fixture: the owner has no action meeting"
    );

    h.castBallot(h.players[1]);

    assert.equal(h.speedUp.votes[h.players[1].id], "Speed Up");
    assert.equal(
      h.speedUp.totalVoters,
      0,
      "enableVote() does not count the ballot in totalVoters"
    );
    assert.equal(
      h.speedUp.ready,
      true,
      "a ballot must not hold the all-meetings-ready gate open"
    );
  });

  it("advances when every real action is in, even with a ballot cast first", function () {
    const h = fixture();
    h.castBallot(h.players[1]);

    h.castAction(h.actions[0]);
    h.castAction(h.actions[1]);
    h.castAction(h.actions[2]);

    assert.equal(allMeetingsReady(h.game), false);
    assert.equal(h.advances(), 0, "an action that has not arrived still holds the phase");

    h.castAction(h.actions[3]);

    assert.equal(allMeetingsReady(h.game), true);
    assert.equal(h.advances(), 1, "the completed phase advances while the ballot stands");
    assert.deepEqual(h.vegged, [], "no one is treated as inactive on the way out");
  });

  it("leaves ordinary voting meetings gated", function () {
    const h = fixture();
    const meeting = new Meeting(h.game, "Vote to Condemn");
    const [first, second] = h.players;

    meeting.join(first, { flags: ["voting"], targets: ["answer"] });
    meeting.join(second, { flags: ["voting"], targets: ["answer"] });
    h.game.meetings.push(meeting);

    meeting.vote(first, "answer");
    assert.equal(meeting.ready, false, "an incomplete ordinary vote is still unready");

    meeting.vote(second, "answer");
    assert.equal(meeting.ready, true);
  });

  it("still runs the five-second shortcut at half the alive players", function () {
    const h = fixture();

    h.castBallot(h.players[1]);
    h.castBallot(h.players[2]);
    assert.deepEqual(h.timers, [], "two of five alive is below the threshold");

    h.castBallot(h.players[3]);
    assert.equal(h.timers.length, 1);
    assert.equal(h.timers[0].name, "speedUp");
    assert.equal(h.timers[0].delay, 5000);

    h.timers[0].then();
    assert.equal(h.spedUp(), 1, "the countdown still reaches the speed-up path");
  });

  it("control: without the flag the same phase stalls after one ballot", function () {
    const h = fixture();
    h.speedUp.optional = false;

    h.castBallot(h.players[1]);
    for (const entry of h.actions) h.castAction(entry);

    assert.equal(allMeetingsReady(h.game), false);
    assert.equal(h.advances(), 0);
  });
});
