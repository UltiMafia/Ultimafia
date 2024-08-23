const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { PRIORITY_NIGHT_REVIVER } = require("../../const/Priority");

module.exports = class KillorCharge extends Card {
  constructor(role) {
    super(role);


    this.meetings = {
      "Kill 2 Players": {
        actionName: "Kill 2 Players",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
           
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
        inputType: "boolean",
        shouldMeet: function () {
          return (this.EatenPlayers.length > 0);
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER,
          run: function () {
            if(this.target == "No") return;
            if(this.actor.role.EatenPlayers.length <= 0){
              return;
            }

            let selectedPlayer = Random.randArrayVal(this.actor.role.EatenPlayers);

            if (!this.dominates(selectedPlayer)) {
              return;
            }

            this.actor.role.EatenPlayers.filter((p) => p != selectedPlayer);
            this.actor.role.revived = true;
            selectedPlayer.revive("basic", this.actor);
          },
        },
      },
      
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.role.EatenPlayers = [];
        this.player.role.revived = false;

        this.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) => this.game.getRoleAlignment(r) == "Village"
        );
      },
    };
  }
};

