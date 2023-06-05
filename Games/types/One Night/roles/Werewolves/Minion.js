const Role = require("../../Role");

module.exports = class Minion extends Role {
  constructor(player, data) {
    super("Minion", player, data);

    this.alignment = "Werewolves";
    this.cards = ["VillageCore", "WinWithMinions"];
    this.actions = [
      {
        priority: -100,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let player of this.game.players)
            if (player.role.name == "Werewolf")
              this.actor.queueAlert(`${player.name} is a Werewolf.`);
        },
      },
    ];
  }
};
