const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REVEAL_DEFAULT } = require("../../const/Priority");

module.exports = class MakePlayerLearnOneOfTwoPlayersOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Player Learn That One Of Two Players Is Evil On Death": {
        actionName: "Make Player Learn That One Of Two Players Is Evil On Death",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REVEAL_DEFAULT,
          run: function () {
            this.actor.role.data.playerToReveal = this.target;
          },
        },
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && this.data.playerToReveal){

          if (this.game.getStateName() != "Night") return;
          let role = this.player.role.name;
          let victim = this.data.playerToReveal;

          let players = this.game.alivePlayers().filter((p) => p != victim);
          if(players.length <= 1) return;
          let evilPlayers = players.filter((p) => p.role.alignment == "Cult" || p.role.alignment == "Mafia");

          if(this.player.hasEffect("FalseMode")){
            evilPlayers = players.filter((p) => p.role.alignment != "Cult" && p.role.alignment != "Mafia");
            players = players.filter((p) => p.role.alignment != "Cult" && p.role.alignment != "Mafia");
          }
          if(evilPlayers.length <= 0) return;

          let evilPlayer = Random.randArrayVal(evilPlayers);
          players = players.filter((p) => p != evilPlayer);
          if(players.length <= 0) return;
          let otherPlayer = Random.randArrayVal(players);

          let chosen = [evilPlayer,otherPlayer];
          let chosenRan = Random.randomizeArray(chosen);

          
          victim.queueAlert(`A dying ${role} tells you that at least 1 of ${chosenRan[0].name} and ${chosenRan[1].name} is Evil!!!`);
        }
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
