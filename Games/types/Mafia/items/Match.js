const Item = require("../Item");

module.exports = class Match extends Item {
  constructor() {
    super("Match");
    this.cannotBeStolen = true;
    this.meetings = {
      "Light Match": {
        actionName: "Light your match?",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "boolean",
        action: {
          labels: ["kill", "ignite", "match"],
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.game.queueAlert(
                `:match: Someone throws a match into the crowd!`
              );

              for (let player of this.game.players) {
                if (player.hasEffect("Gasoline")) {
                  if (player.alive && this.dominates(player))
                    player.kill("burn", this.actor, true);

                  player.removeEffect("Gasoline", true);
                }
              }

              this.item.drop();
            }
          },
        },
      },
    };
  }
};
