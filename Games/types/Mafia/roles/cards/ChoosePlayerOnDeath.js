const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class ChoosePlayerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        actionName: "Lose unless this player is Village Aligned",
        states: ["Day"],
        flags: ["voting", "mustAct","instant"],
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          priority: PRIORITY_DAY_DEFAULT -1,
          run: function () {
            this.game.queueAlert(
              `${this.actor.name} the ${this.actor.role.name} has selected ${this.target.name}`
            );
            //this.hasChoosen = true;
            this.actor.role.revived = true;

            if(this.target.role.alignment != "Village"){
            for (let p of this.game.alivePlayers()) {
            if (p.role.alignment === "Village") {
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
