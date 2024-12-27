const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class ActAliveOrDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        shouldMeetDeadMod: function (meetingName) {
          if (!this.player.alive) {
            for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
              if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
                return false;
              }
            }

            for (let w = 0; w < INVITED_MEETINGS.length; w++) {
              if (meetingName == INVITED_MEETINGS[w]) {
                return false;
              }
            }

            for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
              if (
                meetingName &&
                meetingName.startsWith(STARTS_WITH_MEETINGS[w])
              ) {
                return false;
              }
            }

            /*
            if (
              meetingName &&
              (meetingName == "Party!" ||
                meetingName == "Hot Springs" ||
                meetingName == "Banquet" ||
                meetingName.startsWith("Jail with") ||
                meetingName.startsWith("Seance with"))
            ) {
              return false;
            */
            return true;
          } else {
            if (meetingName == "Graveyard") {
              return false;
            } else {
              return true;
            }
          }
        },

        whileDeadMod: function (meetingName) {
          // core meetings

          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w]) {
              return false;
            }
          }

          for (let w = 0; w < INVITED_MEETINGS.length; w++) {
            if (meetingName == INVITED_MEETINGS[w]) {
              return false;
            }
          }

          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (meetingName.startsWith(STARTS_WITH_MEETINGS[w])) {
              return false;
            }
          }

          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
              return false;
            }
          }

          return true;
        },

        /* old code if mine breaks something lol

        shouldMeet: function (meetingName) {
          if (!this.player.alive) {
            if (
              meetingName == "Village" ||
              meetingName == "Mafia" ||
              meetingName == "Cult"
            ) {
              return false;
            }

            if (
              meetingName == "Party!" ||
              meetingName == "Hot Springs" ||
              meetingName == "Banquet" ||
              meetingName.startsWith("Jail with") ||
              meetingName.startsWith("Seance with")
            ) {
              return false;
            } else {
              return true;
            }
          } else {
            if (meetingName == "Graveyard") {
              return false;
            } else {
              return true;
            }
          }
        },

        whileDead: function (meetingName) {
          // core meetings
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Cult"
          )
            return false;

          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Hot Springs" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return false;
          } else return true;
        },
        whileAlive: function (meetingName) {
          if (meetingName == "Graveyard") {
            return false;
          } else return true;
        },
        */
      },
    };
  }
};
