const Item = require("../Item");
const Random = require("../../../../lib/Random");

module.exports = class Rifle extends Item {
  constructor(options) {
    super("Rifle");

    this.reveal = options?.reveal;
    this.shooterMask = options?.shooterMask;
    this.cursed = options?.cursed;

    this.baseMeetingName = "Shoot Rifle";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Shoot",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill", "rifle"],
          item: this,
          run: function () {
            this.item.drop();
            this.game.broadcast("gunshot");

            var shooterMask = this.item.shooterMask;
            var reveal = shooterMask ? true : this.item.reveal;
            if (reveal == null) {
              reveal = Random.randArrayVal([true, false]);
            }
            if (shooterMask == null) {
              shooterMask = this.actor.name;
            }
            var cursed = this.item.cursed;

            if (cursed) {
              this.target = this.actor;
            }

            if (reveal && cursed)
              this.game.queueAlert(
                `:gunfab: ${shooterMask} pulls a rifle, it backfires!`
              );
            else if (reveal && !cursed)
              this.game.queueAlert(
                `:gun: ${shooterMask} pulls a rifle and shoots at ${this.target.name}!`
              );
            else
              this.game.queueAlert(
                `:gun: Someone fires a rifle at ${this.target.name}!`
              );

            if (this.dominates()) {
              this.target.kill("rifle", this.actor, true);
            }

            const alignments = {
              Independent: ["Village", "Mafia", "Cult"],
              Hostile: ["Village", "Mafia", "Cult"],
              Mafia: ["Village"],
              Cult: ["Village"],
              Village: ["Mafia", "Cult"],
            };

            var victimAlignment = this.target.role.alignment;
            var sameAlignment = this.actor.role.alignment;
            var opposingAlignment = alignments[sameAlignment];

            if (victimAlignment === sameAlignment) {
              if (this.dominates()) {
                this.actor.kill("rifle", this.actor, true);
              }
            } else if (opposingAlignment.includes(victimAlignment) === true) {
              this.actor.holdItem("Rifle");
              this.actor.queueGetItemAlert("Rifle");
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
