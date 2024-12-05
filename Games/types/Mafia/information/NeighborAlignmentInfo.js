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

module.exports = class NeighborAlignmentInfo extends Information{
  constructor(creator, game, target) {
    super("Neighbor Alignment Info", creator, game);
    if(target == null){
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    let alive = this.game.alivePlayers();
    let index = alive.indexOf(this.target);

    const leftIdx = (index - 1 + alive.length) % alive.length;
    const rightIdx = (index + 1) % alive.length;
    this.neighbors [alive[leftIdx], alive[rightIdx]];


  this.evilCount = 0;
    let role;
    let trueRole;
    let faction;
  for(let neighbor of this.neighbors){
    role = neighbor.getAppearance("investigate", true);
    trueRole = neighbor.role.name;
    if(role = trueRole){
       faction = neighbor.faction;
    }
    else{
      faction = game.getRoleAlignment(role);
    }
    if(faction == "Village" || (faction == "Independent" && !(this.game.getRoleTags(neighbor.role.name).includes("Hostile")))){
        
      }
      else{
        this.evilCount = this.evilCount+1;
      }
  }
    
this.mainInfo = this.evilCount;
  }

  getInfoRaw(){
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated(){
    super.getInfoRaw();
    if(this.target == this.creator){
      return `You Learn that you have ${this.mainInfo} Evil Neighbors`
    }
      if(this.randomTarget == true){
      return `You Learn that your ${this.target.name} has ${this.mainInfo} Evil Neighbors`
    }
    return `You Learn that your Target has ${this.mainInfo} Evil Neighbors`
  }

  isTrue() {
    let role;
    let trueRole;
    let faction;
  for(let neighbor of this.neighbors){
   let evilCount = 0;
    if(neignbor.faction == "Village" || (neigbor.faction == "Independent" && !(this.game.getRoleTags(neighbor.role.name).includes("Hostile")))){
      }
      else{
        evilCount = evilCount+1;
      }
  }
    if(this.mainInfo == evilCount){
      return true;
    }
    return false;
  }
  isFalse() {
    let role;
    let trueRole;
    let faction;
  for(let neighbor of this.neighbors){
   let evilCount = 0;
    if(neignbor.faction == "Village" || (neigbor.faction == "Independent" && !(this.game.getRoleTags(neighbor.role.name).includes("Hostile")))){
      }
      else{
        evilCount = evilCount+1;
      }
  }
    if(this.mainInfo == evilCount){
      return false;
    }
    return true;
  }
  isFavorable(){
    if(this.mainInfo == 0){
      return true;
    }
    else{
      return false;
    }
  }
  isUnfavorable(){
    if(this.mainInfo == 2){
      return true;
    }
    else{
      return false;
    }
  }

  makeTrue() {
    let role;
    let trueRole;
    let faction;
  for(let neighbor of this.neighbors){
   let evilCount = 0;
    if(neignbor.faction == "Village" || (neigbor.faction == "Independent" && !(this.game.getRoleTags(neighbor.role.name).includes("Hostile")))){
      }
      else{
        evilCount = evilCount+1;
      }
  }
    this.mainInfo = evilCount;
  }
  makeFalse() {
    let role;
    let trueRole;
    let faction;
  for(let neighbor of this.neighbors){
   let evilCount = 0;
    if(neignbor.faction == "Village" || (neigbor.faction == "Independent" && !(this.game.getRoleTags(neighbor.role.name).includes("Hostile")))){
      }
      else{
        evilCount = evilCount+1;
      }
    if(evilCount > 0){
      this.mainInfo = 0;
      return;
    }
    else{
      this.mainInfo = 1;
    }

    
  }
  }
  makeFavorable(){
  this.mainInfo = 0;
  }
  makeUnfavorable(){
  this.mainInfo = 2;
  }
};
