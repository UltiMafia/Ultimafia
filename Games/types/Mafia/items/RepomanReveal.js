const Item = require("../Item");
const { PRIORITY_REVEAL_DEFAULT } = require("../const/Priority");

module.exports = class RepomanReveal extends Item {
  constructor() {
    super("RepomanReveal");
    this.cannotBeSnooped = true;
    this.cannotBeStolen = true;
    this.lifespan = 1;

    this.meetings["Repoman Intel"] = {
      actionName: "Reveal Role",
      states: ["Day"],
      flags: ["voting", "noVeg"],
      item: this,
      targets: { include: ["alive"], exclude: ["self"] },
      action: {
        labels: ["hidden", "absolute", "reveal"],
        priority: PRIORITY_REVEAL_DEFAULT,
        item: this,
        run: function () {
          const role = this.target.getRoleAppearance();
          for (let p of this.game.players) {
            if (p.faction === this.actor.faction) {
              p.queueAlert(
                `:briefcase: The Repoman has purchased intel. ${this.target.name}'s role is ${role}!`
              );
            }
          }
          this.item.drop();
        },
      },
    };
  }
};