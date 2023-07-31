const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class LearnRoleIfKilledAtNight extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Role": {
        states: ["Dawn"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        whileDead: true,
        shouldMeet: function () {
          return this.data.triggerDawn;
        },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function() {
            if (this.isInsane()){
              var role = Random.randArrayVal(this.game.allCharacters);
            } else {
              var role = this.target.getAppearance("investigate", true);
            }
            var alert = `:invest: You learn that ${this.target.name}'s role is ${role}.`;
            this.actor.queueAlert(alert);
            this.actor.role.data.triggerDawn = false;
          }
        }

      }
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player != this.player) return;
        if (this.game.getStateName() != "Night") return;

        this.player.role.data.triggerDawn = true;
      }
    }

    this.stateMods = {
      Night: {
        type: "delayActions",
        delayActions: true,
      },
      Dawn: {
        type: "add",
        index: 3,
        length: 1000 * 30,
        shouldSkip: function () {
          return !this.data.triggerDawn;
        },
      },
    };
  }
}
