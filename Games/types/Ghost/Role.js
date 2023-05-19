const Role = require("../../core/Role");

module.exports = class GhostRole extends Role {

    constructor(name, player, data) {
        super(name, player, data);
    }
}