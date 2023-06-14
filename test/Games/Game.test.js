const dotenv = require("dotenv").config();
const chai = require("chai");

const should = chai.should();
const db = require("../../db/db");
const redis = require("../../modules/redis");
const Game = require("../../Games/core/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const constants = require("../../data/constants");

describe("Games/Game", () => {
  describe("Game creation", () => {
    it("should create a new game and add it to the redis db", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const game = new Game({
        id: "testId",
        hostId: "testHost",
        settings: {
          setup: { id: "testSetup" },
          private: true,
          spectating: true,
          stateLengths: {
            state1: 1000,
            state2: 1000,
          },
        },
        isTest: true,
      });
      await game.init();

      game.id.should.equal("testId");
      game.hostId.should.equal("testHost");
      game.Player.name.should.equal("Player");
      game.states[0].name.should.equal("Postgame");
      game.states[1].name.should.equal("Pregame");
      game.currentState.should.equal(-1);
      should.exist(game.setup);
      game.setup.id.should.equal("testSetup");
      game.private.should.be.true;
      game.spectating.should.be.true;
      game.players.should.have.lengthOf(0);
      game.spectatorLimit.should.equal(constants.maxSpectators);
      game.pregame.name.should.equal("Pregame");
      game.getMeetings().should.have.lengthOf(1);

      const pregame = game.getMeetings()[0];
      pregame.name.should.equal("Pregame");

      for (const meeting of game.meetings) should.exist(meeting.name);

      const info = await redis.getGameInfo(game.id);
      should.exist(info);
      info.status.should.equal("Open");
      should.exist(info.settings);
      should.exist(info.settings.setup);
      info.settings.setup.should.equal("testSetup");
      info.settings.private.should.be.true;
      info.settings.spectating.should.be.true;
    });
  });

  describe("Game joining", () => {
    it("should create several game clients and have them join the game", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const gameId = "gameId";

      const game = new Game({
        id: gameId,
        hostId: "hostId",
        settings: {
          setup: { id: "setupId", total: 3 },
          private: true,
          ranked: false,
          spectating: true,
          stateLengths: {
            state1: 1000,
            state2: 1000,
          },
        },
      });
      await game.init();

      const hostUser = new User({
        id: "hostId",
        socket: new Socket(),
        name: "hostName",
        settings: {},
      });

      let inGame = await redis.inGame("hostId");
      should.exist(inGame);
      inGame.should.equal(gameId);

      await game.userJoin(hostUser);

      game.players.should.have.lengthOf(1);

      let player = game.players.array()[0];
      player.user.should.equal(hostUser);
      player.name.should.equal("hostName");
      should.exist(game.pregame.members[player.id]);

      hostUser.socket.flushMessages();

      inGame = await redis.inGame("hostId");
      should.exist(inGame);
      inGame.should.equal("gameId");

      const user1 = new User({
        id: "userId1",
        socket: new Socket(),
        name: "userName1",
        settings: {},
      });

      await game.userJoin(user1);

      game.players.should.have.lengthOf(2);
      player = game.players.array()[1];
      player.user.should.equal(user1);
      player.name.should.equal("userName1");
      should.exist(game.pregame.members[player.id]);

      hostUser.socket.flushMessages();
      user1.socket.flushMessages();

      const user2 = new User({
        id: "userId2",
        socket: new Socket(),
        name: "userName2",
        settings: {},
      });

      await game.userJoin(user2);

      game.players.should.have.lengthOf(3);
      player = game.players.array()[2];
      player.user.should.equal(user2);
      player.name.should.equal("userName2");
      should.exist(game.pregame.members[player.id]);

      game.timers.pregameCountdown.clear();
    });
  });

  describe("Game start", () => {
    it("should create a game, have players join, and start it properly", async () => {
      await db.promise;
      await redis.client.flushdbAsync();

      const game = new Game({
        id: "gameId",
        hostId: "hostId",
        settings: {
          setup: { id: "setupId", total: 3 },
          private: true,
          ranked: false,
          spectating: true,
          stateLengths: {
            state1: 1000,
            state2: 1000,
          },
          pregameCountdownLength: 100,
        },
        isTest: true,
      });
      await game.init();
      game.assignRoles = () => {};
      game.gotoNextState = () => {};

      await game.userJoin(
        new User({
          id: "hostId",
          socket: new Socket(),
          name: "hostName",
          settings: {},
        })
      );

      await game.userJoin(
        new User({
          id: "userId1",
          socket: new Socket(),
          name: "userName1",
          settings: {},
        })
      );

      await game.userJoin(
        new User({
          id: "userId2",
          socket: new Socket(),
          name: "userName2",
          settings: {},
        })
      );

      function gameStart() {
        return new Promise((res) => {
          setInterval(() => {
            if (game.started) res();
          }, 100);
        });
      }

      await gameStart();
      game.started.should.be.true;
    });
  });
});
