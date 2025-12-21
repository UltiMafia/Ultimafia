const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillIfNoDayKills extends Card {
  constructor(role) {
    super(role);

    role.banishedDied = true;
    role.game.ExorciseVillageMeeting = true;

    this.meetings = {
      Kill: {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        whileDead: true,
        whileAlive: true,
        shouldMeet: function () {
          return this.banishedDied == false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          role: this.role,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
            this.role.banishedDied = false;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.banishedDied = false;
          return;
        }
      },
      death: function (player, killer, deathType) {
        if (this.game.getStateName() == "Night") return;
        this.banishedDied = true;
        this.player.queueAlert(
          `A Player has died today, You can not kill tonight.`
        );
      },
      roleAssigned: function (player) {
        if (player !== this.player) return;
        this.banishedDied = true;
      },
    };
  }
};
