const Item = require("../Item");

module.exports = class Microphone extends Item {

    constructor() {
        super("Microphone");

        this.meetings = {
            "Give Clue": {
                actionName: "Give Clue (1-50)",
                states: ["Give Clue"],
                flags: ["voting"],
                inputType: "text",
                textOptions: {
                    minLength: 1,
                    maxLength: 50,
                    submit: "Confirm"
                },
                action: {
                    item: this,
                    run: function() {
                        this.game.recordClue(this.actor, this.target);
                        this.game.sendAlert(`${this.actor.name}: ${this.target}`);
                        this.item.drop();
                    }
                }
            }
        }
    }

    hold(player) {
        super.hold(player);
        player.game.queueAlert(`${player.name} is giving a clue...`);
    }

};