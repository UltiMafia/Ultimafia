const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class HostDeclareWinner extends Item {
  constructor(count) {
    super("HostDeclareWinner");
    this.count = count;
    let meetingName = "Declare Winner" + count;
    let meetingName2 = "Confirm Selection" + count;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[meetingName] = {
      actionName: "Choose Winners",
      states: ["Day"],
      flags: ["voting", "mustAct", "instant", "multi", "instantButChangeable",
          "repeatable", "noVeg"],
      targets: { include: ["alive", "dead"] },
      multiMin: 1,
      multiMax: 10,
      action: {
        labels: ["hidden", "absolute"],
        item: this,
        run: function () {
          this.item.SelectedPlayers = this.target;
        },
      },
    };
    this.meetings[meetingName2] = {
      actionName: "Confirm",
      states: ["Day"],
      flags: ["voting", "mustAct", "instant", "noVeg"],
      inputType: "boolean",
      action: {
        labels: ["hidden", "absolute"],
        item: this,
        run: function () {
          if(this.target == "No"){
            return;
          }
          this.game.HostSelectedWinners = this.item.SelectedPlayers;
        },
      },
    };
  }
};
