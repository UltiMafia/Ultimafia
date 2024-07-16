const mongoose = require("mongoose");
const schemas = require("./schemas");
const models = {};

for (let name in schemas) {
  models[name] = mongoose.model(name, schemas[name]);
}

module.exports = Object.freeze(models);
