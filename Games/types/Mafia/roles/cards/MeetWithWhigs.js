const Card = require("../../Card");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class MeetWithWhigs extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Whigs: {
        actionName: "Convert to Whig",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor"],
        targets: { include: ["alive"], exclude: ["Whig"] },
        action: {
          labels: ["convert", "mason"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (
              this.target.role.name == "Freemason"
            ) {
              return;
            }

            if (
              this.target.role.alignment == "Cult"
            ) {
              this.actor.role.whigKills = [this.target];
              this.actor.role.whigKiller = this.actor;
              return;
            }

            if (
              this.target.role.alignment == "Mafia" ||
              this.target.role == "Serial Killer"
            ) {
              this.actor.role.whigKills = this.actors;
              this.actor.role.whigKiller = this.target;
              return;
            }

            if (this.dominates()) {
              this.target.setRole("Whig");
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

          let targets = this.actor.role.whigKills;
          if (!targets) {
            return;
          }

          for (let t of targets) {
            if (this.dominates(t)) {
              t.kill("basic", this.actor.role.whigKiller);
            }
          }

          delete this.actor.role.whigKills;
          delete this.actor.role.whigKiller;
        },
      },
    ];
  }
};
