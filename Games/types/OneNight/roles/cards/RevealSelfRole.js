const Card = require("../../Card");

module.exports = class RevealSelfRole extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: 50,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          this.actor.role.revealToSelf();
        },
      },
    ];
  }
};
