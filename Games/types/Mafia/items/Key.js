const Item = require("../Item");
const { PRIORITY_DAY_DEFAULT } = require("../const/Priority");

module.exports = class Key extends Item {
  constructor(options) {
    super("Key");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Lock yourself in?": {
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "boolean",
        item: this,
        action: {
          labels: ["block"],
          priority: PRIORITY_DAY_DEFAULT,
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.item.holder.holdItem("Lock", {
                broken: this.item.broken,
                magicCult: this.item.magicCult,
              });
              this.item.drop();
            }
          },
        },
      },
    };
  }
};
