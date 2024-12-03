const Item = require("../Item");
const {
  PRIORITY_KILL_DEFAULT,
  MEETING_PRIORITY_JAIL,
} = require("../const/Priority");

module.exports = class CaveIn extends Item {
  constructor() {
    super("CaveIn");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Caved In": {
        actionName: "Convert Player to Food",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct"],
        priority: MEETING_PRIORITY_JAIL,
        passiveDead: true,
        whileDead: true,
        speakDead: true,
        targets: { include: ["alive"], exclude: ["dead"] },
        action: {
          labels: ["kill", "hidden"],
          priority: PRIORITY_KILL_DEFAULT,
          power: 3,
          item: this,
          run: function () {
            if (this.dominates()) {
              if (!this.target.alive) {
                this.game.exorcisePlayer(this.target);
              }
              this.target.kill("basic", this.actor);
              for (let person of this.game.players) {
                if (person.alive && person.role.name !== "Turkey") {
                  person.holdItem("Food", "Fresh Meat");
                }
              }
            }
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        const state = this.game.getStateName();
        if (state == "Day" && this.hasBeenNight == true) {
          this.drop();
          return;
        }
        if (state != "Night") {
          return;
        }
        this.hasBeenNight = true;
        this.holder.queueAlert(
          `Event: Cave In, You all need something to eat!`
        );
      },
    };
  }

  shouldDisableMeeting(name) {
    // do not disable jailing, gov actions
    if (this.game.getStateName() != "Night") {
      return false;
    }
    /*
    if (this.holder.role.alignment == "Cult") {
      return false;
    }
    */

    return name !== "Caved In";
  }
};
