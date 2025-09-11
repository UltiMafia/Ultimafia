const Information = require("../Information");
const Random = require("../../../../lib/Random");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class LearnTargetAndNotInfo extends Information {
  constructor(creator, game, target) {
    super("Learn Target And Not Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    let otherPlayers = this.game
      .alivePlayers()
      .filter((p) => p != creator && p != target);
    if (otherPlayers.length <= 0) {
      otherPlayers = this.game.players.filter(
        (p) => p != creator && p != target
      );
    }
    this.target = target;
    this.mainInfo = this.target;
    this.otherPlayer = Random.randArrayVal(otherPlayers);
  }

  getInfoRaw() {
    super.getInfoRaw();
    let array = [this.mainInfo, this.otherPlayer];
    array = Random.randomizeArray(array);
    return array[0].name + " or " + array[1].name;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let array = [this.mainInfo, this.otherPlayer];
    array = Random.randomizeArray(array);
    return `You Learn that ${array[0].name} or ${array[1].name} is the killer.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    if (this.mainInfo == this.target) {
      return true;
    } else {
      return false;
    }
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    return true;
  }
  isUnfavorable() {
    return true;
  }

  makeTrue() {
    this.mainInfo = this.target;
  }
  makeFalse() {
    let players = this.game
      .alivePlayers()
      .filter(
        (p) => p != this.target && p != this.creator && p != this.otherPlayer
      );
    if (players.length <= 0) {
      players = this.game.players.filter(
        (p) => p != this.target && p != this.creator && p != this.otherPlayer
      );
    }
    this.mainInfo = Random.randArrayVal(players);
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
