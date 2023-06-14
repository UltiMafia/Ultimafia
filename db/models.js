const mongoose = require("mongoose");
const schemas = require("./schemas");

const models = {};

for (const name in schemas) {
  models[name] = mongoose.model(name, schemas[name]);
}

module.exports = models;
