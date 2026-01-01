const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class ActAfterCondemned extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.HasBeenCondemned = false;
      },
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }
        if (deathType != "condemn"){
          return;
        }
        this.HasBeenCondemned = true;
      },
      revival: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }
        if (!this.player.alive) {
          return;
        }
        this.HasBeenCondemned = false;
      },
    };

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

            for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
              if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
                return true;
              }
            }

            if (this.player.role.HasBeenCondemned == true) {
              return true;
            } else {
              return false;
            }
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

        whileDeadMod: function (meetingName) {
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
          if (this.player.role.HasBeenCondemned == true) {
            return true;
          } else {
            return false;
          }
        },
        WhileAliveMod: function (meetingName) {
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
