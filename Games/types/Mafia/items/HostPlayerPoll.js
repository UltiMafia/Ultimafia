const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class HostPlayerPoll extends Item {
  constructor(host, player, count) {
    super("HostPlayerPoll");
    this.Host = host;

    let meetingName = player.name + "Voting" + count;

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[meetingName] = {
      actionName: "Vote for Player",
      states: ["Day"],
      flags: ["voting", "mustAct", "instant", "Important"],
      targets: { include: ["alive"], exclude: [cannotBeVoted, "self"] },
      item: this,
      action: {
        labels: ["hidden", "absolute"],
        item: this,
        run: function () {
          var alert = `${this.actor.name} has Voted for ${this.target.name}`;
          this.item.Host.role.data.PollVotes.push(this.target);
          this.item.Host.queueAlert(alert);
          this.item.drop();
        },
      },
    };
  }
};

function cannotBeVoted(player) {
  if (player.role.name == "Host") {
    return true;
  }
  return player.hasEffect("CannotBeVoted");
}
