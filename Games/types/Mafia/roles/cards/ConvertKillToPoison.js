const Card = require("../../Card");

module.exports = class ConvertKillToPoison extends Card {

    constructor(role) {
        super(role);

        this.immunity.kill = 1;
        this.cancelImmunity = ['poison'];

        this.listeners = {
            "immune": function(action) {
                if (action.target === this.player &&
                    action.hasLabel("kill") &&
                    !this.holder.tempImmunity["kill"]) {
                        
                    // check for effect immunity
                    for (let effect of this.player.effects)
                        if (effect.immunity["kill"])
                            return;

                    // check for saves
                    for (let action of this.game.actions[0]) {
                        if (action.target === this.player && action.hasLabel("save")) {
                            return;
                        }
                    }
                    action.target.queueAlert("You've been hit! You start bleeding...");
                    action.target.giveEffect("Poison", action.actor);
                }
            }
        }
    }

}