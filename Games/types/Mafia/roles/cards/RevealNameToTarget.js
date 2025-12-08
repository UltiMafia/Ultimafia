const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class RevealNameToTarget extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate", "hidden"],
        run: function () {
          let info = this.game.createInformation(
            "LearnTargetInfo",
            this.actor,
            this.game,
            this.actor
          );
          info.processInfo();
          var alert = `:mask: You learn that you were visited by ${
            info.getInfoRaw().name
          }.`;

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.queueAlert(alert));
        },
      },
    ];
  }
};
