const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightKillerDeity1 extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Deity Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"]},
        action: {
          labels: ["kill", "deity"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.dominates()){
              this.target.kill("basic", this.actor);
              if (this.target == this.actor){
                var alive = this.game.alivePlayers();
                var follower = alive.filter((p) => p.role.alignment == "Follower");
                if (follower != undefined){
                  var newDeity = Random.randArrayVal(follower);
                  if (newDeity) newDeity.setRole("Deity1"); // it breaks w/o this
                }
              }
            }
          },
        },
      },
    };
  }
};
