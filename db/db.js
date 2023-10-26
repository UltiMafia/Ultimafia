const mongoose = require("mongoose");

module.exports = {
  promise: new Promise(async (resolve, reject) => {
    mongoose.set("useCreateIndex", true);
    await mongoose.connect(
      `mongodb://mongodb:27017/${process.env.MONGO_DB}?authSource=admin`,
      {
        user: 'admin',
        pass: 'password',
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    );

    resolve(mongoose.connection);
  }),
  conn: mongoose.connection,
};
