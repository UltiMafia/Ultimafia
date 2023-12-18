const Card = require("../../Card");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");

module.exports = class BecomeDeadRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Become Role": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: [""] },
        action: {
          priority: PRIORITY_BECOME_DEAD_ROLE,
          run: function () {
            let oldRoleName = this.actor.role.name;
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data
            );
            if (oldRoleName === "Amnesiac") {
              this.game.queueAlert(
                `:tomb: The Amnesiac remembered that they were ${addArticle(this.target.role.name)}!`
              );
          }
          },
        },
      },
    };
  }
};
