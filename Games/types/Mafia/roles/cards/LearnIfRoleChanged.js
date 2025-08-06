const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnIfRoleChanged extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 2,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          this.actor.queueAlert(`Your role is ${this.actor.role.name}`);
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          run: function () {
            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            var alert = `:invest: Your role is ${info.getInfoRaw()}.`;
            this.actor.queueAlert(alert);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
