const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");
const roleData = require("../../..//data/roles");

module.exports = class SplitDecisionGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Split Decision";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Round",
      },
      {
        name: "Hostage Swap",
        length: options.settings.stateLengths["Hostage Swap"],
      },
    ];
    this.rooms = { "Room 1": [], "Room 2": [] };
    this.round = 0;
    this.roundAmt = this.setup.roundAmt;
    this.spectatorMeetFilter = {
      "Room 1": true,
      "Room 2": true,
      "Hostage Swap": true,
    };
    this.roundLengthSlope = this.stateLengths["Initial Round"] / this.roundAmt;
    this.swapAmtSlope = this.setup.swapAmt / this.roundAmt;
    this.roundLengths = [];
    this.swapAmounts = [];

    for (let i = 0; i < this.roundAmt; i++) {
      this.roundLengths.push(
        Math.ceil(
          this.stateLengths["Initial Round"] - i * this.roundLengthSlope
        )
      );
      this.swapAmounts.push(
        Math.ceil(this.setup.swapAmt - i * this.swapAmtSlope)
      );
    }
  }

  get currentSwapAmt() {
    return this.swapAmounts[this.round - 1];
  }

  generateClosedRoleset() {
    var roleset = {};
    var rolesByAlignment = {};

    for (let role in this.setup.roles[0]) {
      let roleName = role.split(":")[0];
      let alignment = roleData[this.type][roleName].alignment;

      if (!rolesByAlignment[alignment]) rolesByAlignment[alignment] = [];

      for (let i = 0; i < this.setup.roles[0][role]; i++)
        rolesByAlignment[alignment].push(role);
    }

    var presidents = rolesByAlignment["Blue"].filter(
      (role) => role.split(":")[0] == "President"
    );
    var bombers = rolesByAlignment["Red"].filter(
      (role) => role.split(":")[0] == "Bomber"
    );

    var president = Random.randArrayVal(presidents);
    var bomber = Random.randArrayVal(bombers);
    roleset[president] = 1;
    roleset[bomber] = 1;

    if (this.setup.unique) {
      rolesByAlignment["Blue"] = rolesByAlignment["Blue"].filter(
        (role) => role.name != president
      );
      rolesByAlignment["Red"] = rolesByAlignment["Red"].filter(
        (role) => role.name != bomber
      );
    }

    for (let alignment in rolesByAlignment) {
      for (
        let i = alignment == "Blue" || alignment == "Red" ? 1 : 0;
        i < this.setup.count[alignment];
        i++
      ) {
        let role = Random.randArrayVal(rolesByAlignment[alignment]);

        if (this.setup.unique)
          rolesByAlignment[alignment] = rolesByAlignment[alignment].filter(
            (_role) => _role != role
          );

        if (roleset[role] == null) roleset[role] = 0;

        roleset[role]++;
      }
    }

    return roleset;
  }

  assignRoles() {
    super.assignRoles();

    var randomPlayers = Random.randomizeArray(this.players.array());
    this.room1 = randomPlayers.slice(0, randomPlayers.length / 2);
    this.room2 = randomPlayers.slice(
      randomPlayers.length / 2,
      randomPlayers.length
    );

    for (let player of this.room1) player.putInRoom(1);

    for (let player of this.room2) player.putInRoom(2);
  }

  incrementState() {
    super.incrementState();

    if (this.getStateInfo().name.match(/Round/)) this.round++;
  }

  createNextStateTimer(stateInfo) {
    var length;

    if (stateInfo.name.match(/Round/))
      length = this.roundLengths[this.round - 1];
    else length = stateInfo.length;

    this.createTimer("main", length, () => this.gotoNextState());
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.round = this.round;

    if (info.name == "Round") {
      info = {
        ...info,
        name: `Round ${this.round}`,
      };
    }

    return info;
  }

  checkWinConditions() {
    var finished = this.round > this.roundAmt;
    var winners = finished && this.getWinners();

    return [finished, winners];
  }

  getWinners() {
    var winQueue = new Queue();
    var winners = new Winners(this);

    for (let player of this.players) winQueue.enqueue(player.role.winCheck);

    for (let winCheck of winQueue) {
      let stop = winCheck.check(winners);
      if (stop) break;
    }

    winners.determinePlayers();
    return winners;
  }
};
