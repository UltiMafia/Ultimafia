const Card = require("../../Card");

module.exports = class Humble extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };
    this.hideStartItems = true;

    var appearance;
    if (this.role.alignment === "Village" || this.role.winCount === "Village") {
      appearance = "Villager";
    } else if (this.role.alignment === "Mafia") {
      appearance = "Mafioso";
    } else if (this.role.alignment === "Cult") {
      appearance = "Cultist";
    } else if (this.role.alignment === "Independent") {
      appearance = "Grouch";
    }

    if (!appearance) {
      return;
    }
    let tempApp = {
      self: appearance,
      reveal: appearance,
    };
    this.editAppearance(tempApp);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        for (let item of this.player.startingItems) {
          item.noShow = true;
        }
      },
    };
  }
};
