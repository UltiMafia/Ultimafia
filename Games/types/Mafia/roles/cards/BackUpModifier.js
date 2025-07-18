const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class BackUpModifier extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        for (let item of this.player.items) {
          item.drop();
        }

        //this.player.holdItem("Retirement", this.player.role.name);

        let newRole = "Sidekick";
        let currRole = this.player.role.name;

        if (this.player.role.alignment == "Village") {
          newRole = "Student";
        } else if (this.player.role.alignment == "Mafia") {
          newRole = "Understudy";
        } else if (this.player.role.alignment == "Cult") {
          newRole = "Devotee";
        }
        
        this.player.queueAlert(
          `Backup: You are the Backup for ${currRole}. If a ${currRole} is killed you will gain your abilities.`
        );

        this.data.RoleTargetBackup = this.name;
        
           this.BackUpEffect = this.player.giveEffect(
              "BackUp",
              this.name
            );
            this.player.passiveEffects.push(this.BackUpEffect);
        


        
      if(newRole == "Sidekick"){
        this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
        this.player.role.data.FromBackUpModifier = currRole;
        this.player.role.data.OldRole = currRole;
      }
      },
      roleAssigned: function (player) {
        if(player != this.player){
          return;
        }
        if(this.data.RoleTargetBackup != null){
          return;
        }

        let newRole = "Sidekick";
        let currRole = this.player.role.name;

        if (this.player.role.alignment == "Village") {
          newRole = "Student";
        } else if (this.player.role.alignment == "Mafia") {
          newRole = "Understudy";
        } else if (this.player.role.alignment == "Cult") {
          newRole = "Devotee";
        }
        
        this.player.queueAlert(
          `Backup: You are the Backup for ${currRole}. If a ${currRole} is killed you will gain your abilities.`
        );

        this.data.RoleTargetBackup = this.name;
        
           this.BackUpEffect = this.player.giveEffect(
              "BackUp",
              this.name
            );
            this.player.passiveEffects.push(this.BackUpEffect);
        


        
      if(newRole == "Sidekick"){
        this.player.setRole(
          newRole,
          undefined,
          false,
          true,
          false,
          "No Change"
        );
        this.player.role.data.FromBackUpModifier = currRole;
        this.player.role.data.OldRole = currRole;
      }

      },
    };


    this.meetingMods = {
      "*": {
        shouldMeetMod: function (meetingName) {
          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return true;
            }
          }
          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w] || !meetingName) {
              return true;
            }
          }
          if (meetingName == "Graveyard") return true;

          return !this.player.hasEffect("BackUp");
        },
      },
    };



    
  }
};
