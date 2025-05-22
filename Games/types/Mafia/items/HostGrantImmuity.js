const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class HostGrantImmuity extends Item {
  constructor() {
    super("HostGrantImmuity");
    this.Host = host;
    this.targetType = targetType;
    this.state = state;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
      this.meetings = {
        "Vote for Player": {
          states: ["Day"],
          flags: ["voting", "mustAct", "instant"],
          targets: { include: ["alive"], exclude: ["self"] },
          action: {
            labels: ["hidden", "absolute"],
            item: this,
            run: function () {
              info.processInfo();
              var alert = `${this.target.name} can no longer be voted in polls today.`;
              this.target.giveEffect("CannotBeVoted", -1);
              this.actor.queueAlert(alert);
              this.item.drop();
            },
          },
        },
      };
    
  }
};

function cannotBeVoted(player) {
  if(player.role.name == "Host"){
    return true;
  }
  return player.hasEffect("CannotBeVoted");
}
