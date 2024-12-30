const Card = require("../../Card");
const Action = require("../../Action");
const roles = require("../../../../../data/roles");
const {  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT } = require("../../const/Priority");

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
          priority:  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT-10,
          labels: ["investigate", "role", "hidden", "absolute"],
          run: function () {
            if (!this.actor.alive) return;
            if(this.actor.role.data.GuessingPlayers.length <= 0) return;
             if(this.actor.role.data.GuessingRoles.length <= 0) return;
            if(this.actor.role.data.HasInformation == true) return;
            this.actor.role.data.HasInformation = true;
            let info = this.game.createInformation(
              "WatcherRoleInfo",
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
    let formatedMessage = message.content.replaceAll("(", "");
    formatedMessage = formatedMessage.content.replaceAll(")", "");
    formatedMessage = formatedMessage.toLowerCase()
    if(this.player.role.data.GuessingCount >= 5) return;
    if(this.player.role.data.HasInformation == true) return;
    if (formatedMessage.toLowerCase().includes("i will analyze if ")) {
    formatedMessage = formatedMessage.content.replaceAll("i will analyze if ", "");
    
    let array = formatedMessage.split(" ");
    let playerName = array[0];
      if(array.length < 3) return;
    let roleName = array[2].charAt(0).toUpperCase()+array[2].slice(1);
      if(array.length >= 4){
        roleName = roleName + " "+array[3].charAt(0).toUpperCase()+array[3].slice(1);
      }
    let roles = Object.entries(roles.Mafia).map((roleData) => roleData[0].toLowercase);
    let playerTarget = false;
      for(let player of this.game.players){
        if(player.name.toLowerCase() == playerName){
          playerTarget = player;
        }
      }
      if(playerTarget == false){
        var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.target.queueAlert(
            `Invalid Player Name!`
          );
        },
      });
      this.game.instantAction(action);
      return;
      }
      if(!roles.includes(roleName)){
        var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.target.queueAlert(
            `Invalid Role!`
          );
        },
      });
      this.game.instantAction(action);
      return;
      }

      this.player.role.data.GuessingPlayers.push(playerTarget);
      this.player.role.data.GuessingRoles.push(roleName);
    this.player.role.data.GuessingCount++;
      var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.target.queueAlert(
            `You Guess has been logged you will learn about it tonight! You have ${5-this.actor.role.data.GuessingCount} guesses remaining.`
          );
        },
      });
      this.game.instantAction(action);
      return;
      
    }
  }



  
};
