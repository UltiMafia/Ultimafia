const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class GuideWithFaith extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.role.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) => r
        );
        this.player.role.data.GuessingPlayers = [];
        this.player.role.data.GuessingRoles = [];
        this.player.role.data.GuessingCount = 0;
        this.player.role.data.HasInformation = false;
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        let guessOptions = this.player.role.data.ConvertOptions;
        //ConvertOptions.push("None");
        //this.meetings["Guess Role"].targets = guessOptions;

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate", "role", "hidden", "absolute"],
          run: function () {
            if (!this.actor.alive) return;
            if (
              this.actor.role.data.GuessingPlayers == null ||
              this.actor.role.data.GuessingPlayers.length <= 0
            )
              return;
            if (
              this.actor.role.data.GuessingRoles == null ||
              this.actor.role.data.GuessingRoles.length <= 0
            )
              return;
            if (this.actor.role.data.HasInformation == true) return;
            this.actor.role.data.HasInformation = true;

            let info = this.game.createInformation(
              "GuessRoleInfo",
              this.actor,
              this.game,
              this.actor.role.data.GuessingPlayers,
              this.actor.role.data.GuessingRoles,
              true
            );

            info.processInfo();

            info.getGuessMessages();
            this.actor.queueAlert(`:invest: ${info.getInfoFormated()}`);
          },
        });

        this.game.queueAction(action);
      },
    };
  }

  speak(message) {
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
    if (message.sender.role.data.GuessingCount >= 5) return;
    if (message.sender.role.data.HasInformation == true) return;
    if (formatedMessage.includes("Let us all have faith in ")) {
      formatedMessage = formatedMessage.replace("Let us all have faith in ", "");

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
          if(this.actor == this.target){
          this.actor.queueAlert(
            `You cannot place your faith in yourself.`
          );
          }
          this.actor.queueAlert(
            `You place your faith in ${this.target.name}, Their team will win if they survive today.`
          );
          this.actor.role.FaithTarget = this.target.name;
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
