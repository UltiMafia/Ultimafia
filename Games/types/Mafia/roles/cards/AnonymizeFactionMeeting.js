const Card = require("../../Card");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class AnonymizeFactionMeeting extends Card {
  constructor(role) {
    super(role);

    for (let faction of FACTION_WITH_MEETING) {
      this.meetingMods[`${faction} Meeting`] = {
        flags: [
          "group", "speech","noVeg",
          "anonymous",
        ],
      };
      this.meetingMods[`${faction} Action`] = {
        flags: [
          "group", "voting", "mustAct", "noVeg", "Important",
          "anonymous",
        ],
      };
      this.meetingMods[`${faction} Kill`] = {
        flags: [
          "group",
          "voting",
          "multiActor",
          "anonymous",
          "Important",
        ],
        targets: { include: ["alive"], exclude: [] },
      };
    }

    role.makeAnonymousFaction = true;
    role.toRevertAnonymousFaction = [];

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Faction"]) {
            player.role.oblivious["Faction"] = true;
            this.toRevertAnonymousFaction.push(player.role);
          }
        }
      },
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Faction"]) {
            player.role.oblivious["Faction"] = true;
            this.toRevertAnonymousFaction.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling anonymity
          if (p.role.makeAnonymousFaction) {
            return;
          }
        }

        for (let r of this.toRevertAnonymousFaction) {
          r.oblivious["Faction"] = false;
        }
      },
    };
  }
};
