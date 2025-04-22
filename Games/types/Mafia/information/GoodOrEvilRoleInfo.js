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

module.exports = class GoodOrEvilRoleInfo extends Information {
  constructor(creator, game, target, investType) {
    super("Good Or Evil Role Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    let trueRole = this.game.formatRoleInternal(
      target.role.name,
      target.role.modifier
    );
    this.trueRole = this.game.formatRole(trueRole);
    this.targetRole = this.target
      .getRoleAppearance(this.investType)
      .split(" (")[0];
    let info = [];
    if (
      this.game.getRoleAlignment(this.targetRole) == "Cult" ||
      this.game.getRoleAlignment(this.targetRole) == "Mafia" ||
      (this.game.getRoleAlignment(this.targetRole) == "Independent" &&
        this.game.getRoleTags(this.targetRole).includes("Hostile"))
    ) {
      info = this.getFakeRole(this.target, 1, true, this.investType, "Good");
    } else {
      info = this.getFakeRole(this.target, 1, true, this.investType, "Evil");
    }

    let role = target.getRoleAppearance(this.investType);
    info.push(role);
    this.mainInfo = info;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return Random.randomizeArray(this.mainInfo);
  }

  getInfoFormated() {
    super.getInfoRaw();
    let info = Random.randomizeArray(this.mainInfo);
    return `You dowse for water on ${this.target.name}'s property... And discover that they are either ${info[0]} or ${info[1]}!`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    if (this.mainInfo.includes(this.trueRole)) {
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
    this.targetRole = this.target.role.name;
    let info = this.getFakeRole(this.target, 2, false, this.investType);
    if (
      this.game.getRoleAlignment(this.targetRole) != "Cult" ||
      this.game.getRoleAlignment(this.targetRole) != "Mafia" ||
      !(
        this.game.getRoleAlignment(this.targetRole) == "Independent" &&
        this.game.getRoleTags(this.targetRole).includes("Hostile")
      )
    ) {
      info = this.getFakeRole(this.target, 1, true, this.investType, "Evil");
    } else {
      info = this.getFakeRole(this.target, 1, true, this.investType, "Good");
    }
    info.push(this.trueRole);
    this.mainInfo = info;
  }
  makeFalse() {
    let roles = this.getFakeRole(
      this.target,
      1,
      false,
      this.investType,
      "Good"
    );
    roles.push(
      this.getFakeRole(this.target, 1, false, this.investType, "Evil")[0]
    );

    this.mainInfo = roles;
    this.targetRole = roles[0].split(":")[0];
  }
  makeFavorable() {}
  makeUnfavorable() {}
};
