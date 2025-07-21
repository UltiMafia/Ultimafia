const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Kite extends Item {
  constructor(options) {
    super("Kite");

    this.reveal = options?.reveal;
    this.shooterMask = options?.shooterMask;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.baseMeetingName = "Fly Kite";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Fly Kite",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        inputType: "boolean",
        action: {
          labels: ["kill"],
          item: this,
          run: function () {
            if (this.target != "Yes") return;
            this.item.drop();
            //this.game.broadcast("gunshot");

            if (this.game.alivePlayers().length <= 3) {
              this.actor.queueAlert(
                `Kites can only be flown if there is more then 3 people!`
              );
              return;
            }

            var magicBullet = this.item.magicCult;
            var broken = this.item.broken;
            let players = this.game
              .alivePlayers()
              .filter(
                (p) => p.faction == this.actor.faction && p != this.actor
              );
            if (broken || magicBullet || players.length <= 0) {
              this.target = this.actor;
            } else {
              let players = this.game
                .alivePlayers()
                .filter(
                  (p) => p.faction == this.actor.faction && p != this.actor
                );
              this.target = Random.randArrayVal(players);
            }

            this.game.queueAlert(`${this.actor.name} flies a Kite!`);

            if (this.dominates()) {
              this.target.kill("basic", this.actor, true);
            }
          },
        },
      },
    };
  }

  get snoopName() {
    if (this.magicCult) {
      return "Kite (Gremlin)";
    } else if (this.broken) {
      return "Kite (Broken)";
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
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
