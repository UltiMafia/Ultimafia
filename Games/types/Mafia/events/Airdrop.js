const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../const/Priority");

const RANDOM_ITEMS = [
  "Gun",
  "Armor",
  "Bomb",
  "Knife",
  "Crystal Ball",
  "Whiskey",
  "Bread",
  "Key",
  "Falcon",
  "Tract",
  "Envelope",
  "Syringe",
  "Coffee",
  "Shield",
  "Candle",
];

const ITEM_MODIFIERS = {
  Armed: "Gun",
  Bulletproof: "Armor",
  Birdbrained: "Falcon",
  Caffeinated: "Coffee",
  Churchgoing: "Tract",
  Crystalline: "Crystal Ball",
  Explosive: "Bomb",
  Keyed: "Key",
  Luminous: "Candle",
  Macabre: "Syringe",
  Prosaic: "Envelope",
  Shielded: "Shield",
  Steeled: "Knife",
};

const ITEM_PHRASES = {
  Gun: "a Gun",
  Armor: "Armor",
  Bomb: "a Bomb",
  Knife: "a Knife",
  "Crystal Ball": "a Crystal Ball",
  Whiskey: "Whiskey",
  Bread: "Bread",
  Key: "a Key",
  Falcon: "a Falcon",
  Tract: "a Tract",
  Envelope: "an Envelope",
  Syringe: "a Syringe",
  Coffee: "a Coffee",
  Shield: "a Shield",
  Candle: "a Candle",
};

function formatItemPhrase(items) {
  const named = items.map((item) => ITEM_PHRASES[item] || item);
  if (named.length === 1) {
    return named[0];
  }
  if (named.length === 2) {
    return `${named[0]} and ${named[1]}`;
  }
  return `${named.slice(0, -1).join(", ")}, and ${named[named.length - 1]}`;
}

module.exports = class Airdrop extends Event {
  constructor(modifiers, game) {
    super("Airdrop", modifiers, game);
  }

  getItemsToGive() {
    const mods = this.modifiers ? this.modifiers.split("/") : [];
    const items = [];
    for (const mod of mods) {
      if (ITEM_MODIFIERS[mod]) {
        items.push(ITEM_MODIFIERS[mod]);
      }
    }
    if (items.length === 0) {
      items.push(Random.randArrayVal(RANDOM_ITEMS));
    }
    return items;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.generatePossibleVictims());
    const items = this.getItemsToGive();
    this.action = new Action({
      target: victim,
      game: this.game,
      priority: PRIORITY_ITEM_GIVER_DEFAULT,
      labels: ["hidden", "absolute"],
      event: this,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Airdrop! A cargo plane just dumped a crate containing ${formatItemPhrase(
              items
            )} on someone's lawn!`
          );
        }
        for (let item of items) {
          this.target.holdItem(item);
          this.target.queueGetItemAlert(item);
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
