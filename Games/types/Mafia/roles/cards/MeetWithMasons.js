const Card = require("../../Card");
const {
  PRIORITY_MASON_CONVERT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class MeetWithMasons extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Masons: {
        actionName: "Convert",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Mason"] },
        action: {
          labels: ["convert", "mason"],
          priority: PRIORITY_MASON_CONVERT,
          run: function () {
            if (this.target.role.name == "Cultist" || this.target.role.name == "Cthulhu") {
              this.actor.role.masonKills = [this.target];
              this.actor.role.masonKiller = this.actor;
              return;
            }

            if (this.target.role.alignment == "Mafia" || this.target.role == "Serial Killer") {
              this.actor.role.masonKills = this.actors;
              this.actor.role.masonKiller = this.target;
              return;
            }

            if (this.dominates()) {
              this.target.setRole("Freemason");
            }
          },
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT + 1,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let targets = this.actor.role.masonKills;
          if (!targets) {
            return;
          }

          for (let t of targets) {
            if (this.dominates(t)) {
              t.kill("basic", this.actor.role.masonKiller);
            }
          }

          delete this.actor.role.masonKill;
          delete this.actor.role.masonKiller;
        },
      },
    ];
  }
};
