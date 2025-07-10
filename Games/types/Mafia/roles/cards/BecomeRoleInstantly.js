const Card = require("../../Card");

module.exports = class BecomeRoleInstantly extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Copy Role": {
        states: ["Night"],
        flags: ["voting", "instant", "mustAct"],
        action: {
          run: function () {
            this.actor.faction = this.target.faction;
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data,
              true,
              true,
              false,
              this.target.faction
            );

            this.actor.joinMeetings(this.actor.role.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();
          },
        },
      },
    };
    /*
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
    */
  }
};
