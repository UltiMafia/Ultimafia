const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class HostActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Do Host Action": {
        actionName: "Host Actions",
        states: ["Day"],
        flags: ["voting", "instant", "instantButChangeable","repeatable", "noVeg"],
        inputType: "custom",
        targets: ["Nothing", "Run Poll", "Gain Gun", "Grant Poll Vote Immunity"],
        action: {
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target === "Run Poll") {
              this.actor.role.data.PollVotes = [];
              this.game.queueAlert(
                "The Host has decided to Do a Poll"
              );
              for (const player of this.game.alivePlayers()) {
                let ShareWith = player.holdItem("HostPlayerPoll", this.actor);
               this.game.instantMeeting(ShareWith.meetings, [player]);
              }
            }
            else if (this.target === "Grant Poll Vote Immunity") {
                let temp = this.actor.holdItem("HostGrantImmuity", this.actor);
               this.game.instantMeeting(temp.meetings, [this.actor]);
              
              
            }
            else if (this.target === "Gain Gun") {
                let gun = this.actor.holdItem("Gun");
               this.game.instantMeeting(gun.meetings, [this.actor]);

            }
          },
        },
      },
    };
  }
};
