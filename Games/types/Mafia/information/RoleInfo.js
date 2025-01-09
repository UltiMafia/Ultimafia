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

module.exports = class RoleInfo extends Information {
  constructor(creator, game, target, investType) {
    super("Role Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    this.targetRole = this.target
      .getRoleAppearance(this.investType)
      .split(" (")[0];

    let role = target.getRoleAppearance(this.investType);
    let trueRole = this.game.formatRoleInternal(
      target.role.name,
      target.role.modifier
    );
    this.trueRole = this.game.formatRole(trueRole);
    this.mainInfo = role;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You Learn that ${this.target.name}'s Role is ${this.mainInfo}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

    getInfoSpecial() {
    return `${this.target.name}'s Role is ${this.mainInfo}`;
  }

  isTrue() {
    if (this.trueRole == this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFalse() {
    if (this.trueRole != this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFavorable() {
    if (
      this.game.getRoleAlignment(this.targetRole) ==
        this.creator.role.alignment ||
      (this.isEvil(this.creator) && this.mainInfo == "Villager")
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (
      this.game.getRoleAlignment(this.targetRole) == this.creator.role.alignment
    ) {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    this.mainInfo = this.trueRole;
    this.targetRole = this.target.role.name;
  }
  makeFalse() {
    let roles = this.getFakeRole(
      this.target,
      1,
      true,
      this.investType,
      null,
      true
    );

    this.mainInfo = roles[0];
    this.targetRole = roles[0].split(":")[0];
  }
  makeFavorable() {
    if (this.isEvil(this.creator.faction)) {
      let villagers = this.game.players.filter(
        (p) => p.role.name == "Villager"
      );
      if (villagers.length > 1) {
        this.mainInfo = "Villager";
        this.targetRole = "Villager";
        return;
      }
    }

    let roles = this.getFakeRole(
      this.target,
      1,
      true,
      this.investType,
      this.creator.role.alignment
    );

    this.mainInfo = roles[0];
    this.targetRole = roles[0].split(":")[0];
  }
  makeUnfavorable() {
    if (this.isEvil(this.creator)) {
      let rolesGood = this.getFakeRole(
        this.target,
        1,
        true,
        this.investType,
        "Village"
      );

      this.mainInfo = rolesGood[0];
      this.targetRole = rolesGood[0].split(":")[0];
      return;
    }
    let roles = this.getFakeRole(this.target, 1, true, this.investType, "Evil");

    this.mainInfo = roles[0];
    this.targetRole = roles[0].split(":")[0];
  }
};
