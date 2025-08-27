const Card = require("../../Card");

module.exports = class BecomeRoleForNight extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Copy Actions": {
        states: ["Night"],
        flags: ["voting", "instant", "mustAct"],
        action: {
          role: this.role,
          run: function () {
            if (!this.role.canTargetPlayer(this.target)) {
              return;
            }

            let effect = this.actor.giveEffect(
              "ExtraRoleEffect",
              this.game.formatRoleInternal(
                this.target.role.name,
                this.target.role.modifier
              ),
              1,
              this.target.role.data
            );
            this.actor.joinMeetings(effect.ExtraRole.meetings);
            for (let meeting of this.game.meetings) {
              meeting.generateTargets();
            }
            this.actor.sendMeetings();
          },
        },
      },
    };

    this.meetingMods = {
      "*": {
        actionName: "Monkey Do",
      },
      "Copy Actions": {
        actionName: "Monkey See",
      },
      "Mafia Kill": {
        actionName: "Mafia Kill",
      },
      Village: {
        actionName: "Vote to Condemn",
      },
    };
  }
};
