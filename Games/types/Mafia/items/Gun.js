const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Gun extends Item {
  constructor(options) {
    super("Gun");

    this.reveal = options?.reveal;
    this.mafiaImmune = options?.mafiaImmune;
    this.cursed = options?.cursed;

    this.baseMeetingName = "Shoot Gun";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Shoot",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill", "gun"],
          item: this,
          run() {
            this.item.drop();
            this.game.broadcast("gunshot");

            let { shooterMask } = this.actor.role.data;
            let reveal = shooterMask ? true : this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }
            if (shooterMask == null) {
              shooterMask = this.actor.name;
            }

            const { mafiaImmune } = this.item;
            const { cursed } = this.item;

            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed)
              this.game.queueAlert(
                `:sy0b: ${shooterMask} pulls a gun, it backfires!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `:sy0a: ${shooterMask} pulls a gun and shoots at ${this.target.name}!`
              );
            else
              this.game.queueAlert(
                `:sy0a: Someone fires a gun at ${this.target.name}!`
              );

            // kill
            let toKill = this.dominates();
            if (mafiaImmune && this.target.role.alignment == "Mafia")
              toKill = false;

            if (toKill) {
              this.target.kill("gun", this.actor, true);
            }
          },
        },
      },
    };
  }

  get snoopName() {
    if (this.mafiaImmune) {
      return "Gun (Associate)";
    }
    if (this.cursed) {
      return "Gun (Cursed)";
    }

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
    const mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
