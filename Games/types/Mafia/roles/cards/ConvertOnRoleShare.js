const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class ConvertOnRoleShare extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      ShareRole: function (PlayerA, PlayerB, isAlignmentShare) {
        if (!this.hasAbility(["Convert"])) {
          return;
        }
        if (
          (PlayerA == this.player || PlayerB == this.player) &&
          !isAlignmentShare
        ) {
          let thisPlayer;
          let otherPlayer;
          if (PlayerA == this.player) {
            thisPlayer = PlayerA;
            otherPlayer = PlayerB;
          } else {
            thisPlayer = PlayerB;
            otherPlayer = PlayerA;
          }
          var action = new Action({
            actor: this.player,
            target: otherPlayer,
            game: this.game,
            item: this,
            labels: ["convert", "hidden"],
            run: function () {
              if (this.dominates()) this.target.setRole("Cultist");
            },
          });
          this.game.instantAction(action);
        }
      },
    };
  }
};
