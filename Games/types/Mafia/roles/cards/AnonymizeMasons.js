const Card = require("../../Card");

module.exports = class AnonymizeMasons extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Masons: {
        flags: ["group", "speech", "voting", "multiActor", "anonymous", "MustAct"],
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
          if (p.role.makeAnonymous) {
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
