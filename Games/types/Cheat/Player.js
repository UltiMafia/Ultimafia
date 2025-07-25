const Player = require("../../core/Player");

module.exports = class CheatPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
    this.usesCount = 0;
    this.CardsInHand = [];
    this.AmountBidding = 0;
  }
  /*
  parseCommand(message) {
    var cmd = super.parseCommand(message);

    if (!cmd) return;

    if (this.usesCount >= 6) return;
    this.usesCount++;

    if (cmd.name == "hack") {
      switch (cmd.text) {
        case "see_other_dice true":
          this.game.sendAlert(
            `${this.name} used /hack see_other_dice true. They can now see everyone's dice.`
          );
          break;
        case "see_other_dice false":
          this.game.sendAlert(
            `${this.name} used /hack see_other_dice false. They can no longer see everyone's dice.`
          );
          break;
        case "read_minds true":
          this.game.sendAlert(
            `${this.name} used /hack read_minds true. They can now know what everyone is thinking.`
          );
          break;
        case "read_minds false":
          this.game.sendAlert(
            `${this.name} used /hack read_minds false. They can no longer know what everyone is thinking.`
          );
          break;
      }
    }
  }
  */
};
