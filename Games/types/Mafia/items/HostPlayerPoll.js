const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class HostPlayerPoll extends Item {
  constructor(host) {
    super("HostPlayerPoll");
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
              var alert = `${this.actor.name} has Voted for ${this.target.name}`;
              this.item.Host.role.data.PollVotes.push(this.target);
              this.item.Host.queueAlert(alert);
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
