const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class NeighborAlignment extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          const neighbors = this.getAliveNeighbors();

          let evilCount = neighbors.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) !== "Village" &&
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) !== "Independent"
          ).length;

          if (this.actor.hasEffect("FalseMode")) {
            if (evilCount == 0) {
              evilCount = 1;
            } else if (evilCount == 2) {
              evilCount = 0;
            } else {
              evilCount = 2;
            }
          }

          this.actor.queueAlert(
            `You can feel the intent of those around you… you learn that you have ${evilCount} evil neighbors!`
          );
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["OnlyWhenAlive", "Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
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

            /*
            const neighbors = this.getAliveNeighbors();

            let evilCount = neighbors.filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) !== "Village" &&
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) !== "Independent"
            ).length;

            if (this.actor.hasEffect("FalseMode")) {
              if (evilCount == 0) {
                evilCount = 1;
              } else if (evilCount == 2) {
                evilCount = 0;
              } else {
                evilCount = 2;
              }
            }

            this.actor.queueAlert(
              `You can feel the intent of those around you… you learn that you have ${evilCount} evil neighbors!`
            );
            */
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
