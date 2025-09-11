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

module.exports = class RevealInfo extends Information {
  constructor(creator, game, target, investType, revealTo) {
    super("Reveal Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    if (revealTo == null) {
      revealTo == "All";
    }
    this.investType = investType;
    this.revealTo = revealTo;
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
    this.truthValue = "Normal";
    //this.mainInfo = role;

  }

  getInfoRaw() {
    super.getInfoRaw();
    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Truth Value ${this.truthValue} Invest ${this.target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
    //this.game.queueAlert(`:invest: Internal ${this.game.formatRoleInternal(this.target.role.name, this.target.role.modifier)}`);
    let tempTempAppearanceMods =
      this.target.tempAppearanceMods[this.investType];
    let tempTempAppearance = this.target.tempAppearance[this.investType];
    let OtherRoles = this.game.PossibleRoles.filter(
      (r) =>
        r !=
          this.game.formatRoleInternal(this.target.role.name, this.target.role.modifier) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed")
    );
    OtherRoles = Random.randomizeArray(OtherRoles);
    if (this.truthValue == "Normal") {
      this.revealTarget(null, this.investType);
    } else if (this.truthValue == "True") {
      this.target.setTempAppearance(
        this.investType,
        this.game.formatRoleInternal(
          this.target.role.name,
          this.target.role.modifier
        )
      );
      this.revealTarget();
    } else if (this.truthValue == "False") {
      this.target.setTempAppearance(this.investType, OtherRoles[0]);
      this.revealTarget();
    } else if (this.truthValue == "Favorable") {
      OtherRoles = OtherRoles.filter(
        (r) =>
          this.game.getRoleAlignment(r.split(":")[0]) == "Village" ||
          (this.game.getRoleAlignment(r.split(":")[0]) == "Independent" &&
            !this.game.getRoleTags(r.split(":")[0]).includes("Hostile"))
      );
      if (OtherRoles.length <= 0) {
        OtherRoles.push("Villager");
      }
      OtherRoles = Random.randomizeArray(OtherRoles);
      this.target.setTempAppearance(this.investType, OtherRoles[0]);
      this.revealTarget();
    } else if (this.truthValue == "Unfavorable") {
      OtherRoles = OtherRoles.filter(
        (r) =>
          this.game.getRoleAlignment(r.split(":")[0]) != "Village" &&
          !(
            this.game.getRoleAlignment(r.split(":")[0]) == "Independent" &&
            !this.game.getRoleTags(r.split(":")[0]).includes("Hostile")
          )
      );
      if (OtherRoles.length <= 0) {
        OtherRoles.push("Cultist");
      }
      OtherRoles = Random.randomizeArray(OtherRoles);
      this.target.setTempAppearance(this.investType, OtherRoles[0]);
      this.revealTarget();
    }

    this.target.tempAppearanceMods[this.investType] = tempTempAppearanceMods;

    this.target.tempAppearance[this.investType] = tempTempAppearance;
  }

  getInfoFormated() {
    this.getInfoRaw();
  }

  revealTarget() {
    if (this.revealTo == "All") {
      this.target.role.revealToAll(null, this.investType);
    }
    if (this.revealTo == "Faction") {
      for (let player of this.game.players) {
        if (player.faction == this.creator.faction) {
          this.target.role.revealToPlayer(player, null, this.investType);
        }
      }
    }
    if (this.revealTo == "Self") {
      this.target.role.revealToPlayer(this.creator, null, this.investType);
    }
  }

  isTrue() {
    if (
      this.truthValue == "True" ||
      this.target.getRoleAppearance(this.investType) == this.trueRole
    ) {
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
    if (
      this.truthValue == "Favorable" ||
      this.game.getRoleAlignment(
        this.target.getRoleAppearance(this.investType).split(" (")[0]
      ) == "Village" ||
      (this.game.getRoleAlignment(
        this.target.getRoleAppearance(this.investType).split(" (")[0]
      ) == "Independent" &&
        !this.game
          .getRoleTags(
            this.target.getRoleAppearance(this.investType).split(" (")[0]
          )
          .includes("Hostile"))
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.truthValue == "Unfavorable") {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    this.truthValue = "True";
  }
  makeFalse() {
    this.truthValue = "False";
  }
  makeFavorable() {
    this.truthValue = "Favorable";
  }
  makeUnfavorable() {
    this.truthValue = "Unfavorable";
  }
};
