const Item = require("../Item");

module.exports = class Blade extends Item {
  constructor(meetingName) {
    super("Blade");
    this.reveal = true;
    this.meetingName = meetingName;

    this.meetings = {
      [meetingName]: {
        actionName: "Battle",
        states: ["Day"],
        flags: [
          "group",
          "voting",
          "anonymous",
          "mustAct",
          "instant",
          "votesInvisible",
          "noUnvote",
          "multiSplit",
          "hideAfterVote",
        ],
        inputType: "custom",
        targets: ["Attack", "Defend", "Charge"],
        shouldMeet: function () {
          return this.actor.hp == 150 && this.target.hp == 150;
        },
        performAction: this.performAction.bind(this),
        run: this.run.bind(this),
      },
    };
  }

  run() {
    if (!this.actor.alive || !this.target.alive) return;

    let turn = 1;

    // While the actor or target is alive
    while (this.actor.hp > 0 && this.target.hp > 0) {
      this.game.queueAlert(`Turn ${turn}`);
      // Shows HP of Actor
      this.game.queueAlert(`${this.actor.name} HP: ${this.actor.hp}`);
      // Shows HP of Target
      this.game.queueAlert(`${this.target.name} HP: ${this.target.hp}`);

      // Stores their move selection
      let userVote = this.meeting.votes[actor.id];
      let enemyVote = this.meeting.votes[target.id];

      // If neither the user or target voted then return
      if (!userVote || !enemyVote) {
        return;
      }

      // Custom messages for the battle
      if (turn == 1) {
        this.game.queueAlert(`${this.actor} unsheathes katana!`);
        this.game.queueAlert(`${this.target} eyes glow red.`);
      }

      let wellDoneSent = false;
      let criticalSent = false;
      let deathSent = false;

      let customMessage = "";
      if (this.actor.hp <= 50 && this.actor.hp >= 30 && !wellDoneSent) {
        customMessage = `You have done well so far... But that was just practice!`;
        this.game.queueAlert(customMessage);
        wellDoneSent = true;
      } else if (this.actor.hp <= 30 && this.actor.hp >= 20 && !criticalSent) {
        customMessage = "No more games, to the death!";
        this.game.queueAlert(customMessage);
        criticalSent = true;
      } else if (this.actor.hp <= 0 && !deathSent) {
        customMessage = "I can't fall into the hands of an enemy... So I...";
        this.game.queueAlert(customMessage);
        customMessage = "Fulfill a samurai's final duty...";
        this.game.queueAlert(customMessage);
        deathSent = true;
      }

      // Set a state for deciding if an attack has been made
      let attackMade = false;

      // Decide whose action goes first
      let firstMove = Math.floor(Math.random() * 2);

      // User goes first
      if (firstMove === 0) {
        this.performAction(actor, target, userVote, attackMade);
        //Changes the state for attack made incase a defend happens.
        attackMade = true;
        this.performAction(target, actor, enemyVote, attackMade);
      } else {
        // Target goes first
        this.performAction(target, actor, enemyVote, attackMade);

        //Changes the state for attack made incase a defend happens
        attackMade = true;
        this.performAction(actor, target, userVote, attackMade);
      }
      //Increase the turn after actions have been used
      turn++;
    }
    // If the actor or target died, set the winner
    this.actor.winner = actor.hp > 0 ? this.actor.name : this.target.name;
    this.game.queueAlert(`${this.actor.winner} has won the duel!`);

    // Remove items (if necessary)
    this.actor.item.drop();
    this.target.item.drop();
  }

  performAction(user, enemy, choice, attackMade) {
    let selection = moves.find((move) => move[choice]);
    if (selection) {
      //If an attack hasn't been made assess the messages for defend
      if (!attackMade && choice == "Defend") {
        let defend = moves.find((move) => move.Defend);
        if (defend) {
          let critFailure = " Unable to defend from crits.";
          defend.Defend.action.run.msg += critFailure;
        }
      }
      selection[choice].action.run.call({ user, enemy });
      this.game.queueAlert(selection[choice].msg);
    }
  }
};

//Shows a list of moves samurai and their opponent can choose
let moves = [
  {
    // Basic attack move, deals 3-10 base damage.
    Attack: {
      actionName: "Attack",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["attack"],
        run: function () {
          let damage = Math.floor(Math.random() * 4) + 10;
          this.target.hp -= damage;
          msg = `${this.actor.name} uses slash. ${this.target.name} loses ${
            damage * (1 + this.actor.crit) * (1 - this.target.def / 100) +
            this.actor.atk
          } HP!`;
        },
      },
    },
  },
  {
    // Basic defense increase move stored as a multiplier
    Defend: {
      actionName: "Defend",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["defend"],
        run: function () {
          let damageBlocked = Math.floor(Math.random() * 6) * 10;
          this.actor.def += damageBlocked;
          msg = `${this.actor.name} uses defend! Defense is increased.`;
        },
      },
    },
  },
  {
    // Basic attack boost move stored as a multiplier
    Charge: {
      actionName: "Charge",
      // Can only be done in the day
      states: ["Day"],
      flags: ["voting", "instant", "noVeg"],
      msg: "",
      action: {
        labels: ["charge"],
        run: function () {
          this.actor.crit += 0.25;
          msg = `${this.actor.name} uses charge! Attack power increased.`;
        },
      },
    },
  },
];
