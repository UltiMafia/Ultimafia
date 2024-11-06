const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
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
          priority: PRIORITY_KILL_DEFAULT + 2,
          run: function () {
              let CultPlayers = this.game.alivePlayers().filter((p) => p.faction == this.actor.faction)
              if(this.actor.role.EatenPlayers != null && this.actor.role.EatenPlayers.length > 0){
                if(this.actor.role.revived != true && Random.randInt(0, (this.game.alivePlayers().length-CultPlayers.length)) == 0){
                  let selectedPlayer = Random.randArrayVal(
                    this.actor.role.EatenPlayers
                  );
                  let action = new Action({
                    actor: this.actor,
                    target: selectedPlayer,
                    game: this.game,
                    labels: ["revive"],
                    run: function () {
                      if (this.dominates()) {
                        this.actor.role.revived = true;
                        this.target.revive("basic", this.actor);
                      };
                    },
                  });
                  action.do();
                }
              }
              this.actor.role.EatenPlayers = [];
            for (let x = 0; x < this.target.length; x++) {
              if (this.dominates(this.target[x])) {
                this.target[x].kill("basic", this.actor);
                this.actor.role.EatenPlayers.push(this.target[x]);
              }
            }
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
