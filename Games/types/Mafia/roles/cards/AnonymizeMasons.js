const Card = require("../../Card");

module.exports = class AnonymizeMasons extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Masons: {
        flags: ["group", "speech", "voting", "multiActor", "anonymous"],
        targets: { include: ["alive"], exclude: [] },
      },
    };

    role.makeAnonymousMason = true;
    role.toRevertAnonymous = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Freemason"]) {
            player.role.oblivious["Freemason"] = true;
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
          if (p.role.makeAnonymousMason) {
            return;
          }
        }

        for (let r of this.toRevertAnonymous) {
          r.oblivious["Freemason"] = false;
        }
      },
    };
  }
};
