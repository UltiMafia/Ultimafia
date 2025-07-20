const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class Puppeteering extends Card {
  constructor(role) {
    super(role);

    this.role.data.controlledPlayers = [];

    this.meetings = {
      attachStrings: {
        actionName: "Attach Strings",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isControlled] },
        action: {
          labels: ["effect", "puppet"],
          role: this.role,
          run: function () {
            this.actor.holdItem(
              "PuppetStrings",
              "Control " + this.target.name,
              this.target
            );
            if(this.role.data.controlledPlayers == null){
              this.role.data.controlledPlayers = [];
            }
            this.role.data.controlledPlayers.push(this.target);
            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };

    function isControlled(player) {
      return this.role.data.controlledPlayers.includes(player);
    }
  }
};
