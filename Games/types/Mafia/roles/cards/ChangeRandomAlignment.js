const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ChangeRandomAlignment extends Card {
  constructor(role) {
    super(role);

    role.methods.changeAlignment = function () {
      const alignment = {
        Independent: Random.randArrayVal(["Village", "Mafia", "Cult"]),
        Mafia: "Village",
        Cult: "Village",
        Village: ["Mafia" || "Cult"],
      };
      this.player.role.alignment = alignment[this.player.role.alignment];
      this.player.queueAlert(
        `:sy5g: You believe that siding with the ${this.player.role.alignment} will help your career!`
      );
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        this.methods.changeAlignment();
      },
      state: function (stateInfo) {
        if (
          this.player.alive &&
          stateInfo.name.match(/Day/) &&
          stateInfo.dayCount > 0
        ) {
          this.methods.changeAlignment();
        }
      },
    };
  }
};
