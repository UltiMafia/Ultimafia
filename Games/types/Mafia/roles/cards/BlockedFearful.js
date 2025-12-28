const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

module.exports = class BlockedFearful extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Blind"];

    this.passiveActions = [
      {
        ability: ["Modifier", "Blocking", "OnlyWhenAlive"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_EARLY,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          //this.actor.hasEffect("Scary");

          if (this.actor.hasEffect("Scary")) {
            for (let player of this.game.players) {
              if (
                player.getModifierName() &&
                player.getModifierName().split("/").includes("Fearful")
              ) {
                this.blockActions(player);
              }
            }
          }
        },
      },
    ];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Blocking", "OnlyWhenAlive"])) {
          if (
            this.ScaryEffect == null ||
            !this.player.effects.includes(this.ScaryEffect)
          ) {
            this.ScaryEffect = this.player.giveEffect("Scary", Infinity);
            this.passiveEffects.push(this.ScaryEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.ScaryEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.ScaryEffect != null) {
            this.ScaryEffect.remove();
            this.ScaryEffect = null;
          }
        }
      },
    };
  }
};
