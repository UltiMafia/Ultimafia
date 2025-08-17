const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class Necronomicon extends Item {
  constructor() {
    super("Necronomicon");

    this.cannotBeStolen = true;
    this.meetings = {
      Necronomicon: {
        states: ["Night"],
        actionName: "Necronomicon Kill",
        flags: ["voting", "mustAct"],
        targets: { include: ["alive", "self"] },
        item: this,
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          item: this,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (this.game.Necronomicon != "Demonic") return;
        var aliveRoles = this.game
          .alivePlayers()
          .filter((p) => p.isDemonic(true));
        if (aliveRoles.length > 0) {
          return;
        }

        if (
          this.holder.hasItem("IsTheTelevangelist") ||
          this.holder.role.name == "Televangelist"
        ) {
          return;
        }

        var devotion = this.game.players.filter(
          (p) => p.hasEffect("DevotionEffect")
        );
        if (devotion.length > 0) {
          var backUpTarget = devotion.filter((p) => p.hasEffect("DevoteeEffect"));
          if (backUpTarget.length > 0) {
            backUpTarget;
            this.drop();
            this.hold(backUpTarget);
            return;
          }
          this.game.events.emit("Devotion", this.holder);
          return;
        }
        //this.game.queueAlert(`We Got here ${aliveRoles.length}`);
        for (let p of this.game.alivePlayers()) {
          if (CULT_FACTIONS.includes(p.faction)) {
            p.kill("basic", this.holder, instant);
          }
        }
      },
      NecroDrop: function () {
        this.drop();
      },
    };
  }

  hold(player) {
    for (let person of player.game.players.filter(
      (p) =>
        p.role.alignment != "Independent" && CULT_FACTIONS.includes(p.faction)
    )) {
      if (player.game.Necronomicon == "Demonic") {
        person.queueAlert(
          `${player.name} is Holding the Necronomicon (Demonic), If they die Cult dies!`
        );
      } else {
        person.queueAlert(`${player.name} is Holding the Necronomicon!`);
      }
    }

    super.hold(player);
  }
};
