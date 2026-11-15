const mongoose = require("mongoose");

module.exports = {
  promise: new Promise(async (resolve, reject) => {
    console.log(
      "connecting to mongo: ",
      process.env.MONGO_URL,
      process.env.MONGO_DB
    );
    // Every mocha --parallel worker is a long-lived process that mocha recycles
    // between files, so all workers used to share one `${MONGO_DB}_test`
    // database. Test files that wipe it (deleteMany({}), dropDatabase()) then
    // deleted other workers' fixtures mid-run, which is invisible in the log
    // because the victim fails later and elsewhere. Give each worker its own
    // database; MOCHA_WORKER_ID is set by mocha for worker processes and is
    // absent in a serial run.
    const workerId = process.env.MOCHA_WORKER_ID;
    const workerSuffix =
      workerId === undefined || workerId === "" ? "" : `_w${workerId}`;
    const dbName = process.env.NODE_ENV === "test"
      ? `${process.env.MONGO_DB}_test${workerSuffix}`
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
