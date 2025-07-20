const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnGoodAndEvilRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Dowse: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;

            let info = this.game.createInformation(
              "GoodOrEvilRoleInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);

            /*
            var role = this.target.getRoleAppearance();
            var role2;
            var alignment = this.game.getRoleAlignment(
              this.target.getRoleAppearance().split(" (")[0]
            );

            let roles = this.game.PossibleRoles.filter((r) => r);
            let goodRoles = roles.filter(
              (r) =>
                this.game.getRoleAlignment(r) == "Village" ||
                this.game.getRoleAlignment(r) == "Independent"
            );
            let evilRoles = roles.filter(
              (r) =>
                this.game.getRoleAlignment(r) == "Mafia" ||
                this.game.getRoleAlignment(r) == "Cult"
            );

            evilRoles = Random.randomizeArray(evilRoles).map((r) =>
              this.game.formatRole(r)
            );
            goodRoles = Random.randomizeArray(goodRoles).map((r) =>
              this.game.formatRole(r)
            );

            var alive = this.game.players.filter((p) => p != this.actor);
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

            if (this.actor.hasEffect("FalseMode")) {
              evilRoles = evilRoles.filter(
                (p) => p != this.target.getRoleAppearance()
              );
              goodRoles = goodRoles.filter(
                (p) => p != this.target.getRoleAppearance()
              );
              if (alignment == "Mafia" || alignment == "Cult") {
                role = Random.randArrayVal(evilRoles);
              } else {
                role = Random.randArrayVal(goodRoles);
              }
            }

            if (alignment == "Mafia" || alignment == "Cult") {
              role2 = Random.randArrayVal(goodRoles);
            } else {
              role2 = Random.randArrayVal(evilRoles);
            }

            let chosen = Random.randomizeArray([role, role2]);

            var alert = `:invest: You learn that ${this.target.name}'s role is ${chosen[0]} or ${chosen[1]}.`;
            this.actor.queueAlert(alert);
            */
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
