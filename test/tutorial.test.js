const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const { execFileSync } = require("child_process");

const chatMatch = require("../Games/core/tutorial/chatMatch");
const storylines = require("../Games/core/tutorial/storylines");

const NAMES = ["Cassidy", "Jesse", "Wyatt", "Dolly", "Eli", "Hattie", "Flint", "Silas"];

// Storylines run in a child process: the sim stubs redis/db in its require
// cache, which mustn't leak into other test files.
function sim(storyline, actions) {
  const out = execFileSync(
    process.execPath,
    [path.join(__dirname, "../scripts/tutorial/sim.js"), storyline, JSON.stringify(actions)],
    { encoding: "utf8", timeout: 60000 }
  );
  return JSON.parse(out.trim().split("\n").pop());
}

describe("Tutorial chat matching", function () {
  const want = { role: "cop", target: "Cassidy", verdict: "guilty" };

  it("accepts lenient claims", function () {
    for (const text of [
      "I'm the Cop. Cassidy is guilty!",
      "cop here, cass is mafia",
      "COP: checked Casidy -> GUILTY",
    ])
      expect(chatMatch.evaluate(text, want, NAMES).ok, text).to.be.true;
  });

  it("names the problem", function () {
    expect(chatMatch.evaluate("I'm the sheriff, Cassidy is guilty", want, NAMES).problem).to.equal("wrongRole");
    expect(chatMatch.evaluate("cop: Dolly is guilty", want, NAMES).problem).to.equal("wrongTarget");
    expect(chatMatch.evaluate("cop: Cassidy is innocent", want, NAMES).problem).to.equal("wrongVerdict");
    expect(chatMatch.evaluate("cop: Cassidy is not guilty", want, NAMES).problem).to.equal("wrongVerdict");
    expect(chatMatch.evaluate("hello everyone", want, NAMES).problem).to.equal("incomplete");
  });

  it("reads a villager claim", function () {
    expect(chatMatch.evaluate("just a vanilla townie", { role: "villager" }, NAMES).ok).to.be.true;
  });
});

describe("Tutorial storylines registry", function () {
  it("lists five, with Cop and Journalist as coming-soon stubs", function () {
    const s = storylines.summary();
    expect(s.map((x) => x.id)).to.have.members(["cop", "journalist", "lawyer", "janitor", "sheriff"]);
    expect(s.filter((x) => !x.available).map((x) => x.id)).to.have.members(["cop", "journalist"]);
  });
});

describe("Tutorial storylines end to end", function () {
  this.timeout(120000);

  it("Janitor: bots react to wrong claims, then the Mafia wins", function () {
    const r = sim("janitor", [
      { vote: ["Mafia Kill", "Eli"] },
      { vote: ["Clean Death", "Yes"] },
      { chat: "I'm cop, Dolly is guilty" },
      { chat: "I'm the cop, Cassidy is innocent" },
      { chat: "Cop here. Cass is guilty!" },
    ]);
    expect(r.errors).to.deep.equal([]);
    expect(r.finished).to.be.true;
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.humanAlive).to.be.false;
    expect(r.log.some((l) => l.startsWith("react wrongTarget"))).to.be.true;
    expect(r.log.some((l) => l.startsWith("react wrongVerdict"))).to.be.true;
    expect(r.log).to.include("vote sheriff@Shoot Gun -> cop");
  });

  it("Janitor: rejects a vote that isn't the scripted one", function () {
    const r = sim("janitor", [
      { vote: ["Mafia Kill", "Dolly"] },
      { vote: ["Mafia Kill", "Eli"] },
      { vote: ["Clean Death", "Yes"] },
      { chat: "I'm the Cop. Cassidy is guilty" },
    ]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.log.filter((l) => l.startsWith("guide Your team agreed on Eli"))).to.have.length(1);
  });

  it("Lawyer: jan code storyline ends in a Mafia win", function () {
    const r = sim("lawyer", [
      { vote: ["Mafia Kill", "$expected"] },
      { vote: ["Litigate", "Silas"] },
      { chat: "I am the cop" },
      { chat: "just a vanilla townie" },
      { vote: ["Village", "Hattie"] },
      { vote: ["Mafia Kill", "$expected"] },
    ]);
    expect(r.errors).to.deep.equal([]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.log.some((l) => l.startsWith("react wrongRole"))).to.be.true;
    expect(r.log.some((l) => /By the code, that means/.test(l))).to.be.true;
  });

  const LESSON = "As Sheriff, waiting to gather info can be better than shooting early.";

  it("Sheriff: holding the shot exposes the fake Cop and town wins", function () {
    const r = sim("sheriff", [
      { vote: ["Village", "*"] },
      { vote: ["Shoot Gun", "Cassidy"] },
      { vote: ["Shoot Gun", "Boone"] },
      { vote: ["Village", "Flint"] },
      { vote: ["Village", "Silas"] },
    ]);
    expect(r.errors).to.deep.equal([]);
    expect(r.branch).to.equal("wait");
    expect(r.winners).to.deep.equal(["Village"]);
    expect(r.log.some((l) => l.startsWith("guide") && l.includes(LESSON))).to.be.true;
  });

  it("Sheriff: shooting the real Cop loses and the epilogue teaches waiting", function () {
    const r = sim("sheriff", [{ vote: ["Shoot Gun", "Cassidy"] }]);
    expect(r.branch).to.equal("shootReal");
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.log.some((l) => l.startsWith("guide Lesson") && l.includes(LESSON))).to.be.true;
  });

  it("Sheriff: shooting the fake Cop wins", function () {
    const r = sim("sheriff", [
      { vote: ["Shoot Gun", "Boone"] },
      { vote: ["Village", "Silas"] },
      { vote: ["Village", "Flint"] },
    ]);
    expect(r.branch).to.equal("shootFake");
    expect(r.winners).to.deep.equal(["Village"]);
  });

  it("Lessons only come from tutorial messages, never bot chat", function () {
    const r = sim("sheriff", [{ vote: ["Shoot Gun", "Cassidy"] }]);
    expect(r.log.filter((l) => l.startsWith("say ") && /lesson|waiting to gather/i.test(l))).to.deep.equal([]);
  });
});
