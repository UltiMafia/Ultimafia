const dbStats = require("../../db/stats");
const dateOnly = require("../../lib/dateOnly");

module.exports = class User {
  constructor(props) {
    this.id = props.id;
    this.socket = props.socket;
    this.name = props.name;
    this.avatar = props.avatar;
    this.deathSound = props.deathSound;
    this.deathSoundExt = props.deathSoundExt || "ogg";
    this.dev = props.dev;
    this.textColor = props.settings && props.settings.textColor;
    this.nameColor = props.settings && props.settings.nameColor;
    this.nameFont = props.settings && props.settings.nameFont;
    this.animatedNameColor =
      props.settings && props.settings.animatedNameColor;
    this.nameGradientColorA =
      props.settings && props.settings.nameGradientColorA;
    this.nameGradientColorB =
      props.settings && props.settings.nameGradientColorB;
    this.nameGradientColorC =
      props.settings && props.settings.nameGradientColorC;
    this.customEmotes = props.settings && props.settings.customEmotes;
    this.birthday = dateOnly.normalizeBirthday(props.birthday);
    this.Protips = props.settings && props.settings.disableProTips;
    this.rankedCount = props.rankedCount;
    this.competitiveCount = props.competitiveCount;
    this.stats = props.stats || dbStats.allStats();
    dbStats.normalizeUserStats(this.stats);
    this.initialStats = JSON.parse(JSON.stringify(this.stats));
    this.achievements = props.achievements || [];
    if (props.dailyChallenges) {
      this.dailyChallenges =
        props.dailyChallenges.map((m) => m.split(":")) || [];
    } else {
      this.dailyChallenges = [];
    }
    this.playedGame = props.playedGame;
    this.referrer = props.referrer;
    this.guestId = props.guestId;
    this.settings = props.settings;
    this.isTest = props.isTest;
    this.vanityUrl = props.vanityUrl;
  }

  send(eventName, data) {
    this.socket.send(eventName, data);
  }

  disconnect() {
    this.socket.terminate();
  }
};
