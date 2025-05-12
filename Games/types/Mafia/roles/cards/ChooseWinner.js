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

        if (
          this.FaithTarget != null &&
          this.FaithTarget != "No one" &&
          this.FaithTarget.alive &&
          this.player.hasAbility(["Win-Con"])
        ) {
          this.ReaperWin = true;
          if (this.FaithTarget.faction == "Independent") {
            this.ReaperWinningTeam = this.FaithTarget.role.name;
          } else {
            this.ReaperWinningTeam = this.FaithTarget.faction;
          }
        } else {
          this.FaithTarget = null;
        }
      },
    };
  }

  speak(message) {
    if(message.abilityName != ""){
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
    }
    formatedMessage = formatedMessage.toLowerCase();
    if(this.game.getStateName() != "Day") return;
    if (formatedMessage.includes("I claim Reaper and choose ")) {
      formatedMessage = formatedMessage.replace(
        "I claim Reaper and choose ",
        ""
      );

      let array = formatedMessage.split(" ");
      let playerName = array[0];
      if (array.length < 3) return;
      let playerTarget = false;
      let roleTarget = false;
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

      message.sender.role.data.GuessingPlayers.push(playerTarget);
      var action = new Action({
        actor: message.sender,
        target: playerTarget,
        game: message.sender.game,
        labels: ["hidden"],
        run: function () {
          if (this.actor == this.target) {
            this.actor.queueAlert(`You cannot choose yourself.`);
          }
          this.actor.queueAlert(
            `You choose ${this.target.name}, Their team will win if they survive today.`
          );
          this.actor.role.FaithTarget = this.target.name;
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
