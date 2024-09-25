const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class ActWhileDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
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

            for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
              if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
                return true;
              }
            }

            return true;
          } else {
            if (meetingName == "Graveyard") {
              return false;
            } else {
              for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
                if (
                  meetingName == IMPORTANT_MEETINGS_NIGHT[w] ||
                  !meetingName
                ) {
                  return true;
                }
              }

              for (let w = 0; w < INVITED_MEETINGS.length; w++) {
                if (meetingName == INVITED_MEETINGS[w]) {
                  return true;
                }
              }

              for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
                if (
                  meetingName &&
                  meetingName.startsWith(STARTS_WITH_MEETINGS[w])
                ) {
                  return true;
                }
              }

              for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
                if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
                  return true;
                }
              }

              return false;
            }
          }
        },

        whileDead: function (meetingName) {
          // core meetings
          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
              return true;
            }
          }

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

          // meetings invited by others
          return true;
        },
        WhileAlive: function (meetingName) {
          // core meetings

          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
              return true;
            }
          }

          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return true;
            }
          }

          for (let w = 0; w < INVITED_MEETINGS.length; w++) {
            if (meetingName == INVITED_MEETINGS[w]) {
              return true;
            }
          }

          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meetingName &&
              meetingName.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return true;
            }
          }

          if (meetingName == "Graveyard") return false;

          // meetings invited by others
          return false;
        },
      },
    };
  }
};
