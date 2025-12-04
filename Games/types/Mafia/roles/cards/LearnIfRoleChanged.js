const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnIfRoleChanged extends Card {
  constructor(role) {
    super(role);

        this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
        labels: ["investigate"],
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
      },
    ];
  }
};
