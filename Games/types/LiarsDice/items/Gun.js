const Item = require("../Item");

module.exports = class Gun extends Item {
  constructor() {
    super("Gun");
    this.meetings = {
      Shoot: {
        actionName: "Shoot Player",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          item: this,
          run: function () {
            this.item.drop();
            this.game.broadcast("gunshot");

            this.game.queueAlert(
              `:gun: Someone pulls a gun and shoots at ${this.target.name}!`
            );
            this.target.queueAlert(
              `You lose a Dice but you won't learn which until this turn ends!`
            );
            this.game.removeDice(this.target);
            let dice = this.target.rolledDice.pop();
            this.game.allDice -= 1;
            this.game.allRolledDice.splice(
              this.game.allRolledDice.indexOf(dice),
              1
            );
          },
        },
      },
    };
  }
};
