const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class PossiblyRegisterAsEvil extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player != this.player) return;

        if (player.hasEffect("Insanity")){
          player.setTempAppearance("reveal", "real");
          player.setTempAppearance("investigate", "real");
          return;
        }

        if (this.player.role.alignment == "Outcast") return;

        let appearance = Random.randArrayVal(this.game.allCharactersByAlignment[this.player.role.alignment]);
        player.setTempAppearance("reveal", appearance);
        player.setTempAppearance("investigate", appearance);
      },
    };
  }
};
