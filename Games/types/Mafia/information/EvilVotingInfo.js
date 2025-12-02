const Information = require("../Information");
const Random = require("../../../../lib/Random");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class EvilVotingInfo extends Information {
  constructor(creator, game, meeting) {
    super("Evil Voting Info", creator, game);
    let evilCount = 0;
    let trueEvilCount = 0;
    for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (this.isAppearanceEvil(member.player)) {
            evilCount++;
          }
          if(this.isEvil(member.player)){
            trueEvilCount++;
          }
        }
    if(trueEvilCount > 0){
      this.trueInfo = "Yes";
    }
    else{
      this.trueInfo = "No";
    }

    if(evilCount > 0){
      this.mainInfo = "Yes";
    }
    else{
     this.mainInfo = "No";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();

    return `Your investigation shows that ${this.target.name} is ${this.mainInfo}`;
  }
  getInfoSpecial() {
    return `${this.target.name} is ${this.mainInfo}`;
  }

  isTrue() {
      if (this.mainInfo == this.trueInfo) {
        return true;
      }
    
    return false;
  }
  isFalse() {
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo != "No") {
      return false;
    } else {
      return true;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "No") {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
      this.mainInfo = this.trueInfo;
  }
  makeFalse() {
    if (this.trueInfo == "Yes") {
      this.mainInfo = "No";
    } else {
      this.mainInfo = "Yes";
    }
  }
  makeFavorable() {
    this.mainInfo = "No";
  }
  makeUnfavorable() {
    this.mainInfo = "Yes";
  }
};
