const Item = require("../Item");

module.exports = class GoldenCarp extends Item {
  constructor() {
    super("Golden Carp");
  }

  hold(player) {
    super.hold(player);
    player.game.sendAlert(`${player.name} has caught a Golden Carp!`);
    player.sendAlert(`If you collect 3 Golden Carps you win!`);
    player.giveEffect("WinWith3GoldenCarps");
  }
};
