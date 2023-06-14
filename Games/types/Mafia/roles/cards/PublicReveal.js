const Card = require("../../Card");

module.exports = class PublicReveal extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned(player) {
        if (player !== this.player) {
          return;
        }

        this.data.revealed = true;
        this.revealToAll();
      },
    };
  }
};
