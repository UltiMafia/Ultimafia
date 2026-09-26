const { execFile } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const run = promisify(execFile);

describe("Mafia reviewed fix regressions", function () {
  this.timeout(15000);
  for (const [scenario, description] of Object.entries({
    unlucky: "checks immunity for Unlucky state/death kills and ignores dead players",
    watcher: "checks each kill target without immunity events or persistence",
    incubus: "clears pending conversion targets after abstention, immunity, and success",
    "state-search": "reports exhausted state searches without entering skipped phases",
    "state-end": "ends a game with no playable phase without a winner",
  })) {
    it(description, async function () {
      await run(process.execPath, [path.join(__dirname, "fixtures/mafiaFixReview.cjs"), scenario],
        { timeout: 12000 });
    });
  }
});
