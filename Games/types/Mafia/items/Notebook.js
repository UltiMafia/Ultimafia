const Item = require("../Item");
const { PRIORITY_KILL_GUESS_ROLE } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class Notebook extends Item {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write Name": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "consume", "hidden", "absolute"],
          priority: PRIORITY_KILL_GUESS_ROLE,
          item: this,
          run: function () {
            if (this.actor.role.data.prey) {
              if (this.target.role.name === this.actor.role.data.prey) {
                if (this.dominates()) {
                  this.target.kill("basic", this.actor);
                  this.actor.role.data.immunity = true;
                  this.actor.queueAlert(
                    "The Notebook has claimed another victim. You are invulnerable for the day…."
                  );
                }
              } else {
                this.actor.role.kill("basic", this.actor);
              }
              delete this.actor.role.data.prey;
            }
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting", "mustAct", "noVeg"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          priority: PRIORITY_KILL_GUESS_ROLE - 1,
          item: this,
          run: function () {
            this.actor.role.data.prey = this.target;
          },
        },
      },
      "Pass On Notebook": {
        states: ["Day"],
        flags: ["voting", "mustAct"],
        action: {
          labels: ["giveItem", "notebook", "absolute"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          item: this,
          run: function () {
            this.item.drop();
            this.target.holdItem("Notebook");
            this.target.queueGetItemAlert("Notebook");
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (this.player.role.data.immunity) {
          this.player.setTempImmunity("kill", 3);
          this.player.setTempImmunity("condemn", 3);
          this.player.setTempImmunity("famine", 3);
          delete this.player.role.data.immunity;
        }
      },
    };
  }
};
