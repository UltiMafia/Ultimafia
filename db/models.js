var mongoose = require("mongoose");
var schemas = require("./schemas");
var models = {};

for (let name in schemas) {
  models[name] = mongoose.model(name, schemas[name]);
}
        
module.exports = models;
