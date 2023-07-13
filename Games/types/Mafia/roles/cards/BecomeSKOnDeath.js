const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

function assignKiller(that) {
  const killers = that.game.players.filter(
    (e) => e.role.name === "Serial Killer" && e.alive
  );
  const alreadyAssignedKillers = that.game.players
    .filter((e) => e.role.data.assignedKiller && e.alive)
    .map((e) => e.role.data.assignedKiller);
  const candidateKillers = killers.filter(
    (e) => !alreadyAssignedKillers.includes(e)
  );
  const assignedKiller =
    candidateKillers.length > 0 ? Random.randArrayVal(candidateKillers) : null;

  if (assignedKiller) {
    that.data.assignedKiller = assignedKiller;
    that.player.queueAlert(`You are fascinated by ${assignedKiller.name}.`);
  }
}

module.exports = class BecomeSKOnDeath extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      investigate: "Villager",
    };

    this.listeners = {
      start: function () {
        assignKiller(this);
      },
      death: function (player, killer, deathType, instant) {
        if (
          !this.data.assignedKiller &&
          (player.role.name === "Serial Killer" ||
            player.role.name === "Admirer")
        ) {
          assignKiller(this);
        }
        if (player === this.data.assignedKiller) {
          this.player.queueAlert(
            `You take on ${this.data.assignedKiller.name}'s legacy...`
          );
          this.player.setRole("Serial Killer");
        }
      },
    };
  }
};
