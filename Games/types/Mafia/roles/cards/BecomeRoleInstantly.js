const Card = require("../../Card");

module.exports = class BecomeRoleInstantly extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Copy Role": {
        states: ["Dusk", "Sunset"],
        flags: ["voting", "instant", "mustAct"],
        action: {
          run: function () {
            this.actor.faction = this.target.faction;
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`
            );

            //this.actor.role.priorityOffset = -1;
            /*
            if (this.actor.role.name != "Clone") {
              //this.incrementMeetingName();
              //this.game.instantMeeting(this.actor.role.meetings, [this.actor]);
              //this.events.emit("state", this.game.getStateInfo(this.game.currentState));
              this.actor.joinMeetings(this.actor.role.meetings);
              //this.actor.role.meetings.generateTargets();
              this.actor.sendMeetings();
              
            }
            */
          },
        },
      },
    };

    this.stateMods = {
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 60,
        shouldSkip: function () {
          for (let player of this.game.players) {
            if (player.role.name === "Clone") {
              return false;
            }
          }
          return true;
        },
      },
    };
  }
};
