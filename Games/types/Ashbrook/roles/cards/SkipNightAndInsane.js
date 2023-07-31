const Card = require("../../Card");

module.exports = class SkipNight extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Skip Night?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        whileDead: true,
        inputType: "boolean",
        shouldMeet: function () {
          return !this.player.role.data.hasSkipped && 
          (this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser")));
        },
        action: {
          run: function () {
            if (this.target === "No") return;
            
            this.actor.role.data.hasSkipped = true;

            if (this.isInsane()) return;
            
            this.actor.role.data.skipNight = true;
            this.game.queueAlert(
              "The Town will not be able to sleep tonight..."
            );
            for (let player in this.game.player){
              if (player.role.alignment != "Follower"
                && player.role.alignment != "Leader")
              player.giveEffect("Insanity", 2);
            }
          },
        },
      },
    };
    this.stateMods = {
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.player.role.data.skipNight) {
            return true;
          }
          return false;
        },
      },
    };
    this.listeners = {
      state: function (stateInfo){
        if (!stateInfo.name.match(/Night/)) return;

        if (this.player.role.data.skipNight) this.player.role.data.skipNight = false;
      }
    }
  }
};
