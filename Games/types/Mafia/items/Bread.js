const Item = require("../Item");

module.exports = class Bread extends Item {
  constructor(options) {
    super("Bread");

    this.broken = options?.broken;
    this.magicCult = options?.magicCult;
  }
   eat() {
    if (this.magicCult == true && this.holder.alignment != "Cult") {
      let action = new Action({
        actor: this.holder,
        target: this.holder,
        game: this.game,
        labels: [
          "giveEffect",
          "poison",
          "hidden",
          "absolute",
          "uncontrollable",
        ],
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        run: function () {
          if (this.dominates()) {
            this.target.queueAlert(
              "You have been poisoned by the Cult's Magic Food!"
            );
            this.target.giveEffect("poison", this.actor);
          }
        },
      });

      action.do();
    }
  }
};
