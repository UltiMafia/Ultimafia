const Item = require("../Item");
const Random = require("../../../../lib/Random");
const items = require("../../../../data/items");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../const/Priority");

module.exports = class SecretGifting extends Item {
  constructor(player) {
    super("SecretGifting");
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.PlayerTarget = player;
    let meetingName = "Give Gift to "+player.name
    let itemTargets = Object.entries(items.Mafia)
                .filter((roleData) => roleData[1].tag.includes("Common"))
                .map((roleData) => roleData[0]);

    this.meetings[meetingName] = {
      actionName: "Give Gift to "+player.name,
      states: ["Night"],
      flags: ["voting"],
      inputType: "custom",
        targets: itemTargets,
      item: this,
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          item: this,
          run: function () {
            let itemType = this.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.item.PlayerTarget.holdItem(this.target);
            this.item.PlayerTarget.queueGetItemAlert(this.target);
            delete this.role.data.itemType;
            this.item.drop();
          },
        },
    };
  }
};
