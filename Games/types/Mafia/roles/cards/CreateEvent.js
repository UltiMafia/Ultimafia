const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");
module.exports = class CreateEvent extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Event": {
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: ["None"],
        //targets: { targetOptions },
        action: {
          labels: ["event"],
          run: function () {
            if(this.target == "None"){
              return;
            }
            let eventMods = this.target.split(":")[1];
            let eventName = this.target.split(":")[0];
            let event = this.game.createGameEvent(eventName, eventMods);
            event.doEvent();
          },
        },
        shouldMeet: function () {
          if (this.name != "Host") {
            return true;
          }
          if (this.getEvents().length > 1) {
            return true;
          }
          return false;
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.getEvents();
        var ConvertOptions = this.data.ConvertOptions;
        if (this.meetings["Select Event"]) {
          if (!this.meetings["Select Event"].mustAct) {
            ConvertOptions.push("None");
          }
          this.meetings["Select Event"].targets = ConvertOptions;
        }
      },
      // refresh cooldown
      /*
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        this.data.ConvertOptions = this.getEvents();
        var ConvertOptions = this.data.ConvertOptions;
        if (this.meetings["Select Event"]) {
          if (!this.meetings["Select Event"].mustAct) {
            ConvertOptions.push("None");
          }

          this.meetings["Select Event"].targets = ConvertOptions;
        }
      },
      */
      playerHasJoinedMeetings: function (player) {
        if(player != this.player){
          return;
        }
        this.data.ConvertOptions = this.getEvents();
        var ConvertOptions = this.data.ConvertOptions;
        this.player.getMeetings().forEach((meeting) => {
          if(meeting.name.includes("Select Event")){
            if(!meeting.mustAct){
              ConvertOptions.push("None");
            }

            meeting.targets = ConvertOptions;
          }
        });
      },
    };
  }
};
