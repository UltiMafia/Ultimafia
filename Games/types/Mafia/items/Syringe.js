const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Syringe extends Item {
  constructor(options) {
    super("Syringe");

    this.reveal = options?.reveal;

    this.baseMeetingName = "Use Syringe";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Reanimate",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        action: {
          labels: ["revive", "syringe"],
          item: this,
          run: function () {
            this.item.drop();

            var shooterMask = this.actor.role.data.shooterMask;
            var reveal = shooterMask ? true : this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }
            if (shooterMask == null) {
              shooterMask = this.actor.name;
            }

            if (reveal)
              this.game.queueAlert(
                `:poison: ${shooterMask} plunges a syringe into ${this.target.name}'s corpse! ${this.target.name} rises from the grave…`
              );
            else
              this.game.queueAlert(
                `:poison: Someone plunges a syringe into ${this.target.name}! ${this.target.name} rises from the grave…`
              );

            if (this.dominates()) {
              this.target.revive("basic", this.actor);
            }
          },
        },
      },
    };
  }

  get snoopName() {
    return this.name;
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
