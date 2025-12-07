const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class NeighborAlignment extends Card {
  constructor(role) {
    super(role);
    
      this.passiveActions = [
      {
        ability: ["OnlyWhenAlive", "Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate"],
        run: function () {
            if (!this.actor.alive) return;

            let info = this.game.createInformation(
              "NeighborAlignmentInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
      },
    ];

  }
};
