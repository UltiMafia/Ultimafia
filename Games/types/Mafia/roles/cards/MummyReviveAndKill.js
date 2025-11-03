const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class MummyReviveAndKill extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Revive: {
        actionName: "Revive",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        whileDead: true,
        whileAlive: false,
        shouldMeet: function () {
          return !this.stoned && this.HasBeenCondemned;
        },
        action: {
          role: this.role,
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 2,
          run: function () {
            if (this.target === "No") return;

            this.role.stoned = true;

            this.actor.revive("basic", this.actor);

            for (let player of this.game.alivePlayers()) {
              for (let effect of player.effects) {
                if (
                  effect.name == "Marked" &&
                  effect.SourceRole &&
                  effect.SourceRole.includes(this.role.name)
                ) {
                  effect.remove();
                  if (this.dominates(player)) {
                    player.kill("basic", this.actor);
                  }
                }
              }
            }

          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.HasBeenCondemned = false;
      },
      death: function (player, killer, deathType, instant) {
        if (player != this.player || deathType != "condemn") {
          return;
        }
        this.HasBeenCondemned = true;
      },
    };
  }
};
