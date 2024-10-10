const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class WackyRoleLearner extends Item {
  constructor(targetType) {
    super("WackyRoleLearner");

    this.targetType = targetType;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Wacky Learn Role": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: [isVaidTarget], exclude: ["self"] },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            var role = this.target.getRoleAppearance();
            var alert = `:invest: You learn that ${this.target.name}'s role is ${role}.`;
            this.actor.queueAlert(alert);
            this.item.drop();
          },
        },
      },
    };
  }
};

function isValidTarget(player) {

      let players = this.game.alivePlayers();
      var indexOfActor = players.indexOf(this.item.holder);
      let leftIndex = (indexOfActor - 1 + players.length) % players.length;
      let rightIdx = (indexOfActor + 1) % players.length;

    if(this.item.targetType == "Neighbors"){
      return this.item && (players.indexOf(player) == leftIndex || players.indexOf(player) == rightIndex);
    }
    if(this.item.targetType == "Even"){
      return this.item && (players.indexOf(player) % 2 == 0));
    }
    if(this.item.targetType == "Odd"){
    return this.item && (players.indexOf(player) % 2 == 1));
    }
    if(this.item.targetType == "Left"){
      return this.item && (players.indexOf(player) <= leftIndex);
    }
    if(this.item.targetType == "Right"){
      return this.item && (players.indexOf(player) >= rightIndex);
    }




  
  return this.item && player;
}
