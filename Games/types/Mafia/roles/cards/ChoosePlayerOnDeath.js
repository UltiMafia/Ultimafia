const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class ChoosePlayerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        actionName: "Lose unless this player is Village Aligned",
        states: ["Day"],
        flags: ["voting"],
         shouldMeet: function () {
          return !this.hasChosen;
        },
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            this.game.queueAlert(
              `${this.actor.name} the ${this.actor.role.name} has selected ${this.target.name}`
            );
            this.actor.role.hasChoosen = true;
            if(this.target.role.alignment != "Village"){
            for (let p of this.game.alivePlayers()) {
            if (p.role.alignment === this.actor.role.alignment) {
            p.kill("basic", this.actor, instant);
          }
        }
            }
            
            
          },
        },
      },
    };
  }
};
