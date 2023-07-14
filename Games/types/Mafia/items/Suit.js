const Item = require("../Item");

module.exports = class Suit extends Item {
  constructor(type) {
    super("Suit");
    this.type = type;
    this.cannotBeStolen = true;
  }

  hold(player) {
    player.role.appearance.death = this.type;
    player.role.appearance.reveal = this.type;
    player.role.appearance.investigate = this.type;
    player.role.appearance.condemn = this.type;

    super.hold(player);
  }

  get snoopName() {
    return `Suit (${this.type})`;
  }
};
