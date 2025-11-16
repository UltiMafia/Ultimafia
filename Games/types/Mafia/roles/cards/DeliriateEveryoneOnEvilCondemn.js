const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

module.exports = class DeliriateEveryoneOnEvilCondemn extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect", "Delirium"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_EARLY,
        labels: ["block"],
        role: role,
        run: function () {
          if (!this.role.evilDied) return;

          let players = this.game.players.filter((p) => p != this.actor);

          let victims = players;

          for (let x = 0; x < victims.length; x++) {
            if (this.dominates(victims[x])) {
              this.blockWithDelirium(victims[x]);
            }
          }
        },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.player.role.evilDied = false;
          return;
        }
      },
      death: function (player, killer, deathType) {
        if (!this.canTargetPlayer(leader)) {
          return;
        }
        if (deathType != "condemn") return;

        this.evilDied = true;
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
        if (!this.canDoSpecialInteractions()) {
          return;
        }
        if (!room.members.includes(this.player)) {
          return;
        }
        if (!this.canTargetPlayer(leader)) {
          return;
        }
        this.evilDied = true;
      },
    };
  }
};
