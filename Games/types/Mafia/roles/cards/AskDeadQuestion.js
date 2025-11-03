const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_DAY_DEFAULT,
  PRIORITY_INVESTIGATIVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class AskDeadQuestion extends Card {
  constructor(role) {
    super(role);

    // here, mourner decides the question to ask
    this.meetings = {
      "Ask Question": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          submit: "Ask",
        },
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            this.actor.role.data.question = this.target;
            this.actor.role.data.meetingName =
              'Answer Mourner asking "' + this.actor.role.data.question + '"';
            this.actor.role.mournerYes = 0;
            this.actor.role.mournerNo = 0;
            if (!this.actor.role.data.question) {
              return;
            }
            for (let player of this.game.players) {
              if (!player.alive) {
                player.holdItem("Mourned", {
                  mourner: this.actor,
                  question: this.actor.role.data.question,
                  meetingName: this.actor.role.data.meetingName,
                });
              }
            }
          },
        },
      },
    };

      this.passiveActions = [
      {
        ability: ["Information"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT + 1,
        labels: ["investigate"],
        role: role,
        run: function () {
          if (!this.actor.role.data.question) {
              return;
            }

            let info = this.game.createInformation(
              "MournerInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            var alert = `${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
        },
      },
    ];
  }
};
