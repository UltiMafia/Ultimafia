const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillIfOutcastKilledDuringDay extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Night Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"]},
        shouldMeet: function () {
          return this.player.data.enableKill && (this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser")));
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            this.actor.role.data.enableKill = false;
            if (this.isInsane()) return;

            if (this.dominates()){
              this.target.kill("basic", this.actor);
            }
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player) return;
        if (this.game.getStateName() !== "Day") return;
        if (player.role.alignment !== "Outcast") return;
        
        this.data.enableKill = true;
      },
    }
  }
};
