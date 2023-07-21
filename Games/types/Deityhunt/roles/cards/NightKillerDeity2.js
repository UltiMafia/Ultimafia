const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightKillerDeity2 extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Deity Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"]},
        action: {
          labels: ["kill", "deity"],
          priority: PRIORITY_KILL_DEFAULT-1,
          run: function () {
            if (this.dominates()){
              this.target.kill("basic", this.actor);
              }
            this.actor.role.data.previousTarget = [this.target];
            }
          },
        },
        "Deity Kill 2": {
          actionName: "Kill",
          states: ["Night"],
          flags: ["voting"],
          targets: {include: ["alive"]},
          action: {
            labels: ["kill", "deity"],
            priority: PRIORITY_KILL_DEFAULT,
            shouldMeet: function () {
              return (this.data.previousTarget.length == 1 && this.data.previousTarget[0] == "No one");
            },
            run: function () {
              if (this.dominates()){
                this.target.kill("basic", this.actor);
                }
              this.actor.role.data.previousTarget.push(this.target);
              }
            },
          },
          "Deity Kill 3": {
            actionName: "Kill",
            states: ["Night"],
            flags: ["voting"],
            targets: {include: ["alive"]},
            action: {
              labels: ["kill", "deity"],
              priority: PRIORITY_KILL_DEFAULT,
              run: function () {
                if (this.dominates()){
                  this.target.kill("basic", this.actor);
                  }
                this.actor.role.data.previousTarget.push(this.target);
                }
              },
            },
      };
    }
  };
