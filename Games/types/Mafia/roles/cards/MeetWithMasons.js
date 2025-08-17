const Card = require("../../Card");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class MeetWithMasons extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Masons: {
        actionName: "Induct",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Freemason"] },
        action: {
          role: this.role,
          labels: ["convert", "mason"],
          priority: PRIORITY_CONVERT_DEFAULT + 2,
          run: function () {
            if (this.target.role.alignment == "Cult") {
              this.role.masonKills = [this.target];
              this.role.masonKiller = this.actor;
              return;
            }

            if (
              this.target.role.alignment == "Mafia" ||
              this.target.role == "Serial Killer"
            ) {
              this.role.masonKills = this.actors;
              this.role.masonKiller = this.target;
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
        role: this.role,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let targets = this.role.masonKills;
          if (!targets) {
            return;
          }

          for (let t of targets) {
            if (this.dominates(t)) {
              t.kill("basic", this.role.masonKiller);
            }
          }

          delete this.role.masonKill;
          delete this.role.masonKiller;
        },
      },
    ];
  }
};
