const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillIfBanishedDiedDuringDay extends Card {
  constructor(role) {
    super(role);

    role.banishedDied = false;

    this.meetings = {
      "Tormentor Kill": {
        actionName: "Torment Kill",
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return this.banishedDied;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        if (!this.banishedDied) {
          delete this.banishedDied;
        }
      },
      death: function (player, killer, deathType) {
        if (player.role.data.banished && deathType === "condemn") {
          if (this.game.getStateName() == "Night") return;
          this.banishedDied = true;
          this.player.queueAlert(
            `A Banished Role has died, allowing you to use their Tormented soul to kill another Player.`
          );
        }
      },
      roleAssigned: function (player) {
        if (player !== this.player) return;
        let banishedPlayers = this.game.players.filter((p) => p.role.data.banished);
        if(banishedPlayers.length <= 0){
          this.player.queueAlert(`You learn that No Banished Roles are currently in the Game.`);
          return;
        }
        for(let x = 0; x < banishedPlayers.length){
          this.player.queueAlert(`You learn ${banishedPlayers[x].role.name}:${banishedPlayers[x].role.modifier} is currently in the game`);
        }
      },
    };
  }
};
