const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnEvilDeadCount extends Card {
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
          let evilCount;
          let players = this.game.deadPlayers();

          if (players.length <= 0) {
            return;
          }

          let info = this.game.createInformation(
            "EvilDeadCountInfo",
            this.actor,
            this.game
          );
          info.processInfo();
          this.actor.role.hasInfo = true;
          var alert = `:invest: ${info.getInfoFormated()}`;
          this.actor.queueAlert(alert);
        },
      },
    ];
  }
};
