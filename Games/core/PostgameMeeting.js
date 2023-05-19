const Meeting = require("./Meeting");

module.exports = class PostgameMeeting extends Meeting {

    constructor(game) {
        super(game, "Postgame");

        this.group = true;
        this.speech = true;
        this.speakDead = true;
    }

}