const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class LoseIfGuessed extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.player.role.ReaperWinningTeam) {
          for (let player of this.game.players) {
            if (
              player.role.name == this.player.role.ReaperWinningTeam ||
              player.faction == this.player.role.ReaperWinningTeam
            ) {
              winners.addPlayer(player, this.player.role.ReaperWinningTeam);
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
            this.player.role.FaithTarget != null &&
            this.player.role.FaithTarget != "No one" &&
            this.player.role.FaithTarget.alive &&
            this.player.hasAbility(["Win-Con", "WhenDead"])
          ) {
            this.ReaperWin = true;
            if (this.player.role.FaithTarget.faction == "Independent") {
              this.player.role.ReaperWinningTeam = this.FaithTarget.role.name;
            } else {
              this.player.role.ReaperWinningTeam =
                this.player.role.FaithTarget.faction;
            }
          } else {
            this.player.role.FaithTarget = null;
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
              target: this.player,
              game: this.player.game,
              labels: ["kill", "bomb"],
              run: function () {
                if (this.game.getStateName() != "Day") {
                  return;
                }
                if (this.target.role.FaithTarget != null) {
                  return;
                }
                this.target.queueAlert(
                  `The time to use your ability has passed.`
                );
                this.target.role.FaithTarget = "No One";
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
        /*
        if (
          this.player.role.FaithTarget != null &&
          this.player.role.FaithTarget != "No one" &&
          this.player.role.FaithTarget.alive &&
          this.player.hasAbility(["Win-Con"])
        ) {
          this.ReaperWin = true;
          if (this.player.role.FaithTarget.faction == "Independent") {
            this.player.role.ReaperWinningTeam = this.FaithTarget.role.name;
          } else {
            this.player.role.ReaperWinningTeam = this.player.role.FaithTarget.faction;
          }
        } else {
          this.player.role.FaithTarget = null;
        }
        */
      },
    };
  }

  hear(message) {
    if (
      message.abilityName == "Whisper" ||
      !message.sender.hasAbility(["Win-Con"])
    ) {
      return;
    }
    if (message.sender.role.FaithTarget != null) {
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
    if (formatedMessage.includes("i guess that the damsal is ")) {
      formatedMessage = formatedMessage.replace(
        "i guess that the damsal is ",
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
          this.actor.role.FaithTarget = this.target;
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
