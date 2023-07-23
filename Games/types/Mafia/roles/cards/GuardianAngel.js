const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class GuardianAngel extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const alivePlayers = this.game.players.filter(p => p.alive && p != this.player);
        this.angelTarget = Random.randArrayVal(alivePlayers);
        this.player.queueAlert(
          `You must protect ${this.angelTarget.name} with your life.`
        );
      },
    };

    this.meetings = {
      Guardian: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.protectedTarget;
        },
        action: {
          labels: ["guardian", "hidden", "absolute"],
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            this.protectedTarget = true;
            this.redirectAllActionsOnTarget(this.actor.role.angelTarget, this.actor, "kill");
          },
        },
      },
    };
  }
};
