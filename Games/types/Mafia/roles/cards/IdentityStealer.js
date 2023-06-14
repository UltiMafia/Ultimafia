const Card = require("../../Card");
const {
  PRIORITY_IDENTITY_STEALER,
  PRIORITY_IDENTITY_STEALER_BLOCK,
} = require("../../const/Priority");

module.exports = class IdentityStealer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal Identity": {
        actionName: "Disguise as Target?",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["stealIdentity"],
          priority: PRIORITY_IDENTITY_STEALER,
          run() {
            if (this.target == "No") return;

            const originalActor = this.actor;

            for (const action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"]) && action.dominates()) {
                stealIdentity.bind(originalActor.role)(action.target);
                action.target = originalActor;
                break;
              }
            }
          },
        },
      },
    };
    this.actions = [
      {
        priority: PRIORITY_IDENTITY_STEALER_BLOCK,
        run() {
          if (this.game.getStateName() != "Night") return;

          let stealing = false;
          let killing = false;

          for (const action of this.game.actions[0]) {
            if (action.hasLabel("stealIdentity") && action.target == "Yes")
              stealing = true;
            else if (action.hasLabels(["kill", "mafia"])) killing = true;
          }

          if (stealing && killing)
            for (const action of this.game.actions[0])
              if (action.target == this.actor) action.cancel(true);
        },
      },
    ];
    this.listeners = {
      death(player, killer, deathType) {
        if (player == this.player) resetIdentities.bind(this)();
      },
      aboutToFinish() {
        resetIdentities.bind(this)();
      },
    };
  }
};

function stealIdentity(target) {
  if (!this.data.swaps) this.data.swaps = [];

  if (!this.data.originalUser) this.data.originalUser = this.player.user;

  this.player.queueAlert(":sy5g: Someone has stolen your identity!");
  this.data.swaps.unshift([this.player, target]);
  this.player.swapIdentity(target);
  this.data.originalUser.swapped = target.user;
}

function resetIdentities() {
  if (!this.data.swaps) return;

  for (const swap of this.data.swaps) {
    swap[0].swapIdentity(swap[1]);
    delete swap[1].swapped;
  }

  delete this.data.swaps;
  delete this.data.originalUser.swapped;
}
