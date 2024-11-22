const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class RoleSharing extends Item {
  constructor(lifespan, roleShare, alignmentShare, privateShare, publicShare) {
    super("RoleSharing");

    //this.magicCult = options?.magicCult;
    //this.broken = options?.broken;
    this.canRoleShare = roleShare;
    this.canAlignmentShare = alignmentShare;
    this.canPrivateReveal = privateShare;
    this.canPublicReveal = privateShare;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Choose Share Method": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "custom",
      },
      "Share With Target": {
        states: ["Day"],
        flags: ["voting"],
      },
    };


    this.listeners = {
      /*
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.fullFungusList = [
          "Thrush",
          "Aspergillus",
          "Cataracts",
          "Hallucinogens",
        ];
        let cooldown = this.data.fullFungusList.length;
        this.data.fungusCooldown = cooldown;

      
        this.data.fungusCounter = fungusCounter;

        this.data.currentFungus = null;
        this.data.currentTarget = null;
      },
      */
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        this.data.hasSharedWith = [];
        var currentFungusList = this.shareTypes.filter((h));

        this.meetings["Choose Share Method"].targets = currentFungusList;
      },
      vote: function (vote) {
        if (
          (vote.meeting.name === "Choose Share Method") &&
          vote.voter === this.player
        ) {
          this.data.currentShareMethod = vote.target;
        }
        else if((vote.meeting.name === "Share With Target") &&
          vote.voter === this.player && vote.target){
          if(this.data.hasSharedWith.includes(vote.target)) return;
          this.data.hasSharedWith.push(vote.target);
          if(this.data.currentShareMethod == "Role Share" || this.data.currentShareMethod == "Alignment Share"){
          let ShareWith = vote.target.holdItem("RoleShareAccept", this.actor,this.data.currentShareMethod);
          this.game.instantMeeting(ShareWith.meetings, [vote.target]);
          }
          else if(this.data.currentShareMethod == "Private Reveal"){
             this.player.role.revealToPlayer(vote.target);
          }
          else if(this.data.currentShareMethod == "Public Reveal"){
             this.player.role.revealToAll();
          }
          
          }
      },
    };


    
  }
};

  hold(player) {
    this.shareTypes = [
          "None",
        ];

    if(this.canRoleShare == true){
      this.shareTypes.push("Role Share");
    }
    if( this.canAlignmentShare == true){
      this.shareTypes.push("Alignment Share");
    }
    if(this.canPrivateReveal == true){
      this.shareTypes.push("Private Reveal");
    }
    if(this.canPublicReveal == true){
      this.shareTypes.push("Public Reveal");
    }
    

    super.hold(player);
    this.data.currentShareMethod = null;
  }
};
