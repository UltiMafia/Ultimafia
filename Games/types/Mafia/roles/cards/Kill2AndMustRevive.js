const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillorCharge extends Card {
  constructor(role) {
    super(role);

    this.role.EatenPlayers = ["No One"];
    this.role.revived = false;

    this.meetings = {
      "Kill 2 Players": {
        actionName: "Kill 2 Players",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
           
            this.actor.role.revived = false;
            for(let x = 0; x < this.target.length; x++){
              if (this.dominates(this.target[x])){
                this.target[x].kill("basic", this.actor);
                this.actor.role.EatenPlayers.push(this.target[x]);
              }
            }
            
          },
        },
      },
      Revive: {
        actionName: "Revive",
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return (this.role.EatenPlayers.length > 0);
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            if(this.target == "No one") return;

            this.actor.role.EatenPlayers.filter((p) => p != this.target);

            this.actor.role.revived = true;
            this.target.revive("basic", this.actor);
          },
        },
      },
      
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) => this.game.getRoleAlignment(r) == "Village"
        );
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var ConvertOptions = this.data.ConvertOptions;
        ConvertOptions.push("None");

        this.meetings["Revive"].targets = this.player.EatenPlayers;
      },
    };
  }
};

