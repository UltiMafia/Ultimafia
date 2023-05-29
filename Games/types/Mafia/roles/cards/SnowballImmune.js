const Card = require("../../Card");

module.exports = class SnowballImmune extends Card {

    constructor(role) {
        super(role);

        this.immunity.throw = 1;
    }

}