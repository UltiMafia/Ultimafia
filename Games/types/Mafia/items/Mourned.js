const Item = require("../Item");
const { PRIORITY_MESSAGE_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Mourned extends Item {
  constructor(options) {
    super("Mourned");

    this.mourner = options.mourner;
    this.question = options.question;
    this.meetingName = options.meetingName;

    this.lifespan = 1;
    this.cannotBeStolen = true;

    this.meetings[this.meetingName] = {
      actionName: this.meetingName,
      states: ["Night"],
      flags: ["voting"],
      inputType: "alignment",
      targets: ["Yes", "No"],
      whileDead: true,
      whileAlive: false,
      action: {
        priority: PRIORITY_MESSAGE_GIVER_DEFAULT,
        item: this,
        run: function () {
          let mourner = this.item.mourner;
          if (this.target === "Yes") {
            mourner.role.data.mournerYes += 1;
          }
          if (this.target === "No") {
            mourner.role.data.mournerNo += 1;
          }
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (this.holder.alive) return;

        if (stateInfo.name.match(/Night/)) {
          this.holder.queueAlert(`A mourner asks you: ${this.question}`);
        }
      },
    };
  }
};
