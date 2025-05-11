const Card = require("../../Card");

module.exports = class MoveSnake extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "MoveSnake": {
        actionName: "Move your snake",
        states: ["*"],
        flags: ["voting", "instant", "instantButChangeable", "repeatable"],
        inputType: "custom",
        targets: ['Up', "Right", "Down", "Left"],
        canUnvote: true,
        action: {
          item: this,
          run: function () {
            this.actor.direction = this.target;
            console.log('move', this.actor)
            // if (this.target == "Call") {
            //   //this.game.sendAlert(`${this.actor.name} Calls!`);
            //   this.game.addToPot(this.actor, "Call");
            //   this.actor.hasHadTurn = true;
            // }
            // if (this.target == "All-In") {
            //   this.game.sendAlert(`${this.actor.name} goes All In!`);
            //   this.game.addToPot(this.actor, "Bet", this.actor.Chips);
            //   this.actor.hasHadTurn = true;
            // }
            // if (this.target == "Fold") {
            //   this.game.sendAlert(`${this.actor.name} Folds!`);
            //   this.actor.hasFolded = true;
            //   this.actor.hasHadTurn = true;
            // }
            // if (this.target == "Check") {
            //   this.game.sendAlert(`${this.actor.name} Checks!`);
            //   this.actor.hasHadTurn = true;
            // }

            // this.item.drop();
            // this.actor.getMeetings().forEach((meeting) => {
            //   if (IMPORTANT_MEETINGS.includes(meeting.name)) {
            //     meeting.leave(this.actor, true);
            //   }
            // });
            // for (let player of this.game.players) {
            //   player.getMeetings().forEach((meeting) => {
            //     if (ROLE_MEETINGS.includes(meeting.name)) {
            //       meeting.leave(player, true);
            //     }
            //   });
           }
        },
      },
    };
  }
};
