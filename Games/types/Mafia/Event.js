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
    if (this.game.dayCount != 1 && this.modifiers.includes("Suspended")) {
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
        this.game.CurrentEvents.splice(
          this.game.CurrentEvents.indexOf(this.fullName),
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

  generatePossibleVictims(includeDead, playersToExclude, alignment) {
    let players = this.game.players.filter(
      (p) => !playersToExclude.includes(p)
    );
    if (includeDead != true) {
      players = players.filter((p) => p.alive);
    }
    if (alignment) {
      players = players.filter((p) => p.role.alignment == alignment);
    }
    players = players.filter((p) => this.canTargetPlayer(p));
  }

  canTargetPlayer(player) {
    if (this.modifiers.includes("Loyal") && player.isEvil()) {
      return false;
    } else if (this.modifiers.includes("Disloyal") && !player.isEvil()) {
      return false;
    }
    if (this.modifiers.includes("Holy") && player.isDemonic(true)) {
      return false;
    } else if (this.modifiers.includes("Unholy") && !player.isDemonic(true)) {
      return false;
    }
    if (this.modifiers.includes("Simple") && !this.isVanilla(p)) {
      return false;
    } else if (this.modifiers.includes("Complex") && this.isVanilla(p)) {
      return false;
    }
    return true;
  }

  isVanilla(player) {
    if (
      player.role.name == "Villager" ||
      player.role.name == "Mafioso" ||
      player.role.name == "Cultist" ||
      player.role.name == "Grouch"
    ) {
      return true;
    }
    return false;
  }
};
