const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

const SHOP_POOL = [
  { name: "Gun",             internal: "Gun",          cost: 3 },
  { name: "Rifle",           internal: "Rifle",        cost: 4 },
  { name: "Knife",           internal: "Knife",        cost: 2 },
  { name: "Armor",           internal: "Armor",        cost: 3 },
  { name: "Key",             internal: "Key",          cost: 2 },
  { name: "Tract",           internal: "Tract",        cost: 2 },
  { name: "Bomb",            internal: "Bomb",         cost: 3 },
  { name: "TNT",             internal: "TNT",          cost: 4 },
  { name: "Shield",          internal: "Shield",       cost: 3 },
  { name: "Crystal Ball",    internal: "CrystalBall",  cost: 2 },
  { name: "Candle",          internal: "Candle",       cost: 2 },
  { name: "Falcon",          internal: "Falcon",       cost: 2 },
  { name: "Envelope",        internal: "Envelope",     cost: 1 },
  { name: "Syringe",         internal: "Syringe",      cost: 5 },
  { name: "Sceptre",         internal: "Sceptre",      cost: 6 },
  { name: "Whiskey",         internal: "Whiskey",      cost: 2 },
  { name: "Bread",           internal: "Bread",        cost: 1 },
  { name: "Coffee",          internal: "Coffee",       cost: 3 },
  { name: "Jack-In-The-Box", internal: "JackInTheBox", cost: 3 },
  { name: "Match",           internal: "Match",        cost: 2 },
  { name: "Timebomb",        internal: "Timebomb",     cost: 4 },
  { name: "Revolver",        internal: "Revolver",     cost: 3 },
  { name: "Haunted Mask",    internal: "HauntedMask",  cost: 4 },
  { name: "Shaving Cream",   internal: "ShavingCream", cost: 3 },
  { name: "Snowball",        internal: "Snowball",     cost: 2 },
  { name: "Ice Cream",       internal: "IceCream",     cost: 2 },
  { name: "Notebook",        internal: "Notebook",     cost: 4 },
];

const NO_PURCHASE = "No Purchase";

function rollShop() {
  return Random.randomizeArray([...SHOP_POOL]).slice(0, 3);
}

function optionLabel(o) {
  return `${o.name} (${o.cost} Gold)`;
}

module.exports = class GlobalShop extends Item {
  constructor() {
    super("Global Shop");
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.listeners = {
      state: function (stateInfo) {
        if (!this.holder || !this.holder.alive) return;
        if (!stateInfo.name.match(/Day/)) return;

        this.holder.role.data.globalShopOptions = rollShop();
        const summary = this.holder.role.data.globalShopOptions
          .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
          .join(" | ");
        this.holder.queueAlert(
          `:moneybag: You have ${this.holder.role.data.gold || 0} Gold. Today's shop: ${summary}`
        );
      },

      death: function (player) {
        if (!this.holder || !this.holder.alive) return;
        if (player === this.holder) return;
        if (player.role.alignment === this.holder.role.alignment) return;

        this.holder.role.data.gold = (this.holder.role.data.gold || 0) + 1;
        this.holder.queueAlert(
          `:moneybag: A player on the opposite alignment has fallen. You gained 1 Gold. (Total: ${this.holder.role.data.gold})`
        );
      },

      playerHasJoinedMeetings: function (player) {
        if (player !== this.holder) return;

        const options = player.role.data.globalShopOptions || [];
        const targets = [...options.map(optionLabel), NO_PURCHASE];

        for (let meeting of player.getMeetings()) {
          if (meeting.name === "Global Shop") meeting.targets = targets;
        }
      },
    };

    this.meetings = {
      "Global Shop": {
        actionName: "Browse Shop",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: [NO_PURCHASE],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === NO_PURCHASE) return;

            const options = this.actor.role.data.globalShopOptions || [];
            const option = options.find((o) => optionLabel(o) === this.target);
            if (!option) return;

            const gold = this.actor.role.data.gold || 0;
            if (gold < option.cost) {
              this.actor.queueAlert(
                `:moneybag: You cannot afford ${option.name}. You have ${gold} Gold and need ${option.cost}.`
              );
              return;
            }

            this.actor.role.data.gold = gold - option.cost;
            this.actor.holdItem(option.internal);
            this.actor.queueAlert(
              `:moneybag: You purchased ${option.name} for ${option.cost} Gold. Remaining Gold: ${this.actor.role.data.gold}.`
            );
          },
        },
      },
    };
  }
};
