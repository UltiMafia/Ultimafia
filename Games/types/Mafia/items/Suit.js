const Item = require("../Item");

module.exports = class Suit extends Item {
  constructor(options) {
    super("Suit");
    this.type = options?.type;
    this.concealed = options?.concealed;
    if (this.concealed) {
      this.cannotBeSnooped = true;
    }
    this.cannotBeStolen = true;
  }

  hold(player) {
    player.role.appearance.death = this.type;
    player.role.appearance.reveal = this.type;
    player.role.appearance.investigate = this.type;
    player.role.appearance.condemn = this.type;
    player.role.hideModifier = {
      death: true,
      reveal: true,
      investigate: true,
      condemn: true,
    };

    super.hold(player);
  }

  get snoopName() {
    return `Suit (${this.type})`;
  }
};
