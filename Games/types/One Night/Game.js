const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");

module.exports = class OneNightGame extends Game {
  constructor(options) {
    super(options);

    this.type = "One Night";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Night",
        length: options.settings.stateLengths.Night,
      },
      {
        name: "Day",
        length: options.settings.stateLengths.Day,
      },
    ];
    this.excessRoles = [];
  }

  generateRoleset() {
    const roleset = super.generateRoleset();

    for (let i = 0; i < this.setup.excessRoles; i++) {
      const roleNames = Object.keys(roleset);
      const j = Random.randInt(0, roleNames.length - 1);
      const roleName = roleNames[j];

      this.excessRoles.push(roleName);
      roleset[roleName]--;

      if (roleset[roleName] <= 0) delete roleset[roleName];
    }

    return roleset;
  }

  checkAllMeetingsReady() {
    if (this.getStateName() == "Night") return;

    super.checkAllMeetingsReady();
  }

  checkWinConditions() {
    const finished = this.currentState >= 2 && this.getStateName() == "Night";
    const winners = finished && this.getWinners();

    return [finished, winners];
  }

  getWinners() {
    const winQueue = new Queue();
    const winners = new Winners(this);
    const dead = { total: 0, alignments: {}, roles: {} };
    let werewolfPresent = false;

    for (const player of this.players) {
      const { alignment } = player.role;
      const role = player.role.name;

      if (dead.alignments[alignment] == null) dead.alignments[alignment] = 0;

      if (dead.roles[role] == null) dead.roles[role] = 0;

      if (!player.alive) {
        dead.alignments[alignment]++;
        dead.roles[role]++;
        dead.total++;
      }

      if (role == "Werewolf") werewolfPresent = true;
    }

    for (const player of this.players) winQueue.enqueue(player.role.winCheck);

    for (const winCheck of winQueue) {
      const stop = winCheck.check(winners, dead, werewolfPresent);
      if (stop) break;
    }

    winners.determinePlayers();

    if (winners.players.length == 0) winners.addGroup("No one");

    return winners;
  }
};
