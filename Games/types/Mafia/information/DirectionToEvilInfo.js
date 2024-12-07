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

module.exports = class DirectionToEvilInfo extends Information{
  constructor(creator, game, target) {
    super("Direction To Evil Info", creator, game);
    if(target == null){
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

     let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Cult" || this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Mafia");
            let info = "";
            if (evilPlayers.length <= 0) {
             info = "Not Applicable";
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(this.actor);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var found = false;
            //let info = "";
            if(info != "Not Applicable"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;
              leftAlign = alive[leftIdx].getAppearance("investigate", true);
              rightAlign = alive[rightIdx].getAppearance("investigate", true);

              if(rightAlign == alive[rightIdx].role.name){
                rightAlign = alive[rightIdx].faction;
              }
               else{
              rightAlign = game.getRoleAlignment(rightAlign);
              }

              if(leftAlign == alive[leftIdx].role.name){
                leftAlign = alive[leftIdx].faction;
              }
               else{
              leftAlign = game.getRoleAlignment(leftAlign);
              }
              
        if(rightAlign == "Village" || (rightAlign == "Independent" && !(this.game.getRoleTags(alive[rightIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Below";
                break;
          }
            
        if(leftAlign == "Village" || (leftAlign == "Independent" && !(this.game.getRoleTags(alive[leftIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Above";
                break;
          }
              if(!found){
                distance = x;
              }
            }
            }
this.mainInfo = info;
  }

  getInfoRaw(){
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated(){
    super.getInfoRaw();
    if(this.target == this.creator){
      return `You Learn that the closest Evil Player to you is ${this.mainInfo} you on the Player List`
    }
      if(this.randomTarget == true){
      return `You Learn that the closest Evil Player to ${this.target.name} is ${this.mainInfo} them on the Player List`
    }
    return `You Learn that the closest Evil Player to your Target is ${this.mainInfo} them on the Player List`
  }

  isTrue() {
     let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Cult" || this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Mafia");
            let info = "";
            if (evilPlayers.length <= 0) {
             info = "Not Applicable";
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(this.actor);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var found = false;
            //let info = "";
            if(info != "Not Applicable"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;
              leftAlign = alive[leftIdx].faction;
              rightAlign = alive[rightIdx].faction;
              
        if(rightAlign == "Village" || (rightAlign == "Independent" && !(this.game.getRoleTags(alive[rightIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Below";
                break;
          }
            
        if(leftAlign == "Village" || (leftAlign == "Independent" && !(this.game.getRoleTags(alive[leftIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Above";
                break;
          }
              if(!found){
                distance = x;
              }
            }
            }
    if(this.mainInfo == info){
      return true;
    }
    else{
      return false;
    }
  }
  isFalse() {
  if(this.isTrue()){
    return false;
  }
    else{
      return true;
    }
  }
  isFavorable(){
      return true;
  }
  isUnfavorable(){
      return true;
  }

  makeTrue() {
         let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter((p) => this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Cult" || this.game.getRoleAlignment(p.getRoleAppearance().split(" (")[0]) == "Mafia");
            let info = "";
            if (evilPlayers.length <= 0) {
             info = "Not Applicable";
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(this.actor);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var found = false;
            //let info = "";
            if(info != "Not Applicable"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;
              leftAlign = alive[leftIdx].faction;
              rightAlign = alive[rightIdx].faction;
              
        if(rightAlign == "Village" || (rightAlign == "Independent" && !(this.game.getRoleTags(alive[rightIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Below";
                break;
          }
            
        if(leftAlign == "Village" || (leftAlign == "Independent" && !(this.game.getRoleTags(alive[leftIdx].role.name).includes("Hostile")))){
        
        }
          else{
                found = true;
                info = "Above";
                break;
          }
              if(!found){
                distance = x;
              }
            }
            }
    this.mainInfo = info;
  }
  makeFalse() {
   this.makeTrue();
    if(this.mainInfo == "Above"){
      this.mainInfo = "Below";
    }
    else if(this.mainInfo == "Below"){
      this.mainInfo = "Above";
    }
    else{
      this.mainInfo = "Below";
    }
  }
  makeFavorable(){
    this.makeFalse();
  }
  makeUnfavorable(){
    this.makeTrue();
  }
};
