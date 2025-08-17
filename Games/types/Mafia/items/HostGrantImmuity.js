const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class HostGrantImmuity extends Item {
  constructor(count) {
    super("HostGrantImmuity");
    this.count = count;
    let meetingName = "Make Immune" + count;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[meetingName] = {
      actionName: "Give Immunity",
      states: ["Day"],
      flags: ["voting", "mustAct", "instant", "Important"],
      targets: { include: ["alive"], exclude: ["self"] },
      action: {
        labels: ["hidden", "absolute"],
        item: this,
        run: function () {
          var alert = `${this.target.name} can no longer be voted in polls today.`;
          this.target.giveEffect("CannotBeVoted", -1);
          this.actor.queueAlert(alert);
          this.item.drop();
        },
      },
    };
  }
};
