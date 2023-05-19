const Item = require("../Item");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../const/Priority");


module.exports = class Doll extends Item {

    constructor(options) {
        super("Doll");
        
        this.meetings = {
            "Pass On Doll": {
                actionName: "Pass on the doll?",
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["giveItem", "doll", "absolute"],
                    priority: PRIORITY_ITEM_GIVER_DEFAULT,
                    item: this,
                    run: function () {
                        this.item.drop();
                        this.target.holdItem("Doll");
                        this.queueGetItemAlert("Doll", this.target);
                    }
                }
            }
        }
    }
    
    


}