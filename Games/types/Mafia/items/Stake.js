const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Stake extends Item {
  constructor(options) {
    super("Stake");

    this.reveal = options?.reveal;
    this.shooterMask = options?.shooterMask;
    this.broken = options?.broken;
    this.magicCult = options?.magicCult;

    this.baseMeetingName = "Stab with Stake";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Shoot",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill", "stake"],
          item: this,
          run: function () {
            this.item.drop();
            //this.game.broadcast("gunshot");

            var shooterMask = this.item.shooterMask;
            var reveal = shooterMask ? true : this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }
            if (shooterMask == null) {
              shooterMask = this.actor.name;
            }
            var broken = this.item.broken;
            var magicCult = this.item.magicCult;

            if (broken) {
              this.target = this.actor;
            }

            if (
              this.game.getRoleAlignment(
                this.target.getRoleAppearance().split(" (")[0]
              ) == "Village" ||
              this.game.getRoleAlignment(
                this.target.getRoleAppearance().split(" (")[0]
              ) == "Independent"
            ) {
              this.actor.queueAlert(
                `Your target was not evil so Your Stake did nothing!`
              );
              return;
            }

            if (this.target.role.alignment == "Cult" && magicCult) {
              this.actor.queueAlert(
                `Your target was not evil so Your Stake did nothing!`
              );
              return;
            }

            if (reveal && broken) {
              this.actor.queueAlert(
                `Your target was not evil so Your Stake did nothing!`
              );
              return;
            } else if (reveal && !broken) {
              this.game.queueAlert(
                `:bats: ${shooterMask} pulls a Stake and stabs at ${this.target.name}!`
              );
            } else
              this.game.queueAlert(
                `:bats: Someone stabs a Stake at ${this.target.name}!`
              );

            if (this.dominates()) {
              this.target.kill("gun", this.actor, true);
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
