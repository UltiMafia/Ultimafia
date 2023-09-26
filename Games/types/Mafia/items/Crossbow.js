const Item = require("../Item");
const Action = require("../Action");

module.exports = class Crossbow extends Item {
  constructor(options) {
    super("Crossbow");

    this.cursed = options?.cursed;

    this.baseMeetingName = "Get Revenge";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return true;

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            this.item.drop();

            var cursed = this.item.cursed;

            if (cursed) {
                let action = new Action({
                  actor: this.actor,
                  target: this.target,
                  game: this.game,
                  labels: ["reveal"],
                  run: function () {
                    if (this.dominates()) this.target.role.revealToAll();
                  },
                });
                action.do();
                return;
              }

            if (this.dominates())
              this.target.kill("condemnRevenge", this.actor);
          },
        },
      },
    };
    this.stateMods = {
        Day: {
          type: "delayActions",
          delayActions: true,
        },
        Overturn: {
          type: "delayActions",
          delayActions: true,
        },
        Sunset: {
          type: "add",
          index: 5,
          length: 1000 * 30,
          shouldSkip: function () {
            for (let action of this.game.actions[0])
              if (action.target == this.player && action.hasLabel("condemn"))
                return false;
  
            return true;
          },
        },
      };
  }

  get snoopName() {
    if (this.mafiaImmune) {
      return "Gun (Gunrunner)";
    } else if (this.magicBullet) {
      return "Gun (Dwarf)";
    } else if (this.cursed) {
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
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
