const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class NaughtyOrNice extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Check List": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run() {
            const visitors = this.getVisitors();
            if (visitors.length > 0) {
              return;
            }

            const role = this.target.getAppearance("investigate", true);
            const alignment = this.game.getRoleAlignment(role);
            let naughtyOrNice;
            switch (alignment) {
              case "Village":
                naughtyOrNice = "nice";
                break;
              case "Mafia":
              case "Monsters":
                naughtyOrNice = "naughty";
                break;
              default:
                naughtyOrNice = "neither naughty nor nice";
                break;
            }
            const alert = `:sy0d: You learn that ${this.target.name} is ${naughtyOrNice}!`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};
