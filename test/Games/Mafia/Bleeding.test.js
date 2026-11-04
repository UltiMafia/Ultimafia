const dotenv = require("dotenv").config();
const chai = require("chai");
const should = chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const Socket = require("../../../lib/sockets").TestSocket;
const Action = require("../../../Games/types/Mafia/Action");
const {
  PRIORITY_EFFECT_GIVER_EARLY,
} = require("../../../Games/types/Mafia/const/Priority");

// Production phases are 45s. Tests use a short clock so the real order still runs.
const CONVERSION_TEST_MS = 100;

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function waitFor(check, timeout) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (check()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("timed out waiting for the bleed to resolve"));
      }
    }, 15);
  });
}

// Starts bleeding from an action on the first ordinary night, then lets the
// phase clocks run. Nobody picks a target, so the bleed is the only death.
async function bleedDeath(setup) {
  const users = [];
  for (let i = 0; i < setup.total; i++) users.push(makeUser());

  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      // Votes end Day and Night. A clock this long cannot race them.
      stateLengths: { Day: 8000, Night: 8000 },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  for (let state of game.states) {
    if (state.name.startsWith("Night (")) state.length = CONVERSION_TEST_MS;
  }

  const result = { states: [], diedIn: null };

  game.events.on("start", () => {
    let bleedQueued = false;
    let victim;

    game.events.on("state", () => {
      const name = game.getStateName();
      result.states.push(name);
      if (name != "Night" || bleedQueued) return;
      bleedQueued = true;

      victim = game.players.filter((p) => p.role.name == "Villager")[0];
      const killer = game.players.filter((p) => p.role.name == "Mafioso")[0];
      const kill = victim.kill;
      victim.kill = function (...args) {
        result.diedIn = game.getStateName();
        // The answer is in. Stop the clock so the game does not run on.
        game.createNextStateTimer = function () {};
        return kill.apply(this, args);
      };
      game.queueAction(
        new Action({
          actor: killer,
          target: victim,
          game: game,
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          labels: ["effect"],
          run: function () {
            this.target.giveEffect("Bleeding", this.actor);
          },
        })
      );
    });
  });

  for (let user of users) await game.userJoin(user);
  bindVotes(game, result);
  await waitFor(() => result.diedIn || game.finished, 8000);
  return result;
}

// Everyone votes once per meeting for no one, so nobody is vegged or condemned.
// The vote arrives on a later tick, as it does from a real socket, because a
// vote sent from inside the server's own send re-enters gotoNextState.
function bindVotes(game, result) {
  const voted = new Set();
  for (let player of game.players) {
    player.user.socket.onClientEvent("meeting", function (meeting) {
      const voteKey = player.id + ":" + meeting.id;
      if (!meeting.voting || voted.has(voteKey)) return;
      voted.add(voteKey);
      const targets = meeting.targets || [];
      const selection = targets.indexOf("None") != -1 ? "None" : "*";
      setImmediate(() => {
        if (game.finished || result.diedIn) return;
        this.sendToServer("vote", {
          selection: selection,
          meetingId: meeting.id,
        });
      });
    });
  }
}

describe("Games/Mafia Bleeding", function () {
  this.timeout(10000);

  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    await redis.client.flushdbAsync();
  });

  it("kills on the next ordinary night when no conversion phase runs", async function () {
    const result = await bleedDeath({
      total: 5,
      roles: [{ Villager: 4, Mafioso: 1 }],
    });

    result.diedIn.should.equal("Night");
    result.states.filter((name) => name == "Night").should.have.lengthOf(2);
  });

  it("holds through a conversion phase and kills on the ordinary night", async function () {
    const result = await bleedDeath({
      total: 5,
      roles: [{ Philosopher: 1, Villager: 3, Mafioso: 1 }],
    });

    result.diedIn.should.equal("Night");
    result.states
      .filter((name) => name == "Night (Becoming)")
      .should.have.lengthOf(2);
    result.states.filter((name) => name == "Night").should.have.lengthOf(2);
  });

  it("holds through consecutive conversion phases", async function () {
    const result = await bleedDeath({
      total: 6,
      roles: [{ Philosopher: 1, "Snake Charmer": 1, Villager: 3, Mafioso: 1 }],
    });

    result.diedIn.should.equal("Night");
    result.states
      .filter((name) => name == "Night (Swapping)")
      .should.have.lengthOf(2);
    result.states.filter((name) => name == "Night").should.have.lengthOf(2);
  });
});
