const { addArticle } = require("../../../core/Utils");
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

module.exports = class WatcherRoleInfo extends Information {
  constructor(creator, game, target, forceCount) {
    super("Watcher Role Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    if (forceCount == null || forceCount == false) {
      this.forceCount = false;
    } else {
      this.forceCount = true;
    }
    this.target = target;

    let info = this.game.createInformation(
              "WatcherInfo",
              this.creator,
              this.game,
              this.target,
              null,
              this.forceCount
            );
            info.processInfo();

  let info2 = [];
    let temp;
      for(let person of info.mainInfo){
        if(person){
        info2.push(
         this.game.createInformation(
              "RoleInfo",
              this.creator,
              this.game,
              person
            );
        );
        }
      }
  for(let role of info2){
    role.processInfo();
  }
    this.watcherInfo = info;
    this.mainInfo = Random.randomizeArray(info2);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return Random.randomizeArray(this.mainInfo);
  }

  getInfoFormated() {
    super.getInfoRaw();
    let visitorNames = this.mainInfo.map((r) => addArticle(r.mainInfo));
    visitorNames = Random.randomizeArray(this.mainInfo);
    if (visitorNames.length == 0) visitorNames.push("no one");

    if (this.target == this.creator) {
      return `You learn that You were visited by ${visitorNames.join(
        ", "
      )} during the night.`;
    }

    return `You learn that ${
      this.target.name
    } was visited by ${visitorNames.join(", ")} during the night.`;
  }

  getInfoWithPlayerNames(){
    super.getInfoRaw();
    let visitorNames = [];
    for(let x = 0; x < this.mainInfo.length; x++){
      visitorsNames.push(`${this.mainInfo[x].target.name} ${addArticle(this.mainInfo[x].mainInfo)}`);
    }
    if (visitorNames.length == 0) visitorNames.push("no one");

    if (this.target == this.creator) {
      return `You learn that You were visited by ${visitorNames.join(
        ", "
      )} during the night.`;
    }

    return `You learn that ${
      this.target.name
    } was visited by ${visitorNames.join(", ")} during the night.`;
  }

  isTrue() {
    if(!this.watcherInfo.isTrue()){
      return false;
    }
    else{
      for(let x = 0; x<this.mainInfo.length){
        if(!this.mainInfo[x].isTrue()){
          return false;
        }
      }
    }
    return true;
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
      if(!this.watcherInfo.isFavorable()){
      return false;
    }
    else{
      for(let x = 0; x<this.mainInfo.length){
        if(!this.mainInfo[x].isFavorable()){
          return false;
        }
      }
    }
    return true;
  }
  isUnfavorable() {
    if(!this.watcherInfo.isUnfavorable()){
      return false;
    }
    else{
      for(let x = 0; x<this.mainInfo.length){
        if(!this.mainInfo[x].isUnfavorable()){
          return false;
        }
      }
    }
    return true;
  }

  makeTrue() {
     let info = this.game.createInformation(
              "WatcherInfo",
              this.creator,
              this.game,
              this.target,
              null,
              this.forceCount
            );
            info.makeTrue();

  let info2 = [];
    let temp;
      for(let person of info.mainInfo){
        if(person){
        info2.push(
         this.game.createInformation(
              "RoleInfo",
              this.creator,
              this.game,
              person
            );
        );
        }
      }
  for(let role of info2){
    role.makeTrue();
  }
    this.watcherInfo = info;
    this.mainInfo = Random.randomizeArray(info2);
  }
  makeFalse() {
     let info = this.game.createInformation(
              "WatcherInfo",
              this.creator,
              this.game,
              this.target,
              null,
              this.forceCount
            );
            info.makeFalse();

  let info2 = [];
    let temp;
      for(let person of info.mainInfo){
        if(person){
        info2.push(
         this.game.createInformation(
              "RoleInfo",
              this.creator,
              this.game,
              person
            );
        );
        }
      }
  for(let role of info2){
    role.makeFalse();
  }
    this.watcherInfo = info;
    this.mainInfo = Random.randomizeArray(info2);
  }
  makeFavorable() {
     let info = this.game.createInformation(
              "WatcherInfo",
              this.creator,
              this.game,
              this.target,
              null,
              this.forceCount
            );
            info.makeFavorable();

  let info2 = [];
    let temp;
      for(let person of info.mainInfo){
        if(person){
        info2.push(
         this.game.createInformation(
              "RoleInfo",
              this.creator,
              this.game,
              person
            );
        );
        }
      }
  for(let role of info2){
    role.makeFavorable();
  }
    this.watcherInfo = info;
    this.mainInfo = Random.randomizeArray(info2);
  }
  makeUnfavorable() {
        let info = this.game.createInformation(
              "WatcherInfo",
              this.creator,
              this.game,
              this.target,
              null,
              this.forceCount
            );
            info.makeUnfavorable();

  let info2 = [];
    let temp;
      for(let person of info.mainInfo){
        if(person){
        info2.push(
         this.game.createInformation(
              "RoleInfo",
              this.creator,
              this.game,
              person
            );
        );
        }
      }
  for(let role of info2){
    role.makeUnfavorable();
  }
    this.watcherInfo = info;
    this.mainInfo = Random.randomizeArray(info2);
  }
};
