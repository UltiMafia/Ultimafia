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
        AbilityToggle: function (player) {
        if (this.FalseModeVillageEffects == null) {
          this.FalseModeVillageEffects = [];
        }
        for (let x = 0; x < this.FalseModeVillageEffects.length; x++) {
          if (this.FalseModeVillageEffects[x].player) {
            var index = this.passiveEffects.indexOf(
              this.FalseModeVillageEffects[x]
            );
            if (index != -1) {
              this.passiveEffects.splice(index, 1);
            }
            this.FalseModeVillageEffects[x].remove();
          }
        }
        this.FalseModeVillageEffects = [];
        if (this.hasAbility(["Deception"])) {
          for (let player of this.game.players.filter((p) => p.role && p.role.alignment == "Village")) {
            let effect = player.giveEffect("FalseMode", Infinity);
            this.passiveEffects.push(effect);
            this.FalseModeVillageEffects.push(effect);
          }
        }
      },
      /*
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
        if (!this.hasAbility(["Deception"])) {
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
      */
    };
  }
};
