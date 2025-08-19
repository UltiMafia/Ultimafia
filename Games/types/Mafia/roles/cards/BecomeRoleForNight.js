const Card = require("../../Card");

module.exports = class BecomeRoleForNight extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Copy Actions": {
        states: ["Night"],
        flags: ["voting", "instant", "mustAct"],
        action: {
          run: function () {
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

            /*
            let currRole = this.actor.role.name;
            let currModifiers = this.actor.role.modifier;
            let currData = this.actor.role.data;

            if (
              this.game.getRoleAlignment(this.target.role.name) == "Independent"
            ) {
              return;
            }

            this.actor.holdItem(
              "ReturnToRole",
              currRole,
              currModifiers,
              currData,
              this.target.role.name
            );
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data,
              true,
              true,
              false,
              "No Change"
            );

            this.actor.joinMeetings(this.actor.role.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();

            //this.actor.role.priorityOffset = -1;

            if (this.actor.role.name != currRole) {
              this.actor.role.name = currRole;
              this.actor.role.appearance.death = currRole;
              this.actor.role.appearance.reveal = currRole;
              this.actor.role.appearance.investigate = currRole;
              this.actor.role.appearance.condemn = currRole;
              this.actor.role.alignment = this.game.getRoleAlignment(currRole);
            }
            */
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
            if (
              this.game.getRoleTags(player.role.name).includes("Copy Actions")
            ) {
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
