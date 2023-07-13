const luni = require("lunicode");
function bent(inputString) {
    return luni.tools.bent.encode(inputString);
}

function creepify(inputString) {
    luni.tools.creepify.options.maxHeight = 2;
    return luni.tools.creepify.encode(bent(inputString));
}

module.exports = {
    creepify
}