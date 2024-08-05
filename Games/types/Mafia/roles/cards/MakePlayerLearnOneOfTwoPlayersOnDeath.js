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

          let players = this.game.alivePlayers().filter((p) => p != this.data.playerToReveal);
          let evilPlayers = players.filter((p) => p.role.alignment == "Cult" || p.role.alignment == "Mafia");

          if(this.player.hasEffect("FalseMode")){
            evilPlayers = players.filter((p) => p.role.alignment != "Cult" && p.role.alignment != "Mafia");
            players = players.filter((p) => p.role.alignment != "Cult" && p.role.alignment != "Mafia");
          }
          let evilPlayer = Random.randArrayVal(evilPlayers);
          players = players.alivePlayers().filter((p) => p != evilPlayer);
          let otherPlayer = Random.randArrayVal(players);

          let chosen = [evilPlayer,otherPlayer];
          let chosenRan = Random.randomizeArray(chosen);

          
          this.data.playerToReveal.queueAlert(`A dying ${role} tells you that at least 1 of ${chosenRan[0]} and ${chosenRan[1]} is Evil!!!`);
        }
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
