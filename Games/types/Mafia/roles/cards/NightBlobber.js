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
            if (person.hasItem("Blobbed") && !person.alive && !person.role == "Blob") {
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
            if (this.dominates()) this.target.kill("basic", this.actor);
            this.actor.giveEffect("ExtraLife", this.actor);
            var blobTarget;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill"])) {
                blobTarget = action.target;
                break;
              }
            }
            if (!blobTarget) return;

            const roleName = blobTarget.getRoleAppearance("death");
            this.actor.role.lastCleanedAppearance = roleName;
            blobTarget.role.appearance.death = null;
            this.actor.role.lastCleanedWill = blobTarget.lastWill;
            blobTarget.lastWill = null;

            this.actor.role.cleanedPlayer = blobTarget;
          },
        },
      },
      BlobPlaceholder: {
        meetingName: "Blob",
        actionName: "End Blob Meeting?",
        states: ["Night"],
        flags: [
          "exclusive",
          "group",
          "speech",
          "anonymous",
          "voting",
          "mustAct",
          "noVeg",
        ],
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
