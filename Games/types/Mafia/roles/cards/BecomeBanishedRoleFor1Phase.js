const Card = require("../../Card");
const roleBlacklist = ["Hermit", "Jack", "Consigliere", "Sidhe", "Oddfather"];

module.exports = class BecomeBanishedRoleFor1Phase extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Use Power": {
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "AllRoles",
        AllRolesFilters: ["banished", "blacklist", "aligned"],
        role: role,
        action: {
          role: this.role,
          run: function () {
            if (this.target == "None") {
              return;
            }
            this.role.data.roleSelectedLastNight.push(this.target);
            this.role.data.roleSelectedEver.push(this.target);
            //this.actor.role.data.ConvertOptions.splice(this.actor.role.data.ConvertOptions.indexOf(this.target),1);
            if(this.role.modifier.split("/").includes("Fair")){
              this.role.data.roleBlacklist2 = this.role.data.roleSelectedEver;
            }
            else if(this.role.modifier.split("/").includes("Nonconsecutive")){
              this.role.data.roleBlacklist2 = this.role.data.roleSelectedLastNight;
            }
            else if(this.role.modifier.split("/").includes("Consecutive")){
              let allRole = this.role.getAllRoles();
              allRole = allRole.filter((r) => r != this.target);
              this.role.data.roleBlacklist2 = allRole;
            }
            //this.role.data.roleBlacklist2.push(this.target);

            let effect = this.actor.giveEffect(
              "ExtraRoleEffect",
              this.target,
              1,
              null,
              "Yes"
            );
            this.actor.joinMeetings(effect.ExtraRole.meetings);
            for (let meeting of this.game.meetings) {
              meeting.generateTargets();
            }
            this.actor.sendMeetings();
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        if (this.data.roleBlacklist == null) {
          this.data.roleBlacklist = roleBlacklist.filter((r) => r);
          this.data.roleBlacklist2 = [];
          this.data.roleSelectedLastNight = [];
            this.data.roleSelectedEver = [];
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
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          this.data.LimitedLastNightVisits = [];
          this.data.LimitedAllVisits = [];
          return;
        }
       this.data.roleSelectedLastNight = [];
      },
    };
  }
};
