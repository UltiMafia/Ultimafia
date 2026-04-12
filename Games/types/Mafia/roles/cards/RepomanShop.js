const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

const SHOP_POOL = [
  { name: "Gun",             type: "item", internal: "Gun",          cost: 3 },
  { name: "Rifle",           type: "item", internal: "Rifle",        cost: 4 },
  { name: "Knife",           type: "item", internal: "Knife",        cost: 2 },
  { name: "Armor",           type: "item", internal: "Armor",        cost: 3 },
  { name: "Key",             type: "item", internal: "Key",          cost: 2 },
  { name: "Tract",           type: "item", internal: "Tract",        cost: 2 },
  { name: "Bomb",            type: "item", internal: "Bomb",         cost: 3 },
  { name: "TNT",             type: "item", internal: "TNT",          cost: 4 },
  { name: "Shield",          type: "item", internal: "Shield",       cost: 3 },
  { name: "Crystal Ball",    type: "item", internal: "CrystalBall",  cost: 2 },
  { name: "Candle",          type: "item", internal: "Candle",       cost: 2 },
  { name: "Falcon",          type: "item", internal: "Falcon",       cost: 2 },
  { name: "Envelope",        type: "item", internal: "Envelope",     cost: 1 },
  { name: "Syringe",         type: "item", internal: "Syringe",      cost: 5 },
  { name: "Sceptre",         type: "item", internal: "Sceptre",      cost: 6 },
  { name: "Whiskey",         type: "item", internal: "Whiskey",      cost: 2 },
  { name: "Bread",           type: "item", internal: "Bread",        cost: 1 },
  { name: "Coffee",          type: "item", internal: "Coffee",       cost: 3 },
  { name: "Jack-In-The-Box", type: "item", internal: "JackInTheBox", cost: 3 },
  { name: "Match",           type: "item", internal: "Match",        cost: 2 },
  { name: "Timebomb",        type: "item", internal: "Timebomb",     cost: 4 },
  { name: "Revolver",        type: "item", internal: "Revolver",     cost: 3 },
  { name: "Haunted Mask",    type: "item", internal: "HauntedMask",  cost: 4 },
  { name: "Shaving Cream",   type: "item", internal: "ShavingCream", cost: 3 },
  { name: "Snowball",        type: "item", internal: "Snowball",     cost: 2 },
  { name: "Ice Cream",       type: "item", internal: "IceCream",     cost: 2 },
  { name: "Notebook",        type: "item", internal: "Notebook",     cost: 4 },
];

const KEEP_FOR_SELF = "Keep for Yourself";

function rollShop() {
  return Random.randomizeArray([...SHOP_POOL]).slice(0, 3);
}

function dropExistingShop(player) {
  for (let i = player.items.length - 1; i >= 0; i--) {
    if (player.items[i].name === "Repoman Shop") player.items[i].drop();
  }
}

function grantShop(player) {
  const options = rollShop();
  player.role.data.shopOptions = options;
  const rerollAvailable = !player.role.data.rerollUsedThisGame;
  player.holdItem("RepomanShopItem", options, rerollAvailable);

  const summary = options
    .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
    .join(" | ");
  player.queueAlert(
    `:moneybag: Shop is open! You have ${player.role.data.gold || 0} Gold. Today's options: ${summary}`
  );
}

module.exports = class RepomanShop extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        this.data.gold = this.data.gold || 0;
        this.data.rerollUsedThisGame = false;
        this.data.pendingPurchase = null;
        this.data.shopPool = SHOP_POOL;

        const hasBanker = this.game.players
          .array()
          .some((p) => p.role.name === "Banker");
        if (hasBanker) {
          this.data.gold += 3;
          this.player.queueAlert(
            `:moneybag: A Banker is present in this game. You start with 3 Gold.`
          );
        }
      },

      death: function (player, killer, deathType) {
        if (!this.player.alive) return;
        if (player === this.player) return;
        if (player.role.alignment !== "Village") return;

        this.data.gold = (this.data.gold || 0) + 2;
        this.player.queueAlert(
          `:moneybag: A Village player has fallen. You gained 2 Gold. (Total: ${this.data.gold})`
        );
      },

      state: function (stateInfo) {
        if (!this.player.alive) return;
        if (!stateInfo.name.match(/Day/)) return;

        dropExistingShop(this.player);
        grantShop(this.player);
      },

      playerHasJoinedMeetings: function (player) {
        if (player !== this.player) return;

        const giftTargets = [KEEP_FOR_SELF];
        for (let p of this.game.alivePlayers()) {
          if (p !== this.player) giftTargets.push(p.name);
        }

        for (let meeting of this.player.getMeetings()) {
          if (meeting.name === "Gift Item To?") meeting.targets = giftTargets;
        }
      },
    };

    this.meetings = {
      "Gift Item To?": {
        actionName: "Gift item to?",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets: [KEEP_FOR_SELF],
        shouldMeet: function () {
          return !!this.data.pendingPurchase;
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          role: this.role,
          run: function () {
            const option = this.role.data.pendingPurchase;
            if (!option) return;
            this.role.data.pendingPurchase = null;

            if (this.target === KEEP_FOR_SELF) {
              deliverToPlayer(this.actor, option, false);
              return;
            }

            const recipient = this.game.players
              .array()
              .find((p) => p.name === this.target && p.alive);
            if (!recipient) {
              deliverToPlayer(this.actor, option, false);
              return;
            }

            deliverToPlayer(recipient, option, true);
          },
        },
      },

    };
  }
};

function deliverToPlayer(player, option, isGift) {
  const game = player.game;
  if (option.type !== "item") return;

  const listener = function (stateInfo) {
    if (!stateInfo.name.match(/Night/)) return;
    game.events.removeListener("state", listener);
    if (!player.alive) return;
    player.holdItem(option.internal);
    if (isGift) {
      player.queueAlert(`:gift: You have been gifted a ${option.name}!`);
    } else {
      player.queueAlert(`:gift: Your ${option.name} has been delivered!`);
    }
  };
  game.events.on("state", listener);
}
