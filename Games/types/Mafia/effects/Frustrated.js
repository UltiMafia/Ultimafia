const Effect = require("../Effect");
const Action = require("../Action");

// Players with 0 votes, "no one" ("*"), and "*magus" are not in the set.
// F dies only when F is in that set, someone else is too, and F is strictly
// below every other member (a tie for lowest does not kill).
function isFrustratedLowest(count, playerId) {
  if (count == null || playerId == null) return false;

  const selfId = String(playerId);
  let selfVotes = null;
  const others = [];

  for (const target in count) {
    if (target === "*" || target === "*magus") continue;

    const votes = count[target];
    if (typeof votes !== "number" || !(votes > 0)) continue;

    if (target === selfId) selfVotes = votes;
    else others.push(votes);
  }

  if (selfVotes == null || others.length === 0) return false;

  for (let i = 0; i < others.length; i++) {
    if (!(selfVotes < others[i])) return false;
  }

  return true;
}

function isVillageCondemn(action) {
  if (!action || action.hasLabel == null) return false;
  if (!action.hasLabel("condemn") || action.hasLabel("overthrow")) {
    return false;
  }
  if (
    action.meeting &&
    action.meeting.name &&
    action.meeting.name !== "Village"
  ) {
    return false;
  }
  return true;
}

function actionTargetId(action) {
  const target = action.target;
  if (target && target.id != null) return target.id;
  return target;
}

module.exports = class Frustrated extends Effect {
  constructor(lifespan) {
    super("Frustrated");
    this.lifespan = lifespan || Infinity;
    this.immunity["condemn"] = 3;

    this.listeners = {
      PostVotingPowers: function (meeting, count, highest) {
        if (!meeting || meeting.name !== "Village") return;
        if (!this.player || !this.player.alive) return;

        const dies = isFrustratedLowest(count, this.player.id);
        const targets = highest && highest.targets;
        const isCondemnTarget =
          targets &&
          targets.length === 1 &&
          String(targets[0]) === String(this.player.id);

        if (!dies && !isCondemnTarget) return;

        const playerId = this.player.id;
        // Power 4 beats this effect's own condemn immunity of 3.
        // The condemn label hits Unkillable's cancelImmunity.condemn,
        // so the death goes through. Cancelling a Village condemn aimed
        // at this player stops that same cancel-immunity from letting a
        // majority vote kill an Unkillable Frustrated player.
        const action = new Action({
          actor: this.player,
          target: this.player,
          game: this.game,
          labels: dies
            ? ["kill", "condemn", "frustration", "hidden"]
            : ["hidden"],
          power: 4,
          run: function () {
            const queued = this.game.actions[0];
            if (queued) {
              for (let other of queued) {
                if (other === this || !isVillageCondemn(other)) continue;

                const targetsThis =
                  String(actionTargetId(other)) === String(playerId);
                if (dies || targetsThis) {
                  other.cancel(true);
                  break;
                }
              }
            }

            if (!dies) return;

            this.game.sendAlert(
              `${this.target.name} feels immensely frustrated!`
            );
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

module.exports.isFrustratedLowest = isFrustratedLowest;
