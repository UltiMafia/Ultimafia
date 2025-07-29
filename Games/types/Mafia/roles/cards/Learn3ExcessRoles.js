const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn3ExcessRoles extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if (
          this.data.hasExcessRoles != false &&
          this.data.hasExcessRoles != null
        )
          return;
        if (!this.player.alive) return;
        if (this.data.hasExcessRoles == true) return;
        this.data.hasExcessRoles = true;

        let info = this.game.createInformation(
          "ExcessRolesInfo",
          this.player,
          this.game,
          3
        );
        info.processInfo();
        var alert = `:invest: Insightful: ${info.getInfoFormated()}.`;
        this.player.queueAlert(alert);
      },
    };
  }
};
