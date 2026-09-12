const { execFile } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const run = promisify(execFile);

describe("Mafia mission and integrity regressions", function () {
  this.timeout(15000);
  for (const [scenario, description] of Object.entries({
    integrity: "preserves integrity state and alerts in tests without persistence",
    scoring: "scores played missions but never scores a missing or empty team",
    "missing-team": "retries a missing team even when players vote to approve it",
    "retry-limit": "awards spies a failure only when the team retry limit is reached",
    rejected: "skips the mission after rejection without double-counting the attempt",
    "approval-timeout": "retries a selected team when approval times out",
    approved: "allows a selected and approved team to proceed",
  })) {
    it(description, async function () {
      await run(process.execPath, [path.join(__dirname, "fixtures/mafiaMissionRegression.cjs"), scenario],
        { timeout: 12000 });
    });
  }
});
