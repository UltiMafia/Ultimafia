const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should();
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

async function makeGame(setup, stateLength) {
  const users = [];
  for (let i = 0; i < setup.total; i++) users.push(makeUser());

  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: { Day: stateLength, Night: stateLength },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  for (let user of users) await game.userJoin(user);
  return game;
}

describe("Games/Meeting stale votes", function () {
  // A player shot during the day is no longer a valid condemn target. Every
  // vote on them must be withdrawn, not just the ones that come before the
  // first voter whose target is still alive.
  it("removes every vote on a player killed mid-day, whatever the vote order", async function () {
    this.timeout(10000);

    await db.promise;
    await redis.client.flushdbAsync();

    const setup = {
      total: 7,
      roles: [{ Sheriff: 1, Villager: 4, Mafioso: 2 }],
      gameSettings: { "Day Start": true },
    };
    const game = await makeGame(setup, 60000);

    try {
      game.started.should.equal(true);
      game.getStateName().should.equal("Day");

      const sheriff = game.players.filter((p) => p.role.name == "Sheriff")[0];
      const villagers = game.players.filter((p) => p.role.name == "Villager");
      const mafiosi = game.players.filter((p) => p.role.name == "Mafioso");
      const victim = villagers[0];
      const village = game.getMeetingByName("Village");
      should.exist(village);

      // The first voter's target stays valid; the later voters are on the
      // player who is about to be shot.
      village.vote(villagers[1], mafiosi[0].id);
      village.vote(villagers[2], victim.id);
      village.vote(villagers[3], victim.id);
      village.vote(mafiosi[1], victim.id);
      Object.keys(village.votes).should.have.lengthOf(4);
      Object.keys(village.votes)[0].should.equal(villagers[1].id);

      const shoot = sheriff
        .getMeetings()
        .filter((m) => m.name == "Shoot Gun")[0];
      should.exist(shoot);
      shoot.vote(sheriff, victim.id);

      victim.alive.should.equal(false);
      game.getStateName().should.equal("Day");

      Object.values(village.votes).should.not.include(victim.id);
      village.votes[villagers[1].id].should.equal(mafiosi[0].id);
      should.not.exist(village.votes[villagers[2].id]);
      should.not.exist(village.votes[villagers[3].id]);
      should.not.exist(village.votes[mafiosi[1].id]);

      // The day can only condemn a living player.
      village.vote(sheriff, mafiosi[0].id);
      village.noVeg = true;
      village.finish(true);
      should.exist(village.finalTarget);
      (village.finalTarget.id || village.finalTarget).should.equal(mafiosi[0].id);
      victim.alive.should.equal(false);
    } finally {
      game.clearTimers();
    }
  });
});
