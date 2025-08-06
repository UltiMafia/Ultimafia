const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GainGunIfMafiaAbstained extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          if (!this.actor.alive) return;

          if (this.actor.role.data.gainedGun) return;

          let mafiaKilled = false;
          for (let action of this.game.actions[0]) {
            if (action.hasLabels(["kill", "mafia"])) {
              mafiaKilled = true;
              break;
            }
          }

          if (!mafiaKilled) {
            this.actor.holdItem("Gun", { reveal: true });
            this.actor.queueGetItemAlert("Gun");
            this.actor.role.data.gainedGun = true;
          }
        },
      },
    ];
    */
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.gainedGun = false;
      },
      state: function (stateInfo) {
        if (!this.hasAbility(["Item"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["hidden", "absolute"],
          role: this,
          run: function () {
            if (this.role.data.gainedGun) return;

            let mafiaKilled = false;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"])) {
                mafiaKilled = true;
                break;
              }
            }

            if (!mafiaKilled) {
              this.actor.holdItem("Gun", { reveal: true, modifiers: true });
              this.actor.queueGetItemAlert("Gun");
              this.role.data.gainedGun = true;
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
