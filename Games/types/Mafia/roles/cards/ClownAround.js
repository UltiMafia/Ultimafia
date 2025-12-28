const Card = require("../../Card");
const { MAFIA_FACTIONS } = require("../../const/FactionList");
const Random = require("../../../../../lib/Random");

module.exports = class ClownAround extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        meetingName: "Clown Around",
        states: ["Night"],
        flags: ["voting", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          run: function () {},
        },
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.clownCondemned = false;

        this.player.queueAlert(
          ":anon: You have come to this paltry village to die. Send in the Clowns."
        );

        this.game.queueAlert(
          `A friend of the Mafia has arrived to put on a great comedy for the dimwitted villagers. Time for one last joke.`,
          0,
          this.game.players.filter(
            (p) => p.getRoleAlignment() === "Mafia" && p != this.player
          )
        );
      },
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "condemn") {
          this.clownCondemned = true;
        }
        if (player == this.player && deathType != "condemn") {
          var aliveTargets = this.game.players.filter(
            (p) => p.alive && p != this.player
          );
          var mafiaTargets = aliveTargets.filter(
            (p) =>
              p.role.alignment != "Independent" &&
              MAFIA_FACTIONS.includes(p.faction)
          );
          if (mafiaTargets.length <= 0) return;
          const randomTarget = Random.randArrayVal(mafiaTargets);
          randomTarget.setRole(
            `${this.player.role.name}:${this.player.role.modifier}`,
            this.player.role.data
          );
          this.clownCondemned = true;
        }
      },
      handleWinBlockers: function (winners) {
        if (!this.hasAbility(["Win-Con", "OnlyWhenAlive"])) {
          return;
        }
        if (this.player.alive) {
          for (let x = 0; x < MAFIA_FACTIONS.length; x++) {
            if (winners.groups[MAFIA_FACTIONS[x]]) {
              winners.removeGroup(MAFIA_FACTIONS[x]);
            }
          }
        }
      },
    };
  }
};
