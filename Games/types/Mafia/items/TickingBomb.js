const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class TickingBomb extends Item {
  constructor(killer) {
    super("Ticking Bomb");

    this.killer = killer;
    this.baseMeetingName = "Pass Ticking Bomb";
    this.currentMeetingIndex = 0;
    this.lifespan = 1;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        if (this.timer) {
          return;
        }

        // bomb detonates between 10 and 30 seconds
        let toDetonate = Random.randInt(10000, 30000);
        this.timer = setTimeout(() => {
          this.drop();
          if (!this.holder.alive) {
            return;
          }

          let action = new Action({
            actor: this.killer,
            target: this.holder,
            game: this.holder.game,
            labels: ["kill", "bomb"],
            run: function () {
              if (this.dominates()) this.target.kill("bomb", this.actor, true);
            },
          });

          this.game.instantAction(action);
        }, toDetonate);
      },
    };

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Pass Ticking Bomb to",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["giveItem", "bomb"],
          item: this,
          run: function () {
            this.item.drop();
            this.item.hold(this.target);

            this.game.queueAlert(`${this.actor.name} passes the bomb to ${this.target.name}...`)
            this.item.incrementMeetingName();
            this.game.instantMeeting(this.item.meetings, [this.target]);
          },
        },
      },
    };
  }

  get snoopName() {
    return "Bomb (Ticking)";
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
