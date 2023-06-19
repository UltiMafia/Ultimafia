const Card = require("../../Card");

module.exports = class AnonymizeMafia extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Mafia: {
        flags: ["group", "speech", "voting", "multiActor", "anonymous"],
        targets: { include: ["alive"], exclude: [] },
      },
    };

    this.role.makeAnonymous = true;
    this.role.toRevertAnonymous = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Mafia"]) {
            player.role.oblivious["Mafia"] = true;
            this.toRevertAnonymous.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling anonymity
          if (p.role.makeAnonymous) {
            return;
          }
        }

        for (let r of this.toRevertAnonymous) {
          r.oblivious["Mafia"] = false;
        }
      },
    };
  }
};
