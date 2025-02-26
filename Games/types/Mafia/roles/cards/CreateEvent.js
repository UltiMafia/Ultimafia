const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);
    //const targetOptions = this.game.PossibleRoles.filter((r) => r);
    this.meetings = {
      "Select Event": {
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "custom",
        //targets: { targetOptions },
        action: {
          labels: ["convert", "role"],
          run: function () {
            let eventMods = this.target.split(":")[1];
            let eventName = this.target.split(":")[0];
            let event = this.game.createGameEvent(eventName, eventMods);
            event.doEvent();
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.game.CurrentEvents.filter((r) => r);
        for (let event of this.game.BanishedEvents.filter((r) => r)) {
          this.data.ConvertOptions.push(event);
        }
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        this.data.ConvertOptions = this.game.CurrentEvents.filter((r) => r);
        for (let event of this.game.BanishedEvents.filter((r) => r)) {
          this.data.ConvertOptions.push(event);
        }
        if (this.data.ConvertOptions.length <= 0) {
          this.data.ConvertOptions.push(this.game.GameEndEvent);
        }
        var ConvertOptions = this.data.ConvertOptions;

        this.meetings["Select Event"].targets = ConvertOptions;
      },
    };
  }
};
