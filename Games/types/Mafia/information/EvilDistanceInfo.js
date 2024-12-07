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

module.exports = class EvilDistanceInfo extends Information{
  constructor(creator, game) {
    super("Evil Distance Info", creator, game);

            let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter(
              (p) =>
               this.isAppearanceEvil(p)
            );

            if (evilPlayers.length <= 1) {
              this.mainInfo = "Not Enough"
              return;
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(evilTarget);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var found = false;

          this.maxDistance = Math.floor(this.game.alivePlayers().length/2)-1;
          if(this.maxDistance<1){
            this.maxDistance = 1;
          }
    

    
            if(this.mainInfo != "Not Enough"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;

              if (this.isAppearanceEvil(alive[rightIdx])) {
                found = true;
                break;
              } else if (this.isAppearanceEvil(alive[leftIdx])) {
                found = true;
                break;
              } else {
                distance = x;
              }
            }
            }
          

this.mainInfo = distance;
  }

  getInfoRaw(){
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated(){
    super.getInfoRaw();
    return `You Learn that there are ${this.mainInfo} Players beetween two Evil Players.`
  }

  isTrue() {
    let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter(
              (p) =>
               this.isEvil(p)
            );
            var distance = 0;
            if (evilPlayers.length <= 1) {
              //this.mainInfo = "Not Enough"
              distance = "Not Enough";
              return;
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(evilTarget);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            //var distance = 0;
            var found = false;
    

    
            if(distance != "Not Enough"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;

              if (this.isEvil(alive[rightIdx])) {
                found = true;
                break;
              } else if (this.isEvil(alive[leftIdx])) {
                found = true;
                break;
              } else {
                distance = x;
              }
            }
            }
    if(this.mainInfo == distance){
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
      if(this.mainInfo == 0){
        return true;
      }
    else{
      return false;
    }
  }
  isUnfavorable(){
    if(this.mainInfo == this.maxDistance){
        return true;
      }
    else{
      return false;
    }
  }

  makeTrue() {
            let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter(
              (p) =>
               this.isEvil(p)
            );
            var distance = 0;
            if (evilPlayers.length <= 1) {
              //this.mainInfo = "Not Enough"
              distance = "Not Enough";
              return;
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(evilTarget);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            //var distance = 0;
            var found = false;
    

    
            if(distance != "Not Enough"){
            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;

              if (this.isEvil(alive[rightIdx])) {
                found = true;
                break;
              } else if (this.isEvil(alive[leftIdx])) {
                found = true;
                break;
              } else {
                distance = x;
              }
            }
            }
    this.mainInfo = distance;
  }
  makeFalse() {
   this.makeTrue();
    if(this.mainInfo == 0){
      this.mainInfo = this.maxDistance;
    }
    else if(this.mainInfo == this.maxDistance){
      this.mainInfo = 0;
    }
    else{
      this.mainInfo = this.mainInfo+1;
    }
  }
  makeFavorable(){
    this.mainInfo = 0;
  }
  makeUnfavorable(){
    this.mainInfo = this.maxDistance;
  }
};
