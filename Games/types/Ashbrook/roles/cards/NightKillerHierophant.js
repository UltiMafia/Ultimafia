const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_LEADER } = require("../../const/Priority");

module.exports = class NightKillerHierophant extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Leader Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"]},
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_LEADER,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()){
              this.target.kill("basic", this.actor);
              if (this.target == this.actor){
                var alive = this.game.alivePlayers();
                var follower = alive.filter((p) => p.role.alignment == "Follower");
                if (follower != undefined){
                  var newLeader = Random.randArrayVal(follower);
                  if (newLeader) newLeader.setRole("Hierophant"); // it breaks w/o this
                }
              }
            }
          },
        },
      },
    };
  }
};
