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

module.exports = class IsOneOfTargetsDemonInfo extends Information {
  constructor(creator, game, targets) {
    super("Is One Of Targets Demon Info", creator, game);
    if (targets == null || targets.length <= 0) {
      this.randomTarget = true;
      let targetA = Random.randArrayVal(this.game.alivePlayers());
      let targetB = Random.randArrayVal(
        this.game.alivePlayers().filter((p) => p != targetA)
      );
      targets = [targetA, targetB];
    }
    this.target = targets;
    this.mainInfo = "No";
    for (let player of this.target) {
      if (MAFIA_FACTIONS.includes(this.getAppearanceAlignment(player))) {
        this.mainInfo = "Yes";
        break;
      }
      if (this.isAppearanceDemonic(player)) {
        this.mainInfo = "Yes";
        break;
      }
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if (this.mainInfo == "Yes") {
      return `You learn that at least one of ${this.target[0].name} and ${this.target[1].name} is Mafia or Demonic.`;
    } else {
      return `You learn that neither of ${this.target[0].name} and ${this.target[1].name} is Mafia or Demonic.`;
    }
  }

  isTrue() {
    for (let player of this.target) {
      if (MAFIA_FACTIONS.includes(player.faction) && this.mainInfo == "Yes") {
        return true;
      }
      if (player.isDemonic(true) && this.mainInfo == "Yes") {
        return true;
      }
    }
    if (this.mainInfo == "No") {
      return true;
    }
    return false;
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo == "No") {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "Yes") {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    this.mainInfo = "No";
    for (let player of this.target) {
      if (MAFIA_FACTIONS.includes(player.faction)) {
        this.mainInfo = "Yes";
      }
      if (player.isDemonic(true) && this.mainInfo == "Yes") {
        this.mainInfo = "Yes";
      }
    }
  }
  makeFalse() {
    this.makeTrue();

    if (this.mainInfo == "Yes") {
      this.mainInfo = "No";
    } else {
      this.mainInfo = "Yes";
    }
  }
  makeFavorable() {
    this.mainInfo = "No";
  }
  makeUnfavorable() {
    this.mainInfo = "Yes";
  }
};
