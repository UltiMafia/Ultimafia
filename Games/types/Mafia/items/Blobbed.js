const { MEETING_PRIORITY_BLOB } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class Blobbed extends Item {
  constructor(meetingName) {
    super("Blobbed");

    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[meetingName] = {
      meetingName: "Blob",
      actionName: "End Blob Meeting?",
      states: ["Night","Day","Dusk","Dawn"],
      speakDead: true,
      flags: ["group", "speech", "anonymous", "MustAct"],
      priority: MEETING_PRIORITY_BLOB,
      canVote: true,
      displayOptions: {
        disableShowDoesNotVote: true,
      },
      whileDead: true,
    };


    this.listeners = {
      revival: function (player, reviver, revivalType) {
        if(player == this.holder){
          this.drop();
        }
      },
    };


  }


  shouldDisableMeeting(name) {
    if (name == "Graveyard") {
      return true;
    }

    if (name == "Village") {
      return true;
    }

    return false;
  }



};
