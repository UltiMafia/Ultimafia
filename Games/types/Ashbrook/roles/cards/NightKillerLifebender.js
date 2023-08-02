const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightKillerLifebender extends Card {
  constructor(role) {
    super(role);
    
    this.meetings = {
      "Leader Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"], exclude: ["self"]},
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()){
              this.target.kill("basic", this.actor);
              if (this.target.role.alignment == "Follower"){
                this.target.holdItem("DeadAbilityUser");
                let direction = Random.randArrayVal(["ccw", "cw"]);

                let currentPlayer = this.target;
                let neighbor;
                while (true){
                  if (direction == "cw"){
                    neighbor = this.getAliveNeighbors(currentPlayer);
                    neighbor = neighbor[1];
                    currentPlayer = neighbor;
                  } else {
                    neighbor = this.getAliveNeighbors(currentPlayer);
                    neighbor = neighbor[0];
                    currentPlayer = neighbor;
                  }
                  if (neighbor.role.alignment == "Villager"){
                    neighbor.giveEffect("PermanentInsanity");
                    neighbor.giveEffect("Insanity");
                    return;
                  }
                }
              }
            }
          },
        }
      }
    }
  }
};
