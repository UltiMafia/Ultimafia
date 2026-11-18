const Effect = require("../Effect");
const Action = require("../Action");
const modifiers = require("../../../../data/modifiers");
const { roleWith } = require("../../../../lib/roleIdentity");

module.exports = class BecomeRoleOnDeath extends Effect {
  constructor(infector, role) {
    super("BecomeRoleOnDeath");
    this.infector = infector;
    this.role = role;
    this.isMalicious = true;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (this.player != player) return;
        if (deathType != "condemn") return;
        //if(this.word == "Complete") return;
        if (!this.infector.hasAbility(["Convert"])) {
          return;
        }
        var action = new Action({
          labels: ["hidden", "convert"],
          actor: this.infector,
          target: this.player,
          game: this.game,
          effect: this,
          run: function () {
            if (this.dominates()) {
              const role = roleWith(this.effect.role, {});
              const convertedRole = roleWith(role, {
                modifiers: [...role.modifiers, "Transcendent"],
              });
              this.target.setRole(
                convertedRole,
                null,
                false,
                false,
                false,
                this.actor.faction
              );
            }
          },
        });
        action.do();
      },
    };
  }
};
