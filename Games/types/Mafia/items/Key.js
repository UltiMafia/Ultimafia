const Item = require("../Item");
const { PRIORITY_DAY_DEFAULT } = require("../const/Priority");

module.exports = class Key extends Item {
  constructor() {
    super("Key");

    this.meetings = {
      "Lock yourself in?": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["block"],
          priority: PRIORITY_DAY_DEFAULT,
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.item.holder.holdItem("Lock");
              this.item.drop();
            }
          },
        },
      },
    };
  }
};
