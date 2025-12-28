const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class ChooseWinner extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.ReaperWinningTeam) {
          for (let player of this.game.players) {
            if (
              player.role.name == this.ReaperWinningTeam ||
              player.faction == this.ReaperWinningTeam
            ) {
              winners.addPlayer(player, this.ReaperWinningTeam);
            }
          }
        }
      },
    };

    this.listeners = {
      afterActions: function () {
        if (
          this.game.getStateName() == "Day" ||
          this.game.getStateName() == "Dusk"
        ) {
          if (
            this.FaithTarget != null &&
            this.FaithTarget != "No one" &&
            this.FaithTarget.alive &&
            this.hasAbility(["Win-Con", "WhenDead"])
          ) {
            this.ReaperWin = true;
            if (this.FaithTarget.getFaction() == "Independent") {
              this.ReaperWinningTeam = this.FaithTarget.role.name;
            } else {
              this.ReaperWinningTeam = this.FaithTarget.getFaction();
            }
          } else {
            this.FaithTarget = null;
          }
        }
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          let toDetonate = 60000;
          this.timer = setTimeout(() => {
            if (this.game.finished) {
              return;
            }

            let action = new Action({
              role: this,
              target: this.player,
              game: this.player.game,
              labels: ["kill", "bomb"],
              run: function () {
                if (this.game.getStateName() != "Day") {
                  return;
                }
                if (this.role.FaithTarget != null) {
                  return;
                }
                this.target.queueAlert(
                  `The time to use your ability has passed.`
                );
                this.role.FaithTarget = "No One";
              },
            });

            this.game.instantAction(action);

            this.timer = null;
          }, toDetonate);
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        this.timer = null;
      },
    };
  }

  speak(message) {
    if (!message.sender) {
      return;
    }
    if (message.sender != this.role.player) {
      return;
    }
    if (
      message.abilityName == "Whisper" ||
      !this.role.hasAbility(["Win-Con"])
    ) {
      return;
    }
    if (this.role.FaithTarget != null) {
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
    if (formatedMessage.includes("i claim reaper and choose ")) {
      formatedMessage = formatedMessage.replace(
        "i claim reaper and choose ",
        ""
      );
      formatedMessage = formatedMessage.replace(" ", "");
      let playerName = formatedMessage;
      let playerTarget = false;
      for (let player of message.sender.game.players) {
        if (player.name.toLowerCase() == playerName) {
          playerTarget = player;
        }
      }
      if (playerTarget == false) {
        var action = new Action({
          actor: message.sender,
          target: message.sender,
          game: message.sender.game,
          labels: ["hidden"],
          run: function () {
            this.target.queueAlert(`Invalid Player Name!`);
          },
        });
        message.sender.game.instantAction(action);
        return;
      }

      var action = new Action({
        role: this.role,
        actor: message.sender,
        target: playerTarget,
        game: message.sender.game,
        labels: ["hidden"],
        run: function () {
          if (this.actor == this.target) {
            this.actor.queueAlert(`You cannot choose yourself.`);
            return;
          }
          this.actor.queueAlert(
            `You choose ${this.target.name}, Their team will win if they survive today.`
          );
          this.role.FaithTarget = this.target;
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
