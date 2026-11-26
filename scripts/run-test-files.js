#!/usr/bin/env node
// Run each Mocha test file in its own process, with bounded concurrency.
//
// Mocha's --parallel pool reuses worker processes. Several suites here patch
// Module.prototype.require, replace model methods and swap module exports, and
// those mutations outlive the file that made them, so a reused worker can fail
// the next file for reasons unrelated to its code. A process per file is the
// isolation the suites already assume.
//
// The workerDatabase helper gives each concurrent slot its own Mongo database,
// Redis database and game port, so files running at the same time do not wipe
// each other's fixtures or collide on a listening socket.

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mocha = require.resolve("mocha/bin/mocha.js");
const requires = [
  "./test/helpers/pushConfig.js",
  "./test/helpers/workerDatabase.js",
];

function collect(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "helpers" || entry.name === "node_modules") continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, files);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function relative(file) {
  return path.relative(root, path.resolve(file));
}

const requested = process.argv.slice(2);
const files = (requested.length
  ? requested.map(relative)
  : collect(path.join(root, "test"))
).sort();

if (files.length === 0) {
  console.error("No test files found");
  process.exit(1);
}

// Redis has 16 databases and the slots start at 1, so keep concurrency below
// 15 as well as below the CPU count.
const concurrency = Math.max(
  1,
  Math.min(
    Number(process.env.TEST_JOBS) || Math.max(1, os.cpus().length - 1),
    files.length,
    15
  )
);

let next = 0;
let passedTests = 0;
let failedTests = 0;
let failedFiles = 0;
const failures = [];

// Slots are claimed for the duration of a file, not derived from its index:
// one slow file can leave the other lanes far ahead, and index arithmetic
// would eventually hand the same database and port to two running files.
// Concurrency is capped at the number of slots, so pop() always succeeds.
const freeSlots = Array.from({ length: 15 }, (_, index) => index);

function count(output, label) {
  const match = new RegExp(`(\\d+) ${label}`).exec(output);
  return match ? Number(match[1]) : 0;
}

function run(file, slot) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        mocha,
        ...requires.flatMap((r) => ["--require", r]),
        "--timeout",
        "10000",
        "--exit",
        file,
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: "test",
          MOCHA_WORKER_ID: String(slot),
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let output = "";
    child.stdout.setEncoding("utf8").on("data", (data) => (output += data));
    child.stderr.setEncoding("utf8").on("data", (data) => (output += data));

    child.on("close", (code, signal) => {
      const passing = count(output, "passing");
      const failing = count(output, "failing");
      passedTests += passing;
      failedTests += failing;

      if (code === 0) {
        console.log(`ok   ${relative(file)} (${passing} passing)`);
      } else {
        failedFiles++;
        failures.push({ file: relative(file), signal, output });
        console.log(`FAIL ${relative(file)}`);
      }
      resolve();
    });
  });
}

async function lane() {
  while (true) {
    const index = next++;
    if (index >= files.length) return;

    const slot = freeSlots.pop();
    try {
      await run(files[index], slot);
    } finally {
      freeSlots.push(slot);
    }
  }
}

process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

(async () => {
  const started = Date.now();

  await Promise.all(Array.from({ length: concurrency }, () => lane()));

  for (const failure of failures) {
    console.log(`\n=== ${failure.file} ===`);
    console.log(failure.output.trimEnd());
    if (failure.signal) console.log(`\n(terminated by ${failure.signal})`);
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const passed = files.length - failedFiles;
  console.log(
    `\n${passed}/${files.length} files passed, ${passedTests} passing, ` +
      `${failedTests} failing in ${seconds}s`
  );

  process.exit(failedFiles === 0 ? 0 : 1);
})();
