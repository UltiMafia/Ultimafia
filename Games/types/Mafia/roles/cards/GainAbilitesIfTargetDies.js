const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_PREKILL_ACTION } = require("../../const/Priority");

module.exports = class GainAbilitesIfTargetDies extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Consume on Death": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_PREKILL_ACTION,
          run: function () {
            this.role.avengeTarget = this.target;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        delete this.avengeTarget;
      },
      death: function (player) {
        if (this.avengeTarget && player == this.avengeTarget) {
          let action = new Action({
            actor: this.player,
            target: this.avengeTarget,
            game: this.game,
            run: function () {
              //let effect = this.actor.giveEffect("ExtraRoleEffect", this.game.formatRoleInternal(this.target.role.name, this.target.role.modifier) , Infinity, this.target.role.data);
              let role = this.actor.addExtraRole(
                this.game.formatRoleInternal(
                  this.target.getRoleName(),
                  this.target.getModifierName()
                )
              );
              //this.GainedRoles.push(role);
              this.actor.passiveExtraRoles.push(role);
            },
          });

          action.do();
        }
      },
    };
  }
};
