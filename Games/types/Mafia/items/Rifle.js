const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Rifle extends Item {
  constructor(options) {
    super("Rifle");

    this.reveal = options?.reveal;
    this.shooterMask = options?.shooterMask;
    this.broken = options?.broken;
    this.magicCult = options?.magicCult;

    this.baseMeetingName = "Shoot Rifle";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Shoot",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        item: this,
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
            var broken = this.item.broken;
            var magicCult = this.item.magicCult;

            if (broken) {
              this.target = this.actor;
            }

            if (reveal && broken)
              this.game.queueAlert(
                `:gunfab: ${shooterMask} pulls a rifle, it backfires!`
              );
            else if (reveal && !broken)
              this.game.queueAlert(
                `:gun: ${shooterMask} pulls a rifle and shoots at ${this.target.name}!`
              );
            else
              this.game.queueAlert(
                `:gun: Someone fires a rifle at ${this.target.name}!`
              );

            if (magicCult && this.target.role.alignment !== "Cult") {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["convert", "hidden"],
                run: function () {
                  if (this.dominates()) this.target.setRole("Cultist");
                  const alignments = {
                    Independent: ["Village", "Mafia", "Cult"],
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
                  } else if (
                    opposingAlignment.includes(victimAlignment) === true
                  ) {
                    this.actor.holdItem("Rifle");
                    this.actor.queueGetItemAlert("Rifle");
                  }
                },
              });
              action.do();
              return;
            }

            if (this.dominates()) {
              this.target.kill("gun", this.actor, true);
            }

            const alignments = {
              Independent: ["Village", "Mafia", "Cult"],
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
