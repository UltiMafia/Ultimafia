const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class MakeAllVillageInfoFalse extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
        labels: ["effect"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          let players = this.game.players.filter(
            (p) => p.role.alignment == "Village"
          );
          for (let x = 0; x < players.length; x++) {
            players[x].giveEffect("FalseMode", 1);
          }
        },
      },
    ];
*/

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;

        let players = this.game.players.filter(
          (p) => p.role.alignment == "Village"
        );

        for (let x = 0; x < players.length; x++) {
          players[x].giveEffect("FalseMode", 1);
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          labels: ["effect"],
          run: function () {
            if (!this.actor.alive) return;
            let players = this.game.players.filter(
              (p) => p.role.alignment == "Village"
            );
            for (let x = 0; x < players.length; x++) {
              players[x].giveEffect("FalseMode", 1);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
