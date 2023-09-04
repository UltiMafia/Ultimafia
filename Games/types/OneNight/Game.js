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
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
      },
    ];
    this.excessRoles = [];
  }

  generateRoleset() {
    var roleset = super.generateRoleset();

    for (let i = 0; i < this.setup.excessRoles; i++) {
      let roleNames = Object.keys(roleset);
      let j = Random.randInt(0, roleNames.length - 1);
      let roleName = roleNames[j];

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
    var finished = this.currentState >= 2 && this.getStateName() == "Night";
    var winners = finished && this.getWinners();

    return [finished, winners];
  }

  getWinners() {
    var winQueue = new Queue();
    var winners = new Winners(this);
    var dead = { total: 0, alignments: {}, roles: {} };
    var werewolfPresent = false;

    for (let player of this.players) {
      let alignment = player.role.alignment;
      let role = player.role.name;

      if (dead.alignments[alignment] == null) dead.alignments[alignment] = 0;

      if (dead.roles[role] == null) dead.roles[role] = 0;

      if (!player.alive) {
        dead.alignments[alignment]++;
        dead.roles[role]++;
        dead.total++;
      }

      if (role == "Werewolf") werewolfPresent = true;
    }

    for (let player of this.players) winQueue.enqueue(player.role.winCheck);

    for (let winCheck of winQueue) {
      let stop = winCheck.check(winners, dead, werewolfPresent);
      if (stop) break;
    }

    winners.determinePlayers();

    if (winners.players.length == 0) winners.addGroup("No one");

    return winners;
  }
};
