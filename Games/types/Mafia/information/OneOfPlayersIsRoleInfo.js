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
    let validRoles = this.getAllowedRoles();
    
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (amount == null || amount <= 0) {
      amount = 2;
    }
    this.amount = amount;

    if(validRoles.length <= 0){
      this.mainInfo = "None";
      return;
    }
  let formattedRoles = validRoles.map((r) => this.game.formatRole(r));
    let validPlayers = this.game.alivePlayers().filter((p) => formattedRoles.includes(p.getRoleAppearance(this.investType)) && p != this.creator);
    if(validPlayers.length <= 0){
      validPlayers = this.game.players.filter((p) => formattedRoles.includes(p.getRoleAppearance(this.investType)) && p != this.creator);
    }
    if(validPlayers.length <= 0){
      this.mainInfo = "None";
      return;
    }

      target = [];
      target.push(Random.randArrayVal(validPlayers.filter((p) => !target.includes(p) && p != this.creator)));
      let role = target[0].getRoleAppearance(this.investType);
      this.targetRole = target[0].getRoleAppearance(this.investType).split((" ("))[0];
      for (let x = 0; x < amount-1; x++) {
        target.push(Random.randArrayVal(this.game.alivePlayers().filter((p) => !target.includes(p) && p != this.creator)));
      }
    
    this.target = target;
    
    let trueRole = this.game.formatRoleInternal(target[0].role.name, target[0].role.modifier);
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
    if(this.mainInfo == "None"){
      return `You couldn't find anyone to do the laundry of!`;
    }
    this.target = Random.randomizeArray(this.target);
    return `You did ${this.target[0].name} and ${this.target[1].name} laundry... one of them wears the clothes of a ${this.mainInfo}!`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    if(this.mainInfo == "None"){
      for (let player of this.game.players){
        if(this.getAllowedRoles().includes(this.game.formatRoleInternal(player.role.name, player.role.modifier))){
          return false;
        }
      }
      return true;
    }
    for (let player of this.target) {
      if (
        this.game.formatRole(
          this.game.formatRoleInternal(player.role.name, player.role.modifier)
        ) == this.mainInfo
      ) {
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
    let villageRoles = this.getAllowedRoles().filter((r) => this.game.getRoleAlignment(r) == "Village" || (this.game.getRoleAlignment(r) == "Independent" && !this.game.getRoleTags(r).includes("Hostile")));
    if(villageRoles.length <= 0){
      return true;
    }
    if (
      this.game.getRoleAlignment(this.targetRole) == "Village" || (this.game.getRoleAlignment(this.targetRole) == "Independent" && !this.game.getRoleTags(this.targetRole).includes("Hostile"))
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    let evilRoles = this.getAllowedRoles().filter((r) => this.game.getRoleAlignment(r) != "Village" && !(this.game.getRoleAlignment(r) == "Independent" && this.game.getRoleTags(r).includes("Hostile")));
    if(evilRoles.length <= 0){
      return true;
    }
    if (
      this.game.getRoleAlignment(this.targetRole) == "Village" || (this.game.getRoleAlignment(this.targetRole) == "Independent" && !this.game.getRoleTags(this.targetRole).includes("Hostile")
    )) {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    let validRoles = this.getAllowedRoles();
    if(validRoles.length <= 0){
      this.mainInfo = "None";
      return;
    }

    let validPlayers = this.game.alivePlayers().filter((p) => validRoles.includes(this.game.formatRoleInternal(p.role.name, p.role.modifier)) && p != this.creator);
    if(validPlayers.length <= 0){
      validPlayers = this.game.players.filter((p) => validRoles.includes(this.game.formatRoleInternal(p.role.name, p.role.modifier)) && p != this.creator);
    }
    if(validPlayers.length <= 0){
      this.mainInfo = "None";
      return;
    }

      let target = [];
      target.push(Random.randArrayVal(validPlayers.filter((p) => !target.includes(p) && p != this.creator)));
      this.targetRole = target[0].role.name;
      this.trueRole = this.game.formatRoleInternal(target[0].role.name, target[0].role.modifier);
      for (let x = 0; x <  this.amount-1; x++) {
        target.push(Random.randArrayVal(this.game.alivePlayers().filter((p) => !target.includes(p) && p != this.creator)));
      }

    this.target = target;
    

    let trueRole = this.trueRole;
    this.trueRole = this.game.formatRole(trueRole);
    this.mainInfo = this.trueRole;
  }
  makeFalse() {
    this.makeTrue();
    let validRoles = this.getAllowedRoles();
    if(validRoles.length <= 0){
      this.mainInfo = "None";
      return;
    }
    if(this.mainInfo == "None"){
      this.mainInfo = this.game.formatRole(Random.randArrayVal(validRoles));
    }
    let fakePlayers = this.game
      .alivePlayers()
      .filter(
        (p) =>
          p != this.creator &&
          this.game.formatRole(
            this.game.formatRoleInternal(p.role.name, p.role.modifier)
          ) != this.mainInfo
      );
    fakePlayers = Random.randomizeArray(fakePlayers);
    this.target = [fakePlayers[0], fakePlayers[1]];
  }
  makeFavorable() {
    let validRoles = this.getAllowedRoles();
   let villageRoles = validRoles.filter((r) => this.game.getRoleAlignment(r) == "Village" || (this.game.getRoleAlignment(r) == "Independent" && !this.game.getRoleTags(r).includes("Hostile")));
    if(villageRoles.length <= 0){
      return;
    }

    this.mainInfo =  this.game.formatRole(Random.randArrayVal(villageRoles));;
    this.targetRole = this.mainInfo.split(" (")[0];
  }
  makeUnfavorable() {
    let validRoles = this.getAllowedRoles();
   let villageRoles = validRoles.filter((r) => this.game.getRoleAlignment(r) != "Village" && !(this.game.getRoleAlignment(r) == "Independent" && !this.game.getRoleTags(r).includes("Hostile")));
    if(villageRoles.length <= 0){
      return;
    }

    this.mainInfo =  this.game.formatRole(Random.randArrayVal(villageRoles));;
    this.targetRole = this.mainInfo.split(" (")[0];
  }

getAllowedRoles(){
  let roles = this.game.PossibleRoles;
  let isLoyal = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Loyal");
  let isDisloyal = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Disloyal");
  let isSimple = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Simple");
  let isComplex = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Complex");
  let isHoly = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Holy");
  let isUnholy = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Unholy");
  let isRefined = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Refined");
  let isUnrefined = this.game.getRoleTags(this.game.formatRoleInternal(this.creator.role.name, this.creator.role.modifier)).includes("Unrefined");

  if(isLoyal){
    roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village" || (this.game.getRoleAlignment(r) == "Independent" && !this.game.getRoleTags(r).includes("Hostile")));
  }
  if(isDisloyal){
    roles = roles.filter((r) => this.game.getRoleAlignment(r) != "Village" && !(this.game.getRoleAlignment(r) == "Independent" && !this.game.getRoleTags(r).includes("Hostile")));
  }
  if(isSimple){
    roles = roles.filter((r) => r.split(":")[0] == "Villager" || r.split(":")[0] == "Mafioso" || r.split(":")[0] == "Cultist" || r.split(":")[0] == "Grouch");
  }
  if(isComplex){
    roles = roles.filter((r) => r.split(":")[0] != "Villager" && r.split(":")[0] != "Mafioso" && r.split(":")[0] != "Cultist" && r.split(":")[0] != "Grouch");
  }
  if(isHoly){
    roles = roles.filter((r) => !this.game.getRoleTags(r).includes("Demonic"));
  }
  if(isUnholy){
    roles = roles.filter((r) => this.game.getRoleTags(r).includes("Demonic"));
  }
  if(isRefined){
    roles = roles.filter((r) => !this.game.getRoleTags(r).includes("Banished"));
  }
  if(isUnrefined){
    roles = roles.filter((r) => this.game.getRoleTags(r).includes("Banished"));
  }

  return roles;
  
}


  
};
