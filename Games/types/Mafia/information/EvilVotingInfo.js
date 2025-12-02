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
    var count = {};
    var highest = { targets: [], votes: 1 };
    var finalTarget;
    for (let voterId in meeting.votes) {
      let member = meeting.members[voterId];
      let target = meeting.votes[voterId] || "*";

      if (!target) continue;

      // Workaround for being unable to properly exclude self from group meetings
      if (isExcludeSelf && voterId === target) continue;

      if (!count[target]) count[target] = 0;
      count[target] += 1;
      totalVoteCount += 1;
    }
    // Determine target with the most votes (ignores zero votes)
    for (let target in count) {
      if (count[target] > highest.votes)
        highest = { targets: [target], votes: count[target] };
      else if (count[target] == highest.votes) highest.targets.push(target);
    }
    if (highest.targets.length == 1) {
      for (let voterId in meeting.votes) {
        let member = meeting.members[voterId];
        let target = meeting.votes[voterId] || "*";
        if (!target) continue;
        if (target == highest.targets[0]) {
          if (this.isAppearanceEvil(member.player)) {
            evilCount++;
          }
          if (this.isEvil(member.player)) {
            trueEvilCount++;
          }
        }
      }
      if (trueEvilCount > 0) {
        this.trueInfo = "Yes";
      } else {
        this.trueInfo = "No";
      }

      if (evilCount > 0) {
        this.mainInfo = "Yes";
      } else {
        this.mainInfo = "No";
      }
    } else {
      this.mainInfo = "No majority vote";
    }
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    if (this.mainInfo == "No majority vote") {
      return `:invest: Their was no majority yesterday!`;
    }
    if (this.mainInfo == "Yes") {
      return `:invest: You ran the numbers... the forces of Evil did vote with the majority yesterday!`;
    } else {
      return `:invest: You ran the numbers... the forces of Evil did NOT vote with the Majority yesterday!`;
    }
    //return `You learn that ${this.target.name} is ${this.mainInfo}`;
  }
  getInfoSpecial() {
    return `${this.target.name} is ${this.mainInfo}`;
  }

  isTrue() {
    if (this.mainInfo == "No majority vote") {
      return true;
    }
    if (this.mainInfo == this.trueInfo) {
      return true;
    }

    return false;
  }
  isFalse() {
    if (this.mainInfo == "No majority vote") {
      return true;
    }
    if (this.isTrue()) {
      return false;
    } else {
      return true;
    }
  }
  isFavorable() {
    if (this.mainInfo == "No majority vote") {
      return true;
    }
    if (this.mainInfo != "No") {
      return false;
    } else {
      return true;
    }
  }
  isUnfavorable() {
    if (this.mainInfo == "No majority vote") {
      return true;
    }
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
