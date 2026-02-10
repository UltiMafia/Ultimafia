const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerBoolean extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
        labels: ["investigate"],
        run: function () {
            let visits = this.getSecondaryActions(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
                let info = this.game.createInformation(
                  "BinaryWatcherInfo",
                  this.actor,
                  this.game,
                  v
                );
                info.processInfo();
                if (info.mainInfo == "visited by somebody") {
                  this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
                }
              }
            }
          },
      },
    ];
  }
};
