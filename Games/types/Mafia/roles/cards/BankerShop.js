const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

const BANKER_SHOP_POOL = [
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

const GOLDEN_TICKET = { name: "Golden Ticket", internal: "GoldenTicket", cost: 10 };

function rollBankerOptions() {
  const shuffled = Random.randomizeArray([...BANKER_SHOP_POOL]);
  return [...shuffled.slice(0, 3), GOLDEN_TICKET];
}

function rollGlobalOptions() {
  const shuffled = Random.randomizeArray([...BANKER_SHOP_POOL]);
  return shuffled.slice(0, 3);
}

module.exports = class BankerShop extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.data.goldenTicketWon) {
          winners.addPlayer(this.player, "Golden Ticket");
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        this.data.bankerShopOptions = rollBankerOptions();
        this.data.shopAnnounced = false;

        for (let p of this.game.players) {
          if (p.role.name === "Liquidator") continue;
          p.Gold = p.Gold || 0;
          p.role.data.globalShopOptions = rollGlobalOptions();
          p.role.data.globalShopGold = 0;
          p.holdItem("GlobalShop");
        }
      },

      state: function (stateInfo) {
        if (!this.player.alive) return;

        if (
          stateInfo.name.match(/Day/) ||
          stateInfo.name.match(/Night/)
        ) {
          this.player.Gold = (this.player.Gold || 0) + 1;
        }

        if (stateInfo.name.match(/Day/)) {
          if (!this.data.shopAnnounced) {
            this.data.shopAnnounced = true;
            this.game.sendAlert(
              `:moneybag: The Banker has opened their shop for the duration of this game. Players may purchase items each day!`
            );
          }

          this.data.bankerShopOptions = rollBankerOptions();

          for (let p of this.game.alivePlayers()) {
            if (p.role.name === "Liquidator") continue;
            p.role.data.globalShopOptions = rollGlobalOptions();

            const gold = p.role.data.globalShopGold || 0;
            const optionsList = p.role.data.globalShopOptions
              .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
              .join(" | ");

            p.queueAlert(
              `:moneybag: You have ${gold} Gold. Today's shop options: ${optionsList}`
            );
          }

          const bankerOptions = this.data.bankerShopOptions
            .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
            .join(" | ");
          this.player.queueAlert(
            `:moneybag: You have ${this.player.Gold} Gold. Your shop options: ${bankerOptions}`
          );
        }
      },

      death: function (player, killer, deathType) {
        if (!this.player.alive) return;
        if (player === this.player) return;

        for (let p of this.game.alivePlayers()) {
          if (p.role.name === "Liquidator") continue;
          if (p === player) continue;
          if (p.role.alignment !== player.role.alignment) {
            p.role.data.globalShopGold =
              (p.role.data.globalShopGold || 0) + 1;
            p.queueAlert(
              `:moneybag: A player on the opposite alignment has died. You have received 1 Gold. (Total: ${p.role.data.globalShopGold})`
            );
          }
        }
      },
    };

    this.meetings = {
      "Banker Shop": {
        actionName: "Browse Shop",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: function () {
          return (this.role.data.bankerShopOptions || []).map(
            (o) => `${o.name} (${o.cost} Gold)`
          );
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            const options = this.role.data.bankerShopOptions || [];
            const selected = this.target;

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

            if (option.internal === "GoldenTicket") {
              this.role.data.goldenTicketWon = true;
              this.game.sendAlert(
                `:ticket: The Banker has successfully purchased a Golden Ticket and won!`
              );
              this.actor.role.revealToAll();

              const isComplacent =
                this.actor.role.modifier &&
                this.actor.role.modifier.includes("Complacent");

              if (!isComplacent) {
                this.game.endGame(null);
              }
              return;
            }

            this.actor.holdItem(option.internal);
            this.actor.queueAlert(
              `:moneybag: You purchased ${option.name} for ${option.cost} Gold. Remaining Gold: ${this.actor.Gold}.`
            );
          },
        },
      },

      "Invest": {
        actionName: "Invest Gold",
        states: ["Night"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: function () {
          const gold = this.player.Gold || 0;
          const options = [];
          for (let i = 1; i <= gold; i++) {
            options.push(`Invest ${i} Gold`);
          }
          options.push("Do not invest");
          return options;
        },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            const selected = this.target;
            if (selected === "Do not invest") return;

            const amount = parseInt(
              selected.replace("Invest ", "").replace(" Gold", "")
            );
            if (isNaN(amount) || amount <= 0) return;

            const currentGold = this.actor.Gold || 0;
            if (amount > currentGold) {
              this.actor.queueAlert(
                `:moneybag: You do not have enough Gold to invest ${amount}.`
              );
              return;
            }

            this.actor.Gold -= amount;
            this.role.data.investAmount = amount;
            this.actor.queueAlert(
              `:moneybag: You have invested ${amount} Gold. Results will be revealed tomorrow.`
            );
          },
        },
      },
    };

    this.passiveActions = [
      {
        actor: role.player,
        state: "Day",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT - 5,
        labels: ["hidden"],
        run: function () {
          const amount = this.role.data.investAmount;
          if (!amount || amount <= 0) return;

          this.role.data.investAmount = 0;

          const roll = Random.randInt(1, 100);
          let result;
          let gained;

          if (roll <= 50) {
            gained = amount * 2;
            result = `:chart_with_upwards_trend: The market was strong! Your investment of ${amount} Gold doubled to ${gained} Gold!`;
          } else if (roll <= 60) {
            gained = amount * 3;
            result = `:tada: The market was exceptional! Your investment of ${amount} Gold tripled to ${gained} Gold!`;
          } else if (roll <= 70) {
            gained = Math.floor(amount / 2);
            result = `:chart_with_downwards_trend: The market was rough. You lost half your investment and recovered ${gained} Gold.`;
          } else {
            gained = 0;
            result = `:x: The market crashed! Your investment of ${amount} Gold was lost entirely.`;
          }

          this.actor.Gold = (this.actor.Gold || 0) + gained;
          this.actor.queueAlert(result);
          this.actor.queueAlert(
            `:moneybag: Current Gold: ${this.actor.Gold}`
          );
        },
      },
    ];
  }
};