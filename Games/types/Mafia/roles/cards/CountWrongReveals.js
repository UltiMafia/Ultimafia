const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CountWrongReveals extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1,
        labels: ["investigate", "Forensicist"],
        role: role,
        run: function () {
          let info = this.game.createInformation(
            "CountFalseInfoInfo",
            this.actor,
            this.game
          );
          info.processInfo();

          this.actor.queueAlert(`:journ: ${info.getInfoFormated()}`);
        },
      },
    ];
  }
};
