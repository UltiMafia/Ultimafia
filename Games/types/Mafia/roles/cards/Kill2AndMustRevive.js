const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillorCharge extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Kill 2 Players": {
        actionName: "Kill 2 Players",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"] },
        multiMin: 2,
        multiMax: 2,
        shouldMeet: function () {
          return this.revived;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
           
            this.actor.role.revived = false;
            for(let x = 0; x < this.target.length; x++){
              if (this.dominates(this.target[x])){
                this.target[x].kill("basic", this.actor);
                
              }
            }
            
          },
        },
      },
    };
  }
};
