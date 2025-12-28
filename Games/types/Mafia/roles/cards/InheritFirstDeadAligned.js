const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class InheritFirstDeadAligned extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player) {
        if (
          player !== this.player &&
          player.getRoleAlignment() === this.player.role.alignment &&
          this.hasAbility(["Convert", "Modifier"])
        ) {
          let inheritAction = new Action({
            labels: ["hidden", "absolute"],
            actor: this.player,
            target: player,
            game: this.player.game,
            run: function () {
              if (!this.isVanillaRole()) {
                this.actor.queueAlert(
                  `:tomb: You decide to become ${this.target.role.getRevealText(
                    this.target.getRoleName(),
                    this.target.getModifierName()
                  )}, filling up the gap that ${this.target.name} left.`
                );
                this.actor.setRole(
                  `${this.target.getRoleName()}:${this.target.role.modifier}`,
                  this.target.role.data,
                  false,
                  false,
                  false,
                  "No Change"
                );
              }
            },
          });
          inheritAction.do();
        }
      },
    };
  }
};
