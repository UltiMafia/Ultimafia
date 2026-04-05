const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

const SHOP_POOL = [
  // Items - delivered next night
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

  // Misc - usable same day
  { name: "Reveal a Player's Role to Mafia", type: "misc", internal: "RoleReveal", cost: 2 },
  { name: "Double Kill Next Night",          type: "misc", internal: "DoubleKill", cost: 5 },
];

function rollShopOptions() {
  const shuffled = Random.randomizeArray([...SHOP_POOL]);
  return shuffled.slice(0, 3);
}

module.exports = class LiquidatorShop extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        const hasBanker = this.game.players.some(
          (p) => p.role.name === "Banker"
        );
        if (hasBanker) {
          this.player.Gold = (this.player.Gold || 0) + 3;
          this.player.queueAlert(
            `:moneybag: A Banker is present in this game. You start with 3 Gold.`
          );
        }
      },

      death: function (player, killer, deathType) {
        if (!this.player.alive) return;
        if (player === this.player) return;
        if (player.role.alignment !== "Village") return;

        this.player.Gold = (this.player.Gold || 0) + 1;
        this.player.queueAlert(
          `:moneybag: A Village player has fallen. You gained 1 Gold. (Total: ${this.player.Gold})`
        );
      },

      state: function (stateInfo) {
        if (!this.player.alive) return;

        if (stateInfo.name.match(/Day/)) {
          this.data.doubleKillActive = false;
          this.data.shopOptions = rollShopOptions();
          this.data.rerollUsedThisGame = this.data.rerollUsedThisGame || false;

          const optionsList = this.data.shopOptions
            .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
            .join(" | ");

          this.player.queueAlert(
            `:moneybag: Shop is open! You have ${this.player.Gold || 0} Gold. Today's options: ${optionsList}`
          );
        }
      },
    };

    this.meetings = {
      "Liquidator Shop": {
        actionName: "Browse Shop",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: function () {
          const options = this.role.data.shopOptions || [];
          const entries = options.map((o) => `${o.name} (${o.cost} Gold)`);
          if (!this.role.data.rerollUsedThisGame && options.length > 0) {
            entries.push("Reroll Shop (Free, Once Per Game)");
          }
          return entries;
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            const options = this.role.data.shopOptions || [];
            const selected = this.target;

            if (selected === "Reroll Shop (Free, Once Per Game)") {
              if (this.role.data.rerollUsedThisGame) {
                this.actor.queueAlert(
                  `:moneybag: You have already used your reroll this game.`
                );
                return;
              }
              this.role.data.rerollUsedThisGame = true;
              this.role.data.shopOptions = rollShopOptions();
              const newList = this.role.data.shopOptions
                .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
                .join(" | ");
              this.actor.queueAlert(
                `:moneybag: Shop rerolled! New options: ${newList}`
              );
              return;
            }

            const option = options.find(
              (o) => selected === `${o.name} (${o.cost} Gold)`
            );
            if (!option) return;

            const currentGold = this.actor.Gold || 0;
            if (currentGold < option.cost) {
              this.actor.queueAlert(
                `:moneybag: You cannot afford ${option.name}. You have ${currentGold} Gold and need ${option.cost}.`
              );
              return;
            }

            this.actor.Gold -= option.cost;
            this.actor.queueAlert(
              `:moneybag: You purchased ${option.name} for ${option.cost} Gold. Remaining Gold: ${this.actor.Gold}.`
            );
            this.role.data.pendingPurchase = option;
          },
        },
      },

      "Gift or Keep": {
        actionName: "Gift or Keep?",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: ["Keep for myself", "Gift to a player"],
        shouldMeet: function () {
          return !!this.role.data.pendingPurchase;
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            const option = this.role.data.pendingPurchase;
            if (!option) return;

            if (this.target === "Keep for myself") {
              this._deliverToPlayer(this.actor, option, false);
              delete this.role.data.pendingPurchase;
            } else {
              this.role.data.giftingPurchase = option;
              delete this.role.data.pendingPurchase;
            }
          },
        },
      },

      "Select Gift Target": {
        actionName: "Gift to Player",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        targets: {
          include: ["alive"],
          exclude: ["self"],
        },
        shouldMeet: function () {
          return !!this.role.data.giftingPurchase;
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            const option = this.role.data.giftingPurchase;
            if (!option) return;

            this._deliverToPlayer(this.target, option, true);
            delete this.role.data.giftingPurchase;
          },
        },
      },

      "Mafia Double Kill": {
        actionName: "Mafia Double Kill",
        states: ["Night"],
        flags: ["group", "voting", "multiActor", "Important"],
        targets: {
          include: ["alive"],
          exclude: ["membersIfOpen"],
        },
        shouldMeet: function () {
          const liquidator = this.game.players.find(
            (p) => p.role.name === "Liquidator" && p.alive
          );
          return liquidator?.role.data.doubleKillActive === true;
        },
        action: {
          labels: ["kill", "mafia"],
          priority: PRIORITY_MAFIA_KILL + 1,
          run: function () {
            if (this.dominates()) {
              this.target.kill("basic", this.actor);
            }
          },
        },
      },
    };
  }

  _deliverToPlayer(player, option, isGift) {
    const game = player.game;

    if (option.type === "item") {
      game.once("phaseBegin:Night", function () {
        player.holdItem(option.internal);
        if (isGift) {
          player.queueAlert(
            `:gift: You have been gifted a ${option.name}!`
          );
        } else {
          player.queueAlert(
            `:gift: Your ${option.name} has been delivered!`
          );
        }
      });
      return;
    }

    switch (option.internal) {
      case "RoleReveal":
        player.holdItem("LiquidatorReveal");
        if (isGift) {
          player.queueAlert(
            `:gift: You have been gifted Liquidator Intel. Use it to reveal a player's role to the Mafia!`
          );
        } else {
          player.queueAlert(
            `:briefcase: You may now reveal a player's role to the Mafia!`
          );
        }
        break;

      case "DoubleKill":
        this.data.doubleKillActive = true;
        for (let p of player.game.alivePlayers()) {
          if (p.role.alignment === "Mafia") {
            p.queueAlert(
              `:knife: The Liquidator has purchased a Double Kill. The Mafia may kill a second target tonight!`
            );
          }
        }
        break;
    }
  }
};