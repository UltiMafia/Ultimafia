const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class Sleuthing extends Card {
  constructor(role) {
    super(role);
  }

  hear(message) {
    if (!message.sender) {
      return;
    }
    if (message.sender.isEvil() && Random.randInt(0, 100) != 0) {
      return;
    }
    if (Random.randInt(0, 10) != 0) {
      return;
    }
    if (this.role.hasKilled && Random.randInt(0, 100) != 0) {
      return;
    }
    if (!this.role.hasAbility(["Kill"])) {
      return;
    }
    let formatedMessage = message.content;
    while (
      formatedMessage.includes("(") ||
      formatedMessage.includes(")") ||
      formatedMessage.includes('"')
    ) {
      formatedMessage = formatedMessage.replace("(", "");
      formatedMessage = formatedMessage.replace(")", "");
      formatedMessage = formatedMessage.replace('"', "");
      formatedMessage = formatedMessage.replace(".", "");
    }
    formatedMessage = formatedMessage.toLowerCase();
    if (this.game.getStateName() != "Day") return;
    if (
      formatedMessage.includes("cop") ||
      formatedMessage.includes("detective")
    ) {
      this.role.hasKilled = true;
      var action = new Action({
        actor: this.role.player,
        target: message.sender,
        game: message.sender.game,
        role: this.role,
        labels: ["kill", "curse", "hidden"],
        run: function () {
          if (this.dominates()) this.target.kill("curse", this.actor, true);
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }

  hearQuote(message) {
    if (!message.sender) {
      return;
    }
    if (message.sender.isEvil() && Random.randInt(0, 100) != 0) {
      return;
    }
    if (Random.randInt(0, 10) != 0) {
      return;
    }
    if (this.role.hasKilled && Random.randInt(0, 100) != 0) {
      return;
    }
    if (!this.role.hasAbility(["Kill"])) {
      return;
    }
    let formatedMessage = message.messageContent;
    while (
      formatedMessage.includes("(") ||
      formatedMessage.includes(")") ||
      formatedMessage.includes('"')
    ) {
      formatedMessage = formatedMessage.replace("(", "");
      formatedMessage = formatedMessage.replace(")", "");
      formatedMessage = formatedMessage.replace('"', "");
      formatedMessage = formatedMessage.replace(".", "");
    }
    formatedMessage = formatedMessage.toLowerCase();
    if (this.game.getStateName() != "Day") return;
    if (
      formatedMessage.includes("cop") ||
      formatedMessage.includes("detective")
    ) {
      this.role.hasKilled = true;
      var action = new Action({
        actor: this.role.player,
        target: message.sender,
        game: message.sender.game,
        role: this.role,
        labels: ["kill", "curse", "hidden"],
        run: function () {
          if (this.dominates()) this.target.kill("curse", this.actor, true);
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
