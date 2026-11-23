process.env.NODE_ENV = "test";
const { fork } = require("child_process");
const fs = require("fs");
const path = require("path");
const { generate } = require("./generator");

function runCase(input, timeout = 15000, worker = path.join(__dirname, "worker.js")) {
  return new Promise((resolve) => {
    let latest = input;
    let output = "";
    let timedOut = false;
    const child = fork(worker, [], { silent: true });
    child.on("message", (message) => { latest = message; });
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (data) => { output = (output + data).slice(-16000); });
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeout);
    child.on("error", (error) => { latest = { ...latest, error: error.stack }; });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut || code !== 0 || !["finished", "bounded"].includes(latest.status)) {
        latest = { ...latest, status: "failure", error: timedOut
          ? `Worker exceeded ${timeout}ms (possible hang; replay with a larger timeout)`
          : latest.error || `Worker exited ${code}, signal ${signal}`, output };
      }
      resolve(latest);
    });
    child.send(input);
  });
}

function failureClass(error) {
  const text = String(error || "unknown");
  const first = text.split("\n")[0];
  const frame = text.match(/(Games[\\/][^\s)]+\.js):(\d+)/);
  return frame ? `${first} (${frame[1].replace(/\\/g, "/")}:${frame[2]})` : first;
}

async function main() {
  const args = process.argv.slice(2);
  const options = { seed: 1, cases: 100, steps: 40, timeout: 15000,
    modifiers: 3, output: "mafia-fuzz-failures" };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    if (![...Object.keys(options), "replay", "replay-dir"].includes(key) || args[i + 1] == null)
      throw new Error(`Unknown or incomplete option: ${args[i]}`);
    options[key] = ["output", "replay", "replay-dir"].includes(key) ? args[i + 1] : Number(args[i + 1]);
  }
  for (const key of ["seed", "cases", "steps", "timeout", "modifiers"])
    if (!Number.isSafeInteger(options[key]) || options[key] < (key === "seed" || key === "modifiers" ? 0 : 1))
      throw new Error(`Invalid --${key}`);
  if (options.replay && options["replay-dir"])
    throw new Error("Give --replay or --replay-dir, not both");
  let inputs = null;
  if (options["replay-dir"]) {
    inputs = fs.readdirSync(options["replay-dir"]).filter((f) => f.endsWith(".json")).sort()
      .map((f) => JSON.parse(fs.readFileSync(path.join(options["replay-dir"], f), "utf8")));
    if (!inputs.length) throw new Error(`No failure JSON files in ${options["replay-dir"]}`);
  } else if (options.replay) {
    inputs = [JSON.parse(fs.readFileSync(options.replay, "utf8"))];
  }
  let failures = 0;
  const classes = new Map();
  const counts = { finished: 0, bounded: 0, failure: 0 };
  for (let i = 0; i < (inputs ? inputs.length : options.cases); i++) {
    const seed = (options.seed + i) >>> 0;
    const input = inputs ? inputs[i]
      : { version: 1, seed, setup: generate(seed, options.modifiers), maxSteps: options.steps };
    const result = await runCase(input, options.timeout);
    counts[result.status]++;
    if (result.status === "failure") {
      failures++;
      const cls = failureClass(result.error);
      if (!classes.has(cls)) classes.set(cls, []);
      classes.get(cls).push(input.seed);
      fs.mkdirSync(options.output, { recursive: true });
      const file = path.join(options.output, `seed-${input.seed}-${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
      console.log(`FAIL seed=${input.seed}: ${result.error.split("\n")[0]}\n  ${file}`);
    } else console.log(`${result.status} seed=${input.seed} states=${result.states.length} actions=${result.trace.length}`);
  }
  if (classes.size) {
    console.log("failure classes:");
    for (const [cls, seeds] of [...classes].sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${seeds.length}x ${cls}\n    seeds: ${seeds.join(", ")}`);
  }
  console.log(JSON.stringify(counts));
  process.exitCode = failures ? 1 : 0;
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { runCase, failureClass };
