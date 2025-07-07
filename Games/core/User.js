const dbStats = require("../../db/stats");

module.exports = class User {
  constructor(props) {
    this.id = props.id;
    this.socket = props.socket;
    this.name = props.name;
    this.avatar = props.avatar;
    this.dev = props.dev;
    this.textColor = props.settings && props.settings.textColor;
    this.nameColor = props.settings && props.settings.nameColor;
    this.customEmotes = props.settings && props.settings.customEmotes;
    this.birthday = props.birthday;
    this.Protips = props.settings && props.settings.disableProTips;
    this.rankedCount = props.rankedCount;
    this.competitiveCount = props.competitiveCount;
    this.stats = props.stats || dbStats.allStats();
    this.achievements = props.achievements || [];
    this.availableStamps = props.availableStamps || [];
    this.ownedStamps = props.ownedStamps || [];
    this.dailyChallenges = props.dailyChallenges.map((m) => m.split(":")) || [];
    this.playedGame = props.playedGame;
    this.referrer = props.referrer;
    this.guestId = props.guestId;
    this.settings = props.settings;
    this.isTest = props.isTest;
  }

  send(eventName, data) {
    this.socket.send(eventName, data);
  }

  disconnect() {
    this.socket.terminate();
  }
};
