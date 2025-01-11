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

module.exports = class OneOfPlayersIsRoleInfo extends Information {
  constructor(creator, game, target, amount, investType) {
    super("One Of Players Is Role Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if(amount == null || amount <= 0){
      amount = 2;
    }
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
      for(let x = 0; x < amount; x++){
        target.push(Random.randArrayVal(this.game.alivePlayers().filter((p) => !target.includes(p) && p != this.creator)));
      }
    }
    this.target = target;
    let temp = Random.randArrayVal(this.target);
    this.targetRole = temp.getRoleAppearance(this.investType)
      .split(" (")[0];

    let role = temp.getRoleAppearance(this.investType);
    let trueRole = this.game.formatRoleInternal(
      temp.role.name,
      temp.role.modifier
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
    return `You Learn that ${this.target[0].name} or ${this.target[1].name} Role is ${this.mainInfo}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    for(let player of this.target){
      if(this.game.formatRole(this.game.formatRoleInternal(player.role.name,player.role.modifier)) == this.mainInfo){
        return true;
      }
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
    if (this.game.getRoleAlignment(this.targetRole) == this.creator.role.alignment)
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.game.getRoleAlignment(this.targetRole) == this.creator.role.alignment) {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {

    let temp = Random.randArrayVal(this.target);
    this.targetRole = temp.role.name;

    let role = temp.getRoleAppearance(this.investType);
    let trueRole = this.game.formatRoleInternal(
      temp.role.name,
      temp.role.modifier
    );
    this.trueRole = this.game.formatRole(trueRole);
    this.mainInfo = this.trueRole;
      
    
    this.mainInfo = this.trueRole;
    this.targetRole = this.target.role.name;
  }
  makeFalse() {

  let fakePlayers = this.game.alivePlayers().filter((p) => p != this.creator && this.game.formatRole(this.game.formatRoleInternal(p.role.name,p.role.modifier)) == this.mainInfo);
    fakePlayers = Random.randomizeArray(fakePlayers);
    this.target = [fakePlayers[0], fakePlayers[1]]

  }
  makeFavorable() {
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
    let roles = this.getFakeRole(this.target, 1, true, this.investType, "Evil");

    this.mainInfo = roles[0];
    this.targetRole = roles[0].split(":")[0];
  }
};
