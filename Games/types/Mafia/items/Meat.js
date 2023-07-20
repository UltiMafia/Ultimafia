const Item = require("../Item");

module.exports = class Meat extends Item {

    constructor(options) {
        super("Meat");

        this.cursed = options?.cursed;
    }


}