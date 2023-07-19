const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ChangeRandomAlignment extends Card {
  constructor(role) {
    super(role);

    role.methods.changeAlignment = function () {
      let alignment = Random.randArrayVal(["Village", "Mafia", "Cult"]);
      this.player.role.alignment = alignment;
      this.player.queueAlert(
        `:sy5g: You believe that siding with the ${alignment} will help your career!`
      );
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        this.methods.changeAlignment();
      },
      state: function (stateInfo) {
        if (
          stateInfo.name.match(/Day/) &&
          stateInfo.dayCount > 1 &&
          stateInfo.dayCount % 2 === 1
        ) {
          this.methods.changeAlignment();
        }
      },
    };
  }
};
