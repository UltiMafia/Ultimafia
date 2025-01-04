const Item = require("../Item");

module.exports = class Snooping extends Item {
  constructor() {
    super("Snooping");
    this.meetings = {
      Snoop: {
        actionName: "Snoop Dice",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          item: this,
          run: function () {
            this.item.drop();

            let info = [];
            for (let dice of this.target.rolledDice) {
              if (dice == 1) {
                info.push(":Dice1:");
              }
              if (dice == 2) {
                info.push(":Dice2:");
              }
              if (dice == 3) {
                info.push(":Dice3:");
              }
              if (dice == 4) {
                info.push(":Dice4:");
              }
              if (dice == 5) {
                info.push(":Dice5:");
              }
              if (dice == 6) {
                info.push(":Dice6:");
              }
            }

            this.actor.queueAlert(
              `:invest: ${this.target.name} has ${info.join(" ")}`
            );
          },
        },
      },
    };
  }
};
