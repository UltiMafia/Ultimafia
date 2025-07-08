const Card = require("../../Card");
const { MEETING_PRIORITY_BLOB } = require("../../const/MeetingPriority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightBlobber extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.queueAlert(
          "The villagers had no idea that the shooting star seen last night had crashed to earth and released a viscous slime. You must consume."
        );

        this.data.meetingName = "Gel with " + this.player.name;
        this.meetings[this.data.meetingName] = this.meetings["BlobPlaceholder"];
        delete this.meetings["BlobPlaceholder"];
      },
      state: function () {
        if (this.game.getStateName() != "Day") return;

        const cleanedPlayer = this.cleanedPlayer;
        if (!cleanedPlayer) return;
        const lastCleanedAppearance = this.player.role.lastCleanedAppearance;
        if (!lastCleanedAppearance) return;

        if (!cleanedPlayer.alive) {
          this.player.queueAlert(
            `:mop: You discover ${cleanedPlayer.name}'s role is ${lastCleanedAppearance}.`
          );
        }

        cleanedPlayer.role.appearance.death = lastCleanedAppearance;
        cleanedPlayer.lastWill = this.player.role.lastCleanedWill;
        this.player.role.lastCleanedAppearance = null;
      },
      death: function (player, killer, deathType) {
        if (player === this.player) {
          for (let person of this.game.players) {
            if (
              person.hasItem("Blobbed") &&
              !person.alive &&
              person.role != "Blob"
            ) {
              person.revive("regurgitate", this.actor);
            }
          }
        }
      },
    };

    this.meetings = {
      Absorb: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            if (!this.dominates()) return;

            const roleName = this.target.getRoleAppearance("death");
            this.actor.role.lastCleanedAppearance = roleName;
            this.target.role.appearance.death = null;
            this.actor.role.lastCleanedWill = this.target.lastWill;
            this.target.lastWill = null;

            this.actor.role.cleanedPlayer = this.target;

            this.target.kill("basic", this.actor);
            this.target.holdItem("Blobbed", this.actor.role.data.meetingName);
            if(this.actor.role.BlobKills == null){
              this.actor.role.BlobKills = 0;
            }
            this.actor.role.BlobKills += 1;
            if(this.actor.role.BlobKills % 2 == 0){
             this.actor.giveEffect("ExtraLife", this.actor); 
            }
          },
        },
      },
      BlobPlaceholder: {
        meetingName: "Blob",
        actionName: "End Blob Meeting?",
        states: ["Night", "Day", "Dusk", "Dawn"],
        flags: ["group", "speech", "anonymous", "mustAct", "noVeg"],
        inputType: "boolean",
        speakDead: true,
        priority: MEETING_PRIORITY_BLOB,
        shouldMeet: function () {
          for (let player of this.game.players)
            if (
              player.hasItemProp(
                "Blobbed",
                "meetingName",
                this.data.meetingName
              )
            ) {
              return true;
            }

          return false;
        },
      },
    };
  }
};
