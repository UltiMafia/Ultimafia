const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnGoodAndEvilRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Role": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;
            var role = this.target.getRoleAppearance();
            var role2;
            var alignment = this.game.getRoleAlignment(
              this.target.getRoleAppearance().split(" (")[0]
            );

            var alive = this.game.players.filter(
              (p) => p.alive && p != this.actor
            );
            var goodPlayers = alive.filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Village" ||
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Independent"
            );

            var evilPlayers = alive.filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Cult" ||
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Mafia"
            );

            if(this.actor.hasEffect("FalseMode")){
              evilPlayers = evilPlayers.filter((p) => p != this.target);
              goodPlayers = goodPlayers.filter((p) => p != this.target);
              if (alignment == "Mafia" || alignment == "Cult") {
              role = Random.randArrayVal(evilPlayers).getRoleAppearance();
            } else {
              role = Random.randArrayVal(goodPlayers).getRoleAppearance();
            }
            }

            if (alignment == "Mafia" || alignment == "Cult") {
              role2 = Random.randArrayVal(goodPlayers).getRoleAppearance();
            } else {
              role2 = Random.randArrayVal(evilPlayers).getRoleAppearance();
            }

            let chosen = Random.randomizeArray([role, role2]);

            var alert = `:invest: You learn that ${this.target.name}'s role is ${chosen[0]} or ${chosen[1]}.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
