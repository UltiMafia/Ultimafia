const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class LoseIfGuessed extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.HasBeenGuessed == true) {
          for (let faction of EVIL_FACTIONS) {
            for (let player of this.game.players) {
              if (faction == player.faction) {
                winners.addPlayer(player, player.faction);
              }
            }
          }
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if (this.GuessUsed != null) {
          return;
        }
        this.HasBeenGuessed = false;
        this.GuessUsed = false;
      },
      state: function () {
        if (this.hasSentMessage == true) {
          return;
        }
        this.hasSentMessage = true;
        this.game.queueAlert(
          `There is a Statue in this Town, say "I think the Statue is (Player Name)" to guess who they are. They may only be guessed Once!`,
          0,
          this.game.players.filter(
            (p) => p.role.alignment === "Mafia" || p.role.alignment === "Cult"
          )
        );
      },
    };
  }

  hear(message) {
    if (!message.sender) {
      return;
    }
    if (!message.sender.isEvil()) {
      return;
    }
    if (
      message.abilityName == "Whisper" ||
      !this.role.hasAbility(["Win-Con"])
    ) {
      return;
    }
    if (this.role.GuessUsed == true) {
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
    if (formatedMessage.includes("i think the statue is ")) {
      formatedMessage = formatedMessage.replace("i think the statue is ", "");
      formatedMessage = formatedMessage.replace(" ", "");
      let playerName = formatedMessage;
      let playerTarget = false;
      for (let player of message.sender.game.players) {
        if (player.name.toLowerCase() == playerName) {
          playerTarget = player;
        }
      }
      if (playerTarget == false) {
        return;
      }

      this.role.GuessUsed = true;

      if (playerTarget != this.role.player) {
        return;
      }

      var action = new Action({
        actor: message.sender,
        target: playerTarget,
        game: message.sender.game,
        role: this.role,
        labels: ["hidden"],
        run: function () {
          this.role.HasBeenGuessed = true;
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
