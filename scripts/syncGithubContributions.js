const db = require("../db/db");
const githubContributions = require("../modules/githubContributions");

db.promise
  .then(() => githubContributions.syncContributions())
  .then((result) => {
    console.log("GitHub contributions synced", JSON.stringify(result));
    process.exit(0);
  })
  .catch((e) => {
    console.error("GitHub contribution sync failed:", e.message);
    process.exit(1);
  });
