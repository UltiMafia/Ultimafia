const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class ChoosePlayerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        actionName: "Lose unless this player is Village Aligned",
        states: ["Day"],
        flags: ["voting", "mustAct", "instant"],
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          role: this.role,
          priority: PRIORITY_DAY_DEFAULT - 1,
          run: function () {
            this.game.queueAlert(
              `${this.actor.name} the ${this.role.name} has selected ${this.target.name}`
            );
            //this.hasChoosen = true;
            this.role.revived = true;

            if (!this.role.hasAbility(["Win-Con", "WhenDead"])) {
              return;
            }

            if (this.target.role.alignment != "Village") {
              for (let p of this.game.alivePlayers()) {
                if (p.faction === this.actor.faction) {
                  p.kill("basic", this.actor, true);
                }
              }
            }
          },
        },
      },
    };
  }
};
