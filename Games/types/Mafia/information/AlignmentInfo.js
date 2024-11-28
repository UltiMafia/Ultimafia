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

module.exports = class AlignmentInfo extends Information{
  constructor(creator, game, target) {
    super("Alignment Info", creator, game);
    if(target = null){
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;
    let role = this.target.getAppearance("investigate", true);
    let trueRole = this.target.getAppearance("real", true);
    if(role = trueRole){
       this.mainInfo = this.target.faction;
    }
    else{
      this.mainInfo = game.getRoleAlignment(role);
    }
  }

  getInfoRaw(){
    return this.mainInfo;
  }

  getInfoFormated(){
    if(this.randomTarget == true){
      return `You Learn that your ${this.target.name}'s Alignment is ${this.mainInfo}`
    }
    return `You Learn that your Target's Alignment is ${this.mainInfo}`
  }

  isTrue() {
    if(this.target.faction == this.mainInfo){
      return true;
    }
    else{
      return false;
    }
  }
  isFalse() {
    if(this.target.faction != this.mainInfo){
      return true;
    }
    else{
      return false;
    }
  }
  isFavorable(){
    if(this.mainInfo != this.creator.faction){
      return false;
    }
    else{
      return true;
    }
  }
  isUnfavorable(){
    if(this.mainInfo == this.creator.faction){
      return false;
    }
    else{
      return true;
    }
  }

  makeTrue() {
    this.mainInfo = this.target.faction;
  }
  makeFalse() {
    if(EVIL_FACTIONS.includes(this.target.faction) || (this.target.faction == "Independent" && this.game.getRoleTags(this.target.role.name).includes("Hostile"))){
      this.mainInfo = "Village";
    }
    else{
      for(let player of this.game.players){
        if(EVIL_FACTIONS.includes(player) && player.faction != this.target.faction){
          this.mainInfo = player.faction;
        }
      }
    }
  }
  makeFavorable(){
      this.mainInfo = this.creator.faction;
  }
  makeUnfavorable(){
    if(EVIL_FACTIONS.includes(this.creator.faction) || (this.creator.faction == "Independent" && this.game.getRoleTags(this.creator.role.name).includes("Hostile"))){
      this.mainInfo = "Village";
    }
    else{
      for(let player of this.game.players){
        if(EVIL_FACTIONS.includes(player) && player.faction != this.creator.faction){
          this.mainInfo = player.faction;
        }
      }
    }
  }
};
