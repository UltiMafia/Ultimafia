const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class DeliriateEveryoneOnEvilCondemn extends Card {
  constructor(role) {
    super(role);

    //role.evilDied = false;
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
        labels: ["block"],
        run: function () {
          if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;
          if (!this.actor.role.evilDied) return;

          if (!this.actor.alive) return;

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
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Delirium"])) {
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          this.player.role.evilDied = false;
          return;
        }

        if (stateInfo.name.match(/Night/)) {
          var action = new Action({
            actor: this.player,
            role: this.role,
            game: this.player.game,
            priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
            labels: ["block"],
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
          });

          this.game.queueAction(action);
        }
      },
      death: function (player, killer, deathType) {
        if (
          this.game.getRoleAlignment(
            player.getRoleAppearance().split(" (")[0]
          ) == "Cult" ||
          this.game.getRoleAlignment(
            player.getRoleAppearance().split(" (")[0]
          ) == "Mafia"
        ) {
          if (deathType != "condemn") return;

          this.evilDied = true;
        }
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
        if (
          this.game.getRoleAlignment(
            leader.getRoleAppearance().split(" (")[0]
          ) == "Cult" ||
          this.game.getRoleAlignment(
            leader.getRoleAppearance().split(" (")[0]
          ) == "Mafia"
        ) {
          this.evilDied = true;
        }
      },
    };
  }
};
