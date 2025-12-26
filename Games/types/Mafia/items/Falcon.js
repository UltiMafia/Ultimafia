const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Falcon extends Item {
  constructor(options) {
    super("Falcon");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Track with Falcon": {
        states: ["Night"],
        flags: ["voting", "noVeg"],
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            let info = this.game.createInformation(
              "trackerInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfoItem(this.item);
            this.actor.queueAlert(`:track: ${info.getInfoFormated()}`);
            this.item.drop();
          },
        },
      },
    };
  }
};
