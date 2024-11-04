const Event = require("../../core/Event");

module.exports = class MafiaEvent extends Event {
  constructor(name, modifiers, game, data) {
    super(name, modifiers, game, data);
    //this.game.queueAlert(`Mafia ${modifiers}`);
  }

  getModifierRequirements() {
    if (this.modifiers == null) return true;
    //this.game.queueAlert("Checks Null");
    if (this.game.dayCount % 2 == 0 && this.modifiers.includes("Odd")) {
      return false;
    }
    //this.game.queueAlert(`${this.modifiers} ${this.modifiers.includes("Odd")}`);
    if (this.game.dayCount % 2 == 1 && this.modifiers.includes("Even")) {
      return false;
    }
    if (this.game.dayCount == 1 && this.modifiers.includes("Delayed")) {
      return false;
    }
    return true;
  }

  doEvent() {
    if (this.modifiers != null) {
      if (
        this.modifiers.includes("One Shot") &&
        !this.modifiers.includes("Banished")
      ) {
        this.game.PossibleEvents.splice(
          this.game.PossibleEvents.indexOf(this.fullName),
          1
        );
      } else if (
        this.modifiers.includes("One Shot") &&
        this.modifiers.includes("Banished")
      ) {
        this.game.BanishedEvents.splice(
          this.game.BanishedEvents.indexOf(this.fullName),
          1
        );
      }
    }
  }
};
