const Item = require("../Item");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class Cat extends Item {
  constructor(owner) {
    super("Cat");
    this.owner = owner;
    this.lifespan = 1;

    this.meetings = {
      "Permit Cat": {
        actionName: "Do you let the cat in?",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["investigate", "role", "block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
          item: this,
          actor: this.owner,
          run() {
            if (!this.actor.alive) {
              return;
            }

            if (this.target == "Yes") {
              this.blockActions(this.item.holder);
            } else {
              const role = this.item.holder.getAppearance("investigate", true);
              if (this.item.owner.alive) {
                this.item.owner.queueAlert(
                  `You learn that ${this.item.holder.name}'s role is ${role}.`
                );
              }
            }
            this.item.drop();
          },
        },
      },
    };
  }
};
