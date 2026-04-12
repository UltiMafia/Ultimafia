const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

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

const GOLDEN_TICKET = { name: "Golden Ticket", internal: "GoldenTicket", cost: 10 };
const NO_PURCHASE = "No Purchase";

function rollShop(count) {
  return Random.randomizeArray([...SHOP_POOL]).slice(0, count);
}

function optionLabel(o) {
  return `${o.name} (${o.cost} Gold)`;
}

module.exports = class BankerShop extends Card {
  constructor(role) {
    super(role);

    this.winCount = "Banker";
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.data.goldenTicketWon) {
          winners.addPlayer(this.player, "Banker");
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        this.data.gold = this.data.gold != null ? this.data.gold : 2;
        this.data.shopAnnounced = false;
        this.data.bankerOptions = [...rollShop(3), GOLDEN_TICKET];
        this.data.investAmount = 0;

        for (let p of this.game.players) {
          if (p === this.player) continue;
          if (p.role.name === "Repoman") continue;
          p.role.data.gold = p.role.data.gold || 0;
          p.holdItem("GlobalShop");
        }
      },

      state: function (stateInfo) {
        if (!this.player.alive) return;

        const isDay = !!stateInfo.name.match(/Day/);
        const isNight = !!stateInfo.name.match(/Night/);
        if (!isDay && !isNight) return;

        this.data.gold = (this.data.gold || 0) + 1;

        if (isDay) {
          if (!this.data.shopAnnounced) {
            this.data.shopAnnounced = true;
            this.game.sendAlert(
              `:moneybag: The Banker has opened their shop. All players may purchase items each day!`
            );
          }

          this.data.bankerOptions = [...rollShop(3), GOLDEN_TICKET];
          const summary = this.data.bankerOptions
            .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
            .join(" | ");
          this.player.queueAlert(
            `:moneybag: You have ${this.data.gold} Gold. Today's shop: ${summary}`
          );
        } else {
          this.player.queueAlert(
            `:moneybag: You have ${this.data.gold} Gold. You may invest any amount tonight.`
          );
        }
      },

      playerHasJoinedMeetings: function (player) {
        if (player !== this.player) return;

        const shopTargets = [
          ...(this.data.bankerOptions || []).map(optionLabel),
          NO_PURCHASE,
        ];
        const gold = this.data.gold || 0;
        const investTargets = ["Do not invest"];
        for (let i = 1; i <= gold; i++) investTargets.push(`Invest ${i} Gold`);

        for (let meeting of this.player.getMeetings()) {
          if (meeting.name === "Banker Shop") meeting.targets = shopTargets;
          if (meeting.name === "Invest Gold") meeting.targets = investTargets;
        }
      },
    };

    this.meetings = {
      "Banker Shop": {
        actionName: "Browse Shop",
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: [NO_PURCHASE],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target === NO_PURCHASE) return;

            const options = this.role.data.bankerOptions || [];
            const option = options.find((o) => optionLabel(o) === this.target);
            if (!option) return;

            const gold = this.role.data.gold || 0;
            if (gold < option.cost) {
              this.actor.queueAlert(
                `:moneybag: You cannot afford ${option.name}. You have ${gold} Gold and need ${option.cost}.`
              );
              return;
            }

            this.role.data.gold = gold - option.cost;

            if (option.internal === "GoldenTicket") {
              this.role.data.goldenTicketWon = true;
              this.game.sendAlert(
                `:tickets: The Banker has purchased a Golden Ticket and won the game!`
              );
              this.actor.role.revealToAll();
              return;
            }

            this.actor.holdItem(option.internal);
            this.actor.queueAlert(
              `:moneybag: You purchased ${option.name} for ${option.cost} Gold. Remaining Gold: ${this.role.data.gold}.`
            );
          },
        },
      },

      "Invest Gold": {
        actionName: "Invest Gold",
        states: ["Night"],
        flags: ["voting", "noVeg"],
        inputType: "custom",
        targets: ["Do not invest"],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target === "Do not invest") return;

            const amount = parseInt(
              String(this.target).replace("Invest ", "").replace(" Gold", ""),
              10
            );
            if (!amount || amount <= 0) return;

            const gold = this.role.data.gold || 0;
            if (amount > gold) {
              this.actor.queueAlert(
                `:moneybag: You do not have enough Gold to invest ${amount}.`
              );
              return;
            }

            this.role.data.gold = gold - amount;
            this.role.data.investAmount = amount;
            this.actor.queueAlert(
              `:moneybag: You invested ${amount} Gold. Results reveal tomorrow.`
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
          let gained;
          let message;

          if (roll <= 50) {
            gained = amount * 2;
            message = `:chart_with_upwards_trend: The market was strong! Your ${amount} Gold doubled to ${gained}.`;
          } else if (roll <= 60) {
            gained = amount * 3;
            message = `:tada: The market was exceptional! Your ${amount} Gold tripled to ${gained}.`;
          } else if (roll <= 70) {
            gained = Math.floor(amount / 2);
            message = `:chart_with_downwards_trend: The market was rough. You recovered only ${gained} Gold.`;
          } else {
            gained = 0;
            message = `:x: The market crashed. You lost ${amount} Gold.`;
          }

          this.role.data.gold = (this.role.data.gold || 0) + gained;
          this.actor.queueAlert(message);
        },
      },
    ];
  }
};
