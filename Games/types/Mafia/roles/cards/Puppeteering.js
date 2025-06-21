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
          run: function () {
            this.actor.holdItem(
              "PuppetStrings",
              "Control " + this.target.name,
              this.target
            );
            if(this.actor.role.data.controlledPlayers == null){
              this.actor.role.data.controlledPlayers = [];
            }
            this.actor.role.data.controlledPlayers.push(this.target);
          },
        },
      },
    };

    function isControlled(player) {
      return this.role.data.controlledPlayers.includes(player);
    }
  }
};
