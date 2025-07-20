const Card = require("../../Card");
const roleBlacklist = ["Hermit", "Jack", "Consigliere", "Sidhe"];

module.exports = class BecomeBanishedRoleFor1Phase extends Card {
  constructor(role) {
    super(role);



    this.meetings = {
      "Use Power": {
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "AllRoles",
        AllRolesFilters: ["banished", "blacklist", "aligned"],
        action: {
          role: this.role,
          run: function () {
            if(this.target == "None"){
            return;
            }

            //this.actor.role.data.ConvertOptions.splice(this.actor.role.data.ConvertOptions.indexOf(this.target),1);
            this.actor.role.data.roleBlacklist2.push(this.target);

            let effect = this.actor.giveEffect("ExtraRoleEffect", this.target , 1, null, "Yes");
            this.actor.joinMeetings(effect.ExtraRole.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();


            /*
            let currRole = this.actor.role.name;
            let currModifiers = this.actor.role.modifier;
            let currData = this.actor.role.data;

            this.actor.holdItem(
              "ReturnToRole",
              currRole,
              currModifiers,
              currData,
              this.target
            );
            this.actor.setRole(
              `${this.target}`,
              null,
              true,
              true,
              false,
              "No Change"
            );

            this.actor.joinMeetings(this.actor.role.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();

            //this.actor.role.priorityOffset = -1;

            if (this.actor.role.name != currRole) {
              this.actor.role.name = currRole;
              this.actor.role.appearance.death = currRole;
              this.actor.role.appearance.reveal = currRole;
              this.actor.role.appearance.investigate = currRole;
              this.actor.role.appearance.condemn = currRole;
              this.actor.role.alignment = this.game.getRoleAlignment(currRole);
            }
            */
          },
        },
      },
    };
    

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        if(this.data.roleBlacklist == null){
        this.data.roleBlacklist = roleBlacklist.filter((r) => r);
        this.data.roleBlacklist2 = [];
        }
        /*
        this.data.ConvertOptions = this.game.PossibleRoles.filter(
          (r) =>
            this.game.getRoleAlignment(r) ==
            this.game.getRoleAlignment(this.player.role.name) && (r.split(":")[1] && r.split(":")[1].toLowerCase().includes("banished"))
        && !roleBlacklist.includes(r.split(":")[0])
        
        );
        */
      },
      // refresh cooldown
      /*
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var ConvertOptions = this.data.ConvertOptions.filter((r) => r);
        if(!this.modifier.includes("Proactive")){
        ConvertOptions.push("None");
        }

        this.meetings["Use Power"].targets = ConvertOptions;
      },
      */
    };

  }
};
