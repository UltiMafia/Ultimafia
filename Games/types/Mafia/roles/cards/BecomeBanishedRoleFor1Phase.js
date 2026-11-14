const Card = require("../../Card");
const {
  roleEquals,
  roleModifiers,
  roleKey,
} = require("../../../../../lib/roleIdentity");
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
            // Meeting compares candidates with roleKey, so store canonical
            // identities rather than display choices or raw descriptors.
            if(roleModifiers(this.role).split("/").includes("Fair")){
              this.role.data.roleBlacklist2 =
                this.role.data.roleSelectedEver.map((r) => roleKey(r));
            }
            else if(roleModifiers(this.role).split("/").includes("Nonconsecutive")){
              this.role.data.roleBlacklist2 =
                this.role.data.roleSelectedLastNight.map((r) => roleKey(r));
            }
            else if(roleModifiers(this.role).split("/").includes("Consecutive")){
              let allRole = this.role.getAllRoles();
              allRole = allRole.filter((r) => !roleEquals(r, this.target));
              this.role.data.roleBlacklist2 = allRole.map((r) => roleKey(r));
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
