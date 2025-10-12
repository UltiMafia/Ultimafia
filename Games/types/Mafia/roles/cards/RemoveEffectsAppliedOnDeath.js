const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class RemoveEffectsAppliedOnDeath extends Card {
  constructor(role) {
    super(role);


      this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Effect"])) {
          return;
          if (
            this.BlindEffect == null ||
            !this.player.effects.includes(this.BlindEffect)
          ) {
            this.BlindEffect = this.player.giveEffect("Blind", Infinity);
            this.passiveEffects.push(this.BlindEffect);
          }
        } else {
          for(let player of this.game.players){
            for(let effect of player.effects){
              if(effect.source && effect.source == this){
                effect.remove();
              }
            }
          }
        }
      },
    RoleBeingRemoved: function (role, player, isExtraRole){
      if(role == this){
          for(let player of this.game.players){
            for(let effect of player.effects){
              if(effect.source && effect.source == this){
                effect.remove();
              }
            }
          }
      }
    },
    };
    
  }
};
