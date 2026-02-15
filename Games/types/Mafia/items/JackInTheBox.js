const Item = require("../Item");
const Random = require("../../../../lib/Random");
const Player = require("../Player");
const Action = require("../Action");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_NIGHT_ROLE_BLOCKER,
} = require("../const/Priority");

module.exports = class JackInTheBox extends Item {
  constructor(options) {
    super("Jack-In-The-Box");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.baseMeetingName = "Gain Power";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        states: ["Night"],
        actionName: "Gain Power",
        flags: ["voting", "instant", "noVeg"],
        inputType: "AllRoles",
        AllRolesFilters: ["banished", "village"],
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          item: this,
          run: function () {
            if (this.target == "None") return;
            this.item.drop("No");

            if(this.item.broken || this.item.magicCult){
              return;
            }

            let effect = this.actor.giveEffect(
              "ExtraRoleEffect",
              this.target,
              1
            );
            this.actor.joinMeetings(effect.ExtraRole.meetings);
            for (let meeting of this.game.meetings) {
              meeting.generateTargets();
            }
            this.actor.sendMeetings();

            var actionCopy = new Action({
              actor: null,
              target: this.actor,
              game: this.game,
              priority: PRIORITY_CONVERT_DEFAULT,
              labels: ["hidden", "absolute"],
              run: function () {
                this.target.send(
                  "players",
                  this.target.game.getAllPlayerInfo(this.target)
                );
              },
            });
            this.game.queueAction(actionCopy);
          },
        },
      },
    };
  }

  getMeetingName(idx) {
    return `${this.id} ${idx}`;
  }

  getCurrentMeetingName() {
    if (this.currentMeetingIndex === 0) {
      return this.baseMeetingName;
    }

    return this.getMeetingName(this.currentMeetingIndex);
  }

  // increase meeting name index to ensure each meeting name is unique
  incrementMeetingName() {
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
