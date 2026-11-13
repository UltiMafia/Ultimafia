const chai = require("chai");
const should = chai.should();
const CorePlayer = require("../../../Games/core/Player");
const MafiaPlayer = require("../../../Games/types/Mafia/Player");
const Timer = require("../../../Games/core/Timer");

// Drives the /end branch of MafiaPlayer.parseCommand against a small game
// stand-in with a real Timer, so no database or socket is needed.
function makeDay(options) {
  options = options || {};
  const alerts = [];
  const personal = [];
  const players = [];
  players.array = () => players.slice();
  const game = {
    id: "endvote",
    endVotes: 0,
    players,
    getStateName: () => options.state || "Day",
    getFixedDayLength: () => options.fixedDayLength || 0,
    playersInPlay: () => players.filter((player) => player.alive),
    sendAlert: (text) => alerts.push(text),
  };
  const timer = new Timer({
    name: "main",
    delay: options.dayLength || 5 * 60 * 1000,
    game,
    then: () => {},
  });
  timer.sendInfoToAll = () => {};
  timer.sync = () => {};
  timer.start();
  game.timers = { main: timer };

  for (let i = 0; i < (options.alive || 6); i++) {
    const player = Object.create(MafiaPlayer.prototype);
    Object.assign(player, {
      name: `p${i}`,
      alive: true,
      housed: false,
      votedForEnd: false,
      game,
      sendAlert: (text) => personal.push(text),
    });
    players.push(player);
  }

  return { game, timer, alerts, personal };
}

function stopTimer(timer) {
  clearTimeout(timer.timeout);
  clearInterval(timer.syncInterval);
}

describe("Games/Mafia /end vote", function () {
  let parseCommand, getVegKickMeeting;

  before(function () {
    parseCommand = CorePlayer.prototype.parseCommand;
    getVegKickMeeting = CorePlayer.prototype.getVegKickMeeting;
    CorePlayer.prototype.parseCommand = (message) => ({
      name: message.slice(1),
    });
    CorePlayer.prototype.getVegKickMeeting = () => undefined;
  });

  after(function () {
    CorePlayer.prototype.parseCommand = parseCommand;
    CorePlayer.prototype.getVegKickMeeting = getVegKickMeeting;
  });

  it("cuts the Day to 1 minute once half of the players vote", function () {
    const day = makeDay({ alive: 6 });
    for (let i = 0; i < 3; i++) day.game.players[i].parseCommand("/end");
    stopTimer(day.timer);

    day.timer.delay.should.equal(60 * 1000);
    day.alerts.should.include("Day shortened to 1 minute.");
    day.game.endVotes.should.equal(0);
    day.game.players.every((player) => !player.votedForEnd).should.equal(true);
  });

  it("keeps the Day length until enough players vote, counting each player once", function () {
    const day = makeDay({ alive: 7 });
    for (let i = 0; i < 3; i++) day.game.players[i].parseCommand("/end");
    day.game.players[0].parseCommand("/end");
    stopTimer(day.timer);

    day.timer.delay.should.equal(5 * 60 * 1000);
    day.game.endVotes.should.equal(3);
    day.alerts[2].should.equal(
      "p2 voted to end the Day early using /end. 3/4 votes."
    );
  });

  it("never lengthens a Day with a minute or less left", function () {
    const day = makeDay({ alive: 4, dayLength: 45 * 1000 });
    for (let i = 0; i < 2; i++) day.game.players[i].parseCommand("/end");
    stopTimer(day.timer);

    day.timer.delay.should.equal(45 * 1000);
    day.game.endVotes.should.equal(0);
    day.personal.should.include("The Day already has a minute or less left.");
  });

  it("does nothing in a setup with a fixed Day length", function () {
    const day = makeDay({ alive: 4, fixedDayLength: 3 });
    for (let i = 0; i < 2; i++) day.game.players[i].parseCommand("/end");
    stopTimer(day.timer);

    day.timer.delay.should.equal(5 * 60 * 1000);
    day.personal.should.include("This setup has a fixed Day length.");
  });

  it("ignores /end outside the Day and from dead players", function () {
    const night = makeDay({ alive: 4, state: "Night" });
    night.game.players[0].parseCommand("/end");
    stopTimer(night.timer);
    night.game.endVotes.should.equal(0);

    const day = makeDay({ alive: 4 });
    day.game.players[0].alive = false;
    day.game.players[0].parseCommand("/end");
    stopTimer(day.timer);
    day.game.endVotes.should.equal(0);
  });
});
