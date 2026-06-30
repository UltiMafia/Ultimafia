const mongoose = require("mongoose");

module.exports = {
  promise: new Promise(async (resolve, reject) => {
    console.log(
      "connecting to mongo: ",
      process.env.MONGO_URL,
      process.env.MONGO_DB
    );
    const dbName = process.env.NODE_ENV === "test"
      ? `${process.env.MONGO_DB}_test`
      : process.env.MONGO_DB;
    console.log("Using MongoDB database:", dbName);
    await mongoose.connect(
      `mongodb://${process.env.MONGO_URL}/${dbName}?authSource=admin`,
      {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PW,
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    );

    resolve(mongoose.connection);
  }),
  conn: mongoose.connection,
};
