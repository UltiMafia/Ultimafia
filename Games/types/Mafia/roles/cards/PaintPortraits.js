const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class PaintPortraits extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          for (let visitor of visitors) {
            this.actor.data.portraits.push(visitor.name);
          }
        },
      },
    ];
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.data.portraits = [];
      },
      death: function (player, killer, deathType) {
        if (player === this.player) {
          let portraits = this.player.data.portraits;
          function unique(arr) {
            const result = [];

            for (const i of arr) {
              let noRepeat = true;

              for (const j of result) {
                if (i === j) {
                  noRepeat = false;
                  break;
                }
              }

              if (noRepeat) {
                result.push(i);
              }
            }

            return result;
          }
          let uniquePortraits = unique(portraits);

          if(this.player.hasEffect("FalseMode")){
            let wrongPlayers = this.game.alivePlayers().filter((p) => p != this.player);
            for(let l in uniquePortraits){
              wrongPlayers = wrongPlayers.filter((p) => p != l);
            }
            uniquePortraits = [Random.randArrayVal(wrongPlayers)];
          }
          
          let painterAuction = `:paintbrush: ${
            this.player.name
          }'s extensive collection of paintings have gone up for auction. Among them are portraits of ${uniquePortraits.join(
            ", "
          )}.`;
          this.game.queueAlert(painterAuction);
        }
      },
    };
  }
};
