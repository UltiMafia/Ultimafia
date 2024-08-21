const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Role": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var role = this.target.getRoleAppearance();

            if (this.actor.hasEffect("FalseMode")) {
              let wrongPlayers = this.game
                .alivePlayers()
                .filter(
                  (p) =>
                    p.getRoleAppearance().split(" (")[0] !=
                    this.target.role.name
                );
              role = Random.randArrayVal(wrongPlayers).getRoleAppearance();
            }

            var alert = `:invest: You learn that ${this.target.name}'s role is ${role}.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
