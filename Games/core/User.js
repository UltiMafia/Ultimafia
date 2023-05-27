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
        this.birthday = props.birthday;
        this.rankedCount = props.rankedCount;
        this.stats = props.stats || dbStats.allStats();
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

}