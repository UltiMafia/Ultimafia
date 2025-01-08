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

module.exports = class PenguinInfo extends Information {
  constructor(creator, game, target, investType) {
    super("Penguin Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(
        this.game.alivePlayers().filter((p) => p)
      );
    }
    this.target = target;

   
      let infoVisitors = this.game.createInformation(
        "WatcherInfo",
        this.creator,
        this.game,
        this.target
      );
    infoVisitors.processInfo();
      let infoVisits = this.game.createInformation(
        "TrackerInfo",
        this.creator,
        this.game,
        this.target
      );
    infoVisits.processInfo();
      let infoItems = this.game.createInformation(
        "ItemInfo",
        this.creator,
        this.game,
        this.target
      );
    infoItems.processInfo();
    let chosenSecretType = Random.randInt(0, 2);
    switch (chosenSecretType){
      case 0:
      this.type = "item";
      this.mainInfo = infoItems;
      break;
      case 1:
        this.type = "visits";
      this.mainInfo = infoVisits;
      break;
    case 2:
        this.type = "visitors";
      this.mainInfo = infoVisitors;
      break;
    }
    

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    if(this.mainInfo.length > 0){
    return Random.randomizeArray(this.mainInfo)[0];
    }
    else{
      return this.mainInfo;
    }
  }

  getInfoFormated() {
    super.getInfoRaw();
    let info = Random.randomizeArray(this.mainInfo);
    switch (this.type){
      case "item";
        if(this.mainInfo.length > 0){
        return `A penguin waddles up to you and tells you that ${this.target.name} is holding ${info[0]}.`;
        }
        else{
          return `A penguin waddles up to you and tells you that ${this.target.name} is holding Nothing.`;
        }
      break;
  case "visits";
        if(this.mainInfo.length > 0){
        return `A penguin waddles up to you and tells you that ${this.target.name} visited ${info[0]}.`;
        }
        else{
          return `A penguin waddles up to you and tells you that ${this.target.name} visited no one.`;
        }
      break;
      case "visitors";
        if(this.mainInfo.length > 0){
        return `A penguin waddles up to you and tells you that ${this.target.name} was visited by ${info[0]}.`;
        }
        else{
          return `A penguin waddles up to you and tells you that ${this.target.name} was visited by no one.`;
        }
      break;
    }
    return `A penguin waddles up to you and tells you that ${this.target.name} is.`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    return this.mainInfo.isTrue();
  }
  isFalse() {
    return this.mainInfo.isFalse();
  }
  isFavorable() {
    return this.mainInfo.isFavorable();
  }
  isUnfavorable() {
    return return this.mainInfo.isUnfavorable();
  }

  makeTrue() {
    this.mainInfo.makeTrue();
  }
  makeFalse() {
    this.mainInfo.makeFalse();
  }
  makeFavorable() {
    this.mainInfo.makeFavorable();
  }
  makeUnfavorable() {
    this.mainInfo.makeFavorable();
  }
};
