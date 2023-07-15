const Item = require("../Item");

module.exports = class ChefHat extends Item {
  constructor() {
    super("Chef Hat");

    this.meetings = {
      "Pick Favorite Noun": {
        actionName: "Pick Favorite Noun",
        states: ["Day"],
        flags: ["voting"],
        inputType: "custom",
        action: {
          item: this,
          priority: -1,
          run: function () {
            this.game.recordVote(this.actor, this.target);
            this.item.drop();
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        this.meetings["Pick Favorite Noun"].targets = this.game.currentExpandedNouns;
      },
    };
  }

  hold(player) {
    super.hold(player);
    if (!this.game.anonChef) 
      player.game.queueAlert(`${player.name} is now the Chef!`);
  }
};
