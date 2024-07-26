const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class PermaMindRot extends Item {
  constructor(lifespan) {
    super("PermaMindRot");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["hidden", "block"],
          run: function () {
            //if (this.dominates()) this.target.giveEffect("MindRot", this.actor);

            let actionCount = false;
            for (let action of this.game.actions[0]) {
              if (
                action.actor === this.target &&
                !action.hasLabel("investigate")
              ) {
                //action.cancelActor(target);
                this.blockActions(this.target);
              } else if (
                action.actor === this.target &&
                action.hasLabel("investigate")
              ) {
                actionCount = true;
              }
            }

            if (actionCount) {
              let visits = this.getVisits(this.target);

              let alive = this.game.alivePlayers();

              var evilPlayers = alive.filter(
                (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
              );
              var goodPlayers = alive.filter(
                (p) => p.role.alignment != "Mafia" && p.role.alignment != "Cult"
              );

              if (visits.length == 0) {
                //let neighbors = this.target.getAliveNeighbors();
                let index = alive.indexOf(this.target);
                const leftIdx = (index - 1 + alive.length) % alive.length;
                const rightIdx = (index + 1) % alive.length;
                let neighbors = [alive[leftIdx], alive[rightIdx]];

                let neighborTarget = Random.randArrayVal(neighbors);
                if (
                  neighborTarget.role.alignment == "Village" &&
                  this.actor.role.alignment != "Village"
                ) {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    this.actor.role.name
                  );
                } else if (neighborTarget.role.alignment != "Village") {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    Random.randArrayVal(goodPlayers).role.name
                  );
                } else {
                  neighborTarget.setTempAppearance(
                    "investigate",
                    Random.randArrayVal(evilPlayers).role.name
                  );
                }
              } else {
                for (let visit of visits) {
                  if (
                    visit.role.alignment == "Village" &&
                    this.actor.role.alignment != "Village"
                  ) {
                    visit.setTempAppearance(
                      "investigate",
                      this.actor.role.name
                    );
                  } else if (visit.role.alignment != "Village") {
                    visit.setTempAppearance(
                      "investigate",
                      Random.randArrayVal(goodPlayers).role.name
                    );
                  } else {
                    visit.setTempAppearance(
                      "investigate",
                      Random.randArrayVal(evilPlayers).role.name
                    );
                  }
                }
              }
            }
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
