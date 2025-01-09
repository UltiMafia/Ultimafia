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

module.exports = class ItemInfo extends Information {
  constructor(creator, game, target) {
    super("Item Info", creator, game);
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    let items = this.snoopAllItems(this.target, true);
    this.mainInfo = items;
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    let items = this.mainInfo;
    let itemsToAlert = "nothing";
    if (items.length > 0) {
      itemsToAlert = items.join(", ");
    }

    return `You learn that ${this.target.name} is holding ${itemsToAlert}.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

    getInfoSpecial() {
    let items = this.mainInfo;
    let itemsToAlert = "nothing";
    if (items.length > 0) {
      itemsToAlert = items.join(", ");
    }

    return `${this.target.name} is holding ${itemsToAlert}.`;

    //return `You Learn that your Target is ${this.mainInfo}`
  }

  isTrue() {
    let items = this.snoopAllItems(this.target, true);
    if (this.mainInfo.length != items.length) {
      return false;
    }
    for (let item of items) {
      if (!this.mainInfo.includes(item)) {
        return false;
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
    if (this.mainInfo.length <= 0) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (this.mainInfo.includes("a Gun") || this.mainInfo.includes("a Knife")) {
      return true;
    } else {
      return false;
    }
  }

  makeTrue() {
    let items = this.snoopAllItems(this.target, true);
    this.mainInfo = items;
  }
  makeFalse() {
    let items = this.snoopAllItems(this.target, true);

    if (items.length > 0) {
      items = [];
    } else {
      items.push("a Gun");
    }

    this.mainInfo = items;
  }
  makeFavorable() {
    this.mainInfo = [];
  }
  makeUnfavorable() {
    this.mainInfo.push("a Gun");
  }
};
