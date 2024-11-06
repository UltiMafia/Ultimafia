const Event = require("../Event");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class Famine extends Event {
  constructor(modifiers, game) {
    super("Famine", modifiers, game);
    //this.game.queueAlert(`Supplies ${modifiers}`);
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {
    super.doEvent();
    let victim = Random.randArrayVal(this.game.alivePlayers());
    this.action = new Action({
      actor: victim,
      target: victim,
      game: this.game,
      priority: PRIORITY_KILL_DEFAULT,
      labels: ["hidden", "absolute"],
      delay: 1,
      run: function () {
        if (this.game.SilentEvents != false) {
          this.game.queueAlert(
            `Event: Famine, Players with No Food Will Die, Tonight!`
          );
        }
        let foodTypes = ["Food", "Bread", "Orange"];
        let hasEaten = false;
        for (let person of this.game.players) {
          //let foodTypes = ["Food", "Bread", "Orange"];
          if (person.getImmunity("famine")) hasEaten = true;
          for (let food of foodTypes) {
            let foodItems = person.getItems(food);
            for (let item of foodItems) {
              if (!item.broken) {
                person.queueAlert("You eat some food.");
                item.eat();
                item.drop();
                hasEaten = true;
              }
            }
          }
          person.queueAlert("You are out of food!");
          if (!hasEaten) {
            let action = new Action({
              actor: person,
              target: person,
              game: person.game,
              power: 5,
              labels: ["kill", "famine"],
              run: function () {
                if (this.dominates()) this.target.kill("famine", this.actor);
              },
            });
            action.do();
          }
          hasEaten = false;
        }
      },
    });
    this.game.queueAction(this.action);
  }
};
