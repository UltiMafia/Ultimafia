const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class GuessFiveRoles extends Card {
  constructor(role) {
    super(role);
    /*
    this.meetings = {
      "Select Players": {
        actionName: "Select Players (0-5)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 0,
        multiMax: 5,
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Roles": {
        actionName: "Select Roles (0-5)",
        states: ["Night"],
        flags: ["voting", "multi"],
        inputType: "role",
        targets: { include: ["all"] },
        multiMin: 0,
        multiMax: 5,
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Confirm Guesses": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            let correctCount = 0;

            let playerSize = this.actor.role.data.targetPlayer.length;
            let roleSize = this.actor.role.data.targetRole.length;
            let validSize;
            if (roleSize > playerSize) {
              validSize = playerSize;
            } else {
              validSize = roleSize;
            }

            let targetPlayer;
            let targetRole;
            for (let x = 0; x < validSize; x++) {
              targetPlayer = this.actor.role.data.targetPlayer[x];
              targetRole = this.actor.role.data.targetRole[x];
              if (targetPlayer && targetRole) {
                if (targetRole === targetPlayer.role.name) {
                  correctCount = correctCount + 1;
                }
                this.actor.queueAlert(
                  `:invest: You guessed ${targetPlayer.name} as ${targetRole}.`
                );
              }
            }

            if (this.actor.hasEffect("FalseMode")) {
              correctCount = validSize - correctCount;
            }

            this.actor.queueAlert(
              `:invest: After a long night of investigations, you learn that ${correctCount} of your guesses were correct.`
            );
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRole;
          },
        },
      },
    };
*/

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) => r
        );
        this.data.GuessingPlayers = [];
        this.data.GuessingRoles = [];
        this.data.GuessingCount = 0;
        this.data.HasInformation = false;
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
          role: this,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate", "role", "hidden", "absolute"],
          run: function () {
            if (!this.actor.alive) return;
            if (
              this.role.data.GuessingPlayers == null ||
              this.role.data.GuessingPlayers.length <= 0
            )
              return;
            if (
              this.role.data.GuessingRoles == null ||
              this.role.data.GuessingRoles.length <= 0
            )
              return;
            if (this.role.data.HasInformation == true) return;
            this.role.data.HasInformation = true;

            let info = this.game.createInformation(
              "GuessRoleInfo",
              this.actor,
              this.game,
              this.role.data.GuessingPlayers,
              this.role.data.GuessingRoles,
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
    if (message.abilityName == "Whisper") {
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
    if (message.sender.role.data.GuessingCount >= 5) return;
    if (message.sender.role.data.HasInformation == true) return;
    if (formatedMessage.includes("i will analyze if ")) {
      formatedMessage = formatedMessage.replace("i will analyze if ", "");

      let array = formatedMessage.split(" ");
      let playerName = array[0];
      if (array.length < 3) return;
      let roleName = array[2].charAt(0).toUpperCase() + array[2].slice(1);
      if (array.length >= 4) {
        roleName =
          roleName + " " + array[3].charAt(0).toUpperCase() + array[3].slice(1);
      }
      let rolesVar = Object.entries(roles.Mafia).map((roleData) => roleData[0]);
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
      for (let r of rolesVar) {
        if (r.toLowerCase() == roleName.toLowerCase()) {
          roleTarget = r;
        }
      }
      if (roleTarget == false) {
        var action = new Action({
          actor: message.sender,
          target: message.sender,
          game: message.sender.game,
          labels: ["hidden"],
          run: function () {
            this.target.queueAlert(`Invalid Role ${roleName}!`);
          },
        });
        message.sender.game.instantAction(action);
        return;
      }

      message.sender.role.data.GuessingPlayers.push(playerTarget);
      message.sender.role.data.GuessingRoles.push(roleTarget);
      message.sender.role.data.GuessingCount++;
      var action = new Action({
        actor: message.sender,
        target: message.sender,
        game: message.sender.game,
        labels: ["hidden"],
        run: function () {
          this.target.queueAlert(
            `Your Guess has been logged you will learn about it tonight! You have ${
              5 - this.actor.role.data.GuessingCount
            } guesses remaining.`
          );
        },
      });
      message.sender.game.instantAction(action);
      return;
    }
  }
};
