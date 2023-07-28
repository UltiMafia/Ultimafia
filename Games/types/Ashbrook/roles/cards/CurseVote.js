const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class CurseVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Cursed Vote": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.actor.role.data.cursedPlayers = 0;
            this.target.giveEffect("CursedVote", this.actor, 1);
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo){
        if (this.game.getStateName() != "Night") return;

        var players = this.game.players.filter((p) => p.role.alignment !== "Follower" && p.role.alignment !== "Leader");
        var alivePlayers = players.filter((p) => p.alive);
        var randomPlayer = 
          [Random.randArrayVal(alivePlayers, true),
          Random.randArrayVal(alivePlayers, true)]
        ;

        if (this.data.cursedPlayers){
          randomPlayer[0].giveEffect("Insanity", 1);
          randomPlayer[1].giveEffect("Insanity", 1);
        } 
      }
    }
  };
}
