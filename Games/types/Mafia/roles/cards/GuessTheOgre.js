const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {  PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class GuessTheOgre extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Effect"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if(this.OrgeGuessUsedYesterday == true){
          this.OrgeGuessUsedYesterday = false;
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority:  PRIORITY_BECOME_DEAD_ROLE+10,
          labels: ["effect"],
          run: function () {
            
            let players = this.game
              .alivePlayers()
              .filter((p) => p.isEvil());

            let victim = Random.randArrayVal(players, true);

            victim.queueAlert(
              `You learn their is an Orge in Town! If you guess who they are they will get condemned.`
            );
            victim.holdItem("GuessPlayer", this.actor); 
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
