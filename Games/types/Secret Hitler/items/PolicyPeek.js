const Item = require("../Item");

module.exports = class PolicyPeek extends Item {
  constructor() {
    super("Policy Peek");
    this.lifespan = 1;
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(
      `The President ${player.name} is peeking at the policies…`
    );

    let policies = this.game.drawDiscardPile.peekMultiple(3);
    player.queueAlert(
      `You see that ${policies.join(", ")} are the three next policies.`
    );
  }
};
