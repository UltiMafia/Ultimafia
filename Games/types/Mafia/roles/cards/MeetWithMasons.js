const Card = require("../../Card");
const Action = require("../../Action");
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
            let action = new Action({
                  actor: this.actor,
                  target: this.target,
                  role: this.role,
                  game: this.game,
                  labels: ["kill"],
                  run: function () {
                    if (this.dominates()) {
                    }
                  },
                });

            if (
              this.target.getRoleAlignment() == "Mafia" ||
              this.target.isDemonic() ||
              (this.target.role.name == "Serial Killer" && this.role.canDoSpecialInteractions())
            ) {
              for(let actor of this.game.players.filter((p) => p.getRoleName() == "Freemason")){
                if(action.dominates(actor)){
                  actor.kill("basic", this.target);
                }
              }
              return;
            }

            if (((this.target.role.name == "Cult Leader" || this.target.role.name == "Cultist") && this.role.canDoSpecialInteractions())) {
              if(action.dominates(this.target)){
                this.target.kill("basic", this.actor);
              }
              return;
            }

            if(this.target.getRoleAlignment() == "Cult"){
              return;
            }

            if (this.dominates()) {
              this.target.setRole("Freemason");
            }
          },
        },
      },
    };
  }
};
