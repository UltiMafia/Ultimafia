const Card = require("../../Card");
const Action = require("../../Action");
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
          run: function () {
            if (this.target == "No") return;

            var originalActor = this.actor;

            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["kill", "mafia"]) &&
                action.dominates(action.target, false) &&
                action.target.alive
              ) {
                stealIdentity.bind(originalActor.role)(action.target);
                action.target = originalActor;
                break;
              }
            }
          },
        },
      },
    };

    this.passiveActions = [
      {
        ability: ["OnlyWhenAlive"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_IDENTITY_STEALER_BLOCK,
        run: function () {
            var stealing = false;
            var killing = false;

            for (let action of this.game.actions[0]) {
              if (action.hasLabel("stealIdentity") && action.target == "Yes")
                stealing = true;
              else if (action.hasLabels(["kill", "mafia"])) killing = true;
            }

            if (stealing && killing)
              for (let action of this.game.actions[0])
                if (action.target == this.actor) action.cancel(true);
          },
      },
    ];
    
    this.listeners = {
      death: function (player, killer, deathType) {
        let swappedPlayers = this.game
          .alivePlayers()
          .filter((p) => p.user.swapped);
        if (swappedPlayers.length <= 0) {
          this.game.resetIdentities();
        }
      },
    };
  }
};

function stealIdentity(target) {
  if (!this.game.swaps) this.game.swaps = [];

  if (!this.data.originalUser) this.data.originalUser = this.player.user;
  if (!this.data.originalPlayer) this.data.originalPlayer = this.player;
  //let temp = this.player.faction;
  target.queueAlert(":anon: Someone has stolen your identity!");
  //this.player.faction = target.faction;
  //target.faction = temp;
  this.game.swaps.unshift([this.player, target]);
  this.player.swapIdentity(target);
  this.data.originalUser.swapped = target.user;
}
