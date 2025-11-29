const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class KillorCharge extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],

        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          role: this.role,
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            if (this.role.revived) {
              return;
            }
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },

      "Charge Kill": {
        actionName: "Charge",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.revived;
        },
        action: {
          role: this.role,
          labels: ["charge"],
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            if (this.target == "No") return;
            this.role.revived = true;
          },
        },
      },

      "Kill 3 Players": {
        actionName: "Kill 3 Players",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["self"] },
        multiMin: 2,
        multiMax: 3,
        shouldMeet: function () {
          return this.revived;
        },
        action: {
          labels: ["kill", "Uncharge"],
          role: this.role,
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            this.role.revived = false;
            for (let x = 0; x < this.target.length; x++) {
              if (this.dominates(this.target[x]))
                this.target[x].kill("basic", this.actor);
            }
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        //let playerNames = this.game.alivePlayers().map((p) => p.name);
        //playerNames.push("Charge Kill");

        //this.meetings["Kill"].targets = playerNames;
      },
    };
  }
};
