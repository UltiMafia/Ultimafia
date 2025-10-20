const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillAndCreateUndead extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: this.role,
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            if (this.dominates()) {
              if (this.target.role.alignment == "Cult") {
                let players = this.game.alivePlayers();
                var indexOfTarget = players.indexOf(this.target);
                var rightIdx;
                var leftIdx;
                var leftAlign;
                var rightAlign;
                var distance = 0;
                var foundUp = 0;
                var foundDown = 0;

                for (let x = 0; x < players.length; x++) {
                  leftIdx =
                    (indexOfTarget - distance - 1 + players.length) %
                    players.length;
                  rightIdx = (indexOfTarget + distance + 1) % players.length;
                  leftAlign = players[leftIdx].role.alignment;
                  rightAlign = players[rightIdx].role.alignment;

                  if (rightAlign == "Village" && foundUp == 0) {
                    foundUp = players[rightIdx];
                  }
                  if (leftAlign == "Village" && foundDown == 0) {
                    foundDown = players[leftIdx];
                  }
                  if (foundUp == 0 || foundDown == 0) {
                    distance = x;
                  } else {
                    break;
                  }
                }

                let victims = [foundUp, foundDown];
                var villageTarget = Random.randArrayVal(victims);
                this.role.giveEffect(villageTarget,
                  "Delirious",
                  this.actor,
                  Infinity,
                  null,
                  this.role
                );

                this.target.setRole(
                  `${this.target.role.name}:Transcendent`,
                  this.target.role.data
                );
              } //End Cult check
              this.target.kill("basic", this.actor);
            } //End kill
          },
        },
      },
    };
  }
};
