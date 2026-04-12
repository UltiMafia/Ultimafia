const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

const NO_PURCHASE = "No Purchase";
const REROLL_OPTION = "Reroll Shop (Free, Once Per Game)";

function optionLabel(o) {
  return `${o.name} (${o.cost} Gold)`;
}

module.exports = class RepomanShopItem extends Item {
  constructor(options, rerollAvailable) {
    super("Repoman Shop");
    this.options = Array.isArray(options) ? options : [];
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.lifespan = Infinity;

    const targets = this.options.map(optionLabel);
    if (rerollAvailable) targets.push(REROLL_OPTION);
    targets.push(NO_PURCHASE);

    this.meetings = {
      "Repoman Shop": {
        actionName: "Browse Shop",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "custom",
        targets,
        action: {
          item: this,
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            const holder = this.item.holder;
            if (!holder) return;

            if (this.target === NO_PURCHASE) {
              this.item.drop();
              return;
            }

            if (this.target === REROLL_OPTION) {
              if (holder.role.data.rerollUsedThisGame) return;
              holder.role.data.rerollUsedThisGame = true;

              this.item.drop();

              const pool = holder.role.data.shopPool || [];
              const newOptions = Random.randomizeArray([...pool]).slice(0, 3);
              holder.role.data.shopOptions = newOptions;
              holder.holdItem("RepomanShopItem", newOptions, false);

              const summary = newOptions
                .map((o, i) => `${i + 1}. ${o.name} — ${o.cost} Gold`)
                .join(" | ");
              holder.queueAlert(
                `:moneybag: Shop rerolled! New options: ${summary}`
              );

              holder.joinMeetings(holder.role.meetings);
              for (let item of holder.items) holder.joinMeetings(item.meetings);
              holder.sendMeetings();
              return;
            }

            const option = this.item.options.find(
              (o) => optionLabel(o) === this.target
            );
            if (!option) return;

            const gold = holder.role.data.gold || 0;
            if (gold < option.cost) {
              holder.queueAlert(
                `:moneybag: You cannot afford ${option.name}. You have ${gold} Gold and need ${option.cost}.`
              );
              return;
            }

            holder.role.data.gold = gold - option.cost;
            holder.role.data.pendingPurchase = option;
            holder.queueAlert(
              `:moneybag: You purchased ${option.name} for ${option.cost} Gold. Remaining Gold: ${holder.role.data.gold}.`
            );

            this.item.drop();
            holder.joinMeetings(holder.role.meetings);
            holder.sendMeetings();
          },
        },
      },
    };
  }
};
