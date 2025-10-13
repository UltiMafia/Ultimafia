const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class VotingMadness extends Effect {
  constructor(curser, target, lifespan) {
    super("VotingMadness");
    this.curser = curser;
    this.target = target;
    this.lifespan = lifespan;
    this.isMalicious = true;

    this.listeners = {
      meetingFinish: function (meeting) {
        if (!this.player.alive) {
          this.remove();
          return;
        }
        if (!this.target.alive) {
          this.remove();
          return;
        }
        let voteCount = 0;
        let memberCount = 0;

        if (meeting.name !== "Village") {
          return;
        }

        for (let member of meeting.members) {
          const player = member.player;
          if (!player.alive) {
            continue;
          }
          memberCount++;
          /*
          if (player.role.alignment != "Village") {
            continue;
          }
          */

          const vote = meeting.votes[player.id];
          if (vote == this.target.id) {
            // a villager did not vote for this role
            voteCount++;
          }
        }

        if (!(Math.floor((memberCount + 0.0) * 0.3) > voteCount)) {
          return;
        }

        let action = new Action({
          actor: this.curser,
          target: [this.player, this.target],
          game: this.game,
          labels: ["kill", "curse", "hidden"],
          effect: this,
          power: 1,
          run: function () {
            let players = this.game.alivePlayers();
            let AlignedPlayers = players.filter(
              (p) => p.faction == this.actor.faction
            );
            let nonAlignedPlayers = players.filter(
              (p) => p.faction != this.actor.faction
            );

            if (nonAlignedPlayers.length > AlignedPlayers.length + 2) {
              if (this.dominates(this.target[0]))
                this.target[0].kill("basic", this.actor);
              if (this.dominates(this.target[1]))
                this.target[1].kill("basic", this.actor);
              this.effect.remove();
              return;
            }

            if (Random.randInt(0, 1) == 0) {
              if (this.dominates(this.target[0]))
                this.target[0].kill("basic", this.target[0]);
              this.effect.remove();
              return;
            }
            if (this.dominates(this.target[1]))
              this.target[1].kill("basic", this.target[1]);
            this.effect.remove();
            return;
          },
        });
        action.do();
      },
    };
  }
};
