const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
} = require("../../const/ImportantMeetings");

function isCoreNightMeeting(meetingName) {
  if (!meetingName) {
    return true;
  }
  if (IMPORTANT_MEETINGS_NIGHT.includes(meetingName)) {
    return true;
  }
  if (meetingName === "Graveyard") {
    return true;
  }
  if (
    meetingName.includes("X-Shot Night") ||
    meetingName.includes("X-Shot Day")
  ) {
    return true;
  }
  for (const invited of INVITED_MEETINGS) {
    if (meetingName === invited) {
      return true;
    }
  }
  for (const prefix of STARTS_WITH_MEETINGS) {
    if (meetingName.startsWith(prefix)) {
      return true;
    }
  }
  if (
    meetingName.endsWith(" Meeting") ||
    meetingName.endsWith(" Action") ||
    meetingName.endsWith(" Kill")
  ) {
    return true;
  }
  return false;
}

function hasPersonalNightMeeting(role) {
  return Object.entries(role.meetings).some(
    ([meetingName, meeting]) =>
      meeting.states?.some(
        (state) => state === "Night" || /Night/.test(state)
      ) && !isCoreNightMeeting(meetingName)
  );
}

module.exports = class Humble extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };
  }

  init() {
    const hasNightMeeting = hasPersonalNightMeeting(this.role);

    let appearance;
    if (hasNightMeeting) {
      if (this.role.alignment === "Village") {
        appearance = "Visitor";
      } else if (this.role.alignment === "Mafia") {
        appearance = "Trespasser";
      } else if (this.role.alignment === "Cult") {
        appearance = "Bogeyman";
      } else if (this.role.alignment === "Independent") {
        appearance = "Fool";
      }

      if (appearance) {
        this.appearance = {
          self: appearance,
          reveal: appearance,
        };

        this.meetingMods = {
          "*": {
            actionName: "Visit",
          },
          "Mafia Kill": {
            actionName: "Mafia Kill",
          },
          Village: {
            actionName: "Vote to Condemn",
          },
        };

        if (this.role.alignment === "Independent") {
          this.meetingMods["*"] = {
            actionName: "Fool Around",
          };
        }
      }
    } else {
      if (
        this.role.alignment === "Village" ||
        this.role.winCount === "Village"
      ) {
        appearance = "Villager";
      } else if (this.role.alignment === "Mafia") {
        appearance = "Mafioso";
      } else if (this.role.alignment === "Cult") {
        appearance = "Cultist";
      } else if (this.role.alignment === "Independent") {
        appearance = "Grouch";
      }

      if (appearance) {
        this.appearance = {
          self: appearance,
          reveal: appearance,
        };
      }
    }

    Card.prototype.init.call(this);
  }
};
