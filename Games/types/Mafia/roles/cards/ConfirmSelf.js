const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ConfirmSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Introduce Yourself": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var alert = `:mask: You learn that ${
              this.actor.name
            }'s role is ${this.actor.getRoleAppearance()}.`;

            if(this.actor.hasEffect("FalseMode")){
               let players = this.game.alivePlayers().filter((p) => p != this.target);
              players = players.filter((p) => p != this.actor);
              let playerNames = players.map((p) => p.name);
              alert = `:mask: You learn that ${Random.randArrayVal(playerNames)}'s role is ${this.actor.getRoleAppearance()}.`;
            }
            
            this.target.queueAlert(alert);
          },
        },
      },
    };
  }
};
