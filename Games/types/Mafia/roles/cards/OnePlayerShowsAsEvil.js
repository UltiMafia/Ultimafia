const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class OnePlayerShowsAsEvil extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["UnfavorableMode"];
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if(this.BiasedTarget == null){
            this.BiasedTarget = Random.randArrayVal(this.game.players.filter((p)=> p.faction == "Village" && p != this.player));
          }
          else if(this.BiasedTarget.faction != "Village"){
            this.BiasedTarget = Random.randArrayVal(this.game.players.filter((p)=> p.faction == "Village" && p != this.player));
          }
          if (
            this.OnePlayerShowsAsEvilEffect == null ||
            !this.player.effects.includes(this.OnePlayerShowsAsEvilEffect)
          ) {
            this.OnePlayerShowsAsEvilEffect = this.BiasedTarget.giveEffect(
              "Biased",
              Infinity,
              this.player
            );
            this.passiveEffects.push(this.OnePlayerShowsAsEvilEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(
            this.OnePlayerShowsAsEvilEffect
          );
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.OnePlayerShowsAsEvilEffect != null) {
            this.OnePlayerShowsAsEvilEffect.remove();
            this.OnePlayerShowsAsEvilEffect = null;
          }
        }
      },
    };
  }
};
