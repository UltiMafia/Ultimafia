const Item = require("../Item");
const { PRIORITY_REDIRECT_ACTION } = require("../const/Priority");

module.exports = class PuppetStrings extends Item {
  constructor(meetingName, puppeteedPlayer) {
    super("PuppetStrings");

    this.meetingName = meetingName;
    this.puppeteedPlayer = puppeteedPlayer;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings[meetingName] = {
      actionName: this.meetingName,
      states: ["Night"],
      flags: ["voting"],
      item: this,
      targets: { include: ["alive", "dead"], exclude: [] },
      action: {
        item: this,
        priority: PRIORITY_REDIRECT_ACTION,
        labels: ["redirect", "hidden"],
        run: function () {
          this.redirectAllActions(this.item.puppeteedPlayer, this.target);
        },
      },
    };
  }
};
