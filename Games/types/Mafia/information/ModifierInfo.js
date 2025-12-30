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

module.exports = class ModifierInfo extends Information {
  constructor(creator, game, target, investType, role) {
    super("Modifier Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.role = role;
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    if(this.target.getRoleAppearance(this.investType).split(" (")[1]){
      this.targetModifiers = this.target
      .getRoleAppearance(this.investType)
      .split(" (")[1].replace(")", "");
    }
    else{
      this.targetModifiers = "";
    }

    let trueModifier = target.role.modifier;
    
    this.trueModifier = trueModifier;
    this.mainInfo = role;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if(this.mainInfo == ""){
      return `You Learn that ${this.target.name} has no modifiers`;
    }
    return `You Learn that ${this.target.name} has the following modifier(s): ${this.mainInfo}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  getInfoSpecial() {
     if(this.mainInfo == ""){
      return `You Learn that ${this.target.name} has no modifiers`;
    }
    return `You Learn that ${this.target.name} has the following modifier(s): ${this.mainInfo}`;
  }

  isTrue() {
    if (this.trueModifier == this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFalse() {
    if (this.trueModifier != this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFavorable() {
    if (this.mainInfo == "")
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo != "") {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    this.mainInfo = this.trueModifier;
  }
  makeFalse() {
    let roleOptions = this.role.getAllRoles().filter((r) => r.split(":")[1] && r.split(":")[1] != this.mainInfo && this.game.getRoleTags(r).includes("No Investigate"));

    if(roleOptions.length <= 0 && this.trueModifier != ""){
      this.mainInfo = "";
      return;
    }
    else if(roleOptions.length <= 0 && this.trueModifier == ""){
      this.mainInfo = "Loyal";
      return;
    }

    this.mainInfo = Random.randArrayVal(roleOptions).split(":")[1];
  }
  makeFavorable() {
    this.mainInfo = "";
  }
  makeUnfavorable() {
    let roleOptions = this.role.getAllRoles().filter((r) => r.split(":")[1] && r.split(":")[1] != this.mainInfo && this.game.getRoleTags(r).includes("No Investigate"));

  if(roleOptions.length <= 0){
      this.mainInfo = "Loyal";
      return;
    }

    this.mainInfo = Random.randArrayVal(roleOptions).split(":")[1];
  }
};
