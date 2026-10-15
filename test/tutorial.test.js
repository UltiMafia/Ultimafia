const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const { execFileSync } = require("child_process");

const chatMatch = require("../Games/core/tutorial/chatMatch");
const storylines = require("../Games/core/tutorial/storylines");

const NAMES = ["Cassidy", "Jesse", "Wyatt", "Dolly", "Eli", "Hattie", "Flint", "Silas"];

// Storylines run in a child process: the sim stubs redis/db in its require
// cache, which mustn't leak into other test files.
function sim(storyline, actions, opts = {}) {
  const out = execFileSync(
    process.execPath,
    [path.join(__dirname, "../scripts/tutorial/sim.js"), storyline, JSON.stringify(actions), JSON.stringify(opts)],
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
  it("lists five, all playable", function () {
    const s = storylines.summary();
    expect(s.map((x) => x.id)).to.have.members(["cop", "journalist", "lawyer", "janitor", "sheriff"]);
    expect(s.filter((x) => !x.available)).to.deep.equal([]);
  });
});

describe("Tutorial storylines end to end", function () {
  this.timeout(180000);
  const go = (n) => Array.from({ length: n }, () => ({ choose: "go" }));
  const lessons = (r) => r.alerts.filter((a) => a.includes("✗"));

  it("Cop: wrong claim gets a reaction, bad choices teach a lesson, town wins", function () {
    const r = sim("cop", [
      { vote: ["Investigate", "Silas"] },
      { chat: "im the journalist" },
      { choose: "quiet" },
      { choose: "go" },
      { choose: "voteOther" },
      ...go(4),
    ]);
    expect(r.winners).to.deep.equal(["Village"]);
    expect(r.failed).to.be.false;
    expect(r.log.some((l) => l.startsWith("react wrongRole"))).to.be.true;
    expect(lessons(r).length).to.equal(2);
    expect(r.errors).to.deep.equal([]);
  });

  it("Cop: a random guilty gets you shot by the Sheriff and ends the run", function () {
    const r = sim("cop", [{ vote: ["Investigate", "Silas"] }, { choose: "randomGuilty" }]);
    expect(r.failed).to.be.true;
    expect(r.humanAlive).to.be.false;
    expect(r.log).to.include("vote sheriff@Shoot Gun -> cop");
    expect(r.lastOverlay).to.include({ done: true, failed: true });
  });

  for (const branch of ["cop", "janitor"]) {
    it(`Journalist (${branch} branch): Sheriff shoots the Janitor, N2 check on the Cop claimant, town wins`, function () {
      const r = sim("journalist", [
        { choose: "go" },
        { choose: "quiet" },
        { choose: "go" },
        { choose: "voteCop" },
        { choose: "go" },
        { choose: "readVillager" },
        ...go(3),
      ], { branch });
      expect(r.branch).to.equal(branch);
      expect(r.winners).to.deep.equal(["Village"]);
      expect(r.log).to.include("vote sheriff@Shoot Gun -> janitor");
      // The Janitor is shot, never lynched.
      expect(r.log.some((l) => /@Village -> janitor/.test(l))).to.be.false;
      const n2 = r.log.indexOf("state Night2");
      expect(r.log.slice(n2).find((l) => l.startsWith("guide"))).to.include("Cop claimant");
      expect(r.log.slice(n2)).to.include("human chose go");
      expect(r.errors).to.deep.equal([]);
    });
  }

  it("Journalist: claiming Cop gets you shot", function () {
    const r = sim("journalist", [{ choose: "go" }, { choose: "claimCop" }], { branch: "janitor" });
    expect(r.failed).to.be.true;
    expect(r.humanAlive).to.be.false;
  });

  it("Lawyer: jan code storyline ends in a Mafia win; leaking the code gets you shot", function () {
    const r = sim("lawyer", [{ choose: "go" }, { choose: "litigateTown" }, ...go(2), { choose: "voteTeammate" }, ...go(2)]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(lessons(r).length).to.equal(2);
    const bad = sim("lawyer", [...go(2), { choose: "leakCode" }]);
    expect(bad.failed).to.be.true;
    expect(bad.humanAlive).to.be.false;
  });

  it("Janitor: claiming Villager is a lesson, a random guilty is fatal, the framed Cop path wins", function () {
    const r = sim("janitor", [...go(2), { choose: "claimVillager" }, { choose: "go" }]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.log).to.include("vote sheriff@Shoot Gun -> cop");
    const bad = sim("janitor", [...go(2), { choose: "randomGuilty" }]);
    expect(bad.failed).to.be.true;
  });

  it("Janitor: rejects a vote that isn't one of the options", function () {
    const r = sim("janitor", [{ vote: ["Mafia Kill", "Hattie"] }, ...go(3)]);
    expect(r.log.some((l) => l === "vote v3@Mafia Kill -> v3")).to.be.false;
    expect(r.winners).to.deep.equal(["Mafia"]);
  });

  for (const [choice, winner] of [["wait", "Village"], ["shootFake", "Village"], ["shootReal", "Mafia"]]) {
    it(`Sheriff (${choice}) ends in a ${winner} win and never no-lynches Day 1`, function () {
      const r = sim("sheriff", [{ choose: choice }, { choose: "noLynch" }, ...go(4)]);
      expect(r.branch).to.equal(choice);
      expect(r.winners).to.deep.equal([winner]);
      expect(r.log.some((l) => /@Village -> \*/.test(l))).to.be.false;
      if (choice === "shootReal") expect(r.alerts.join(" ")).to.include("waiting to gather info");
    });
  }

  it("Sheriff: shooting a random player ends the run with a lesson", function () {
    const r = sim("sheriff", [{ choose: "shootRandom" }]);
    expect(r.failed).to.be.true;
    expect(r.lastOverlay.text).to.include("Never shoot without a reason");
  });

  it("phases wait for Continue: early clicks are rejected and nothing advances on its own", function () {
    const r = sim("cop", [{ vote: ["Investigate", "Silas"] }, ...go(6)], { earlyContinue: true });
    expect(r.log.filter((l) => l === "continue rejected").length).to.be.at.least(3);
    expect(r.winners).to.deep.equal(["Village"]);
    expect(r.alerts.join(" ")).to.include("time does NOT stop");
    const stuck = sim("cop", [{ vote: ["Investigate", "Silas"] }], { noContinue: true, timeoutMs: 1500 });
    expect(stuck.state).to.equal("Night 1");
    expect(stuck.log).to.include("ready");
    expect(stuck.log).to.not.include("advance");
  });

  it("town votes are staggered over time", function () {
    const r = sim("lawyer", go(5), { timing: { vote: [60, 90] } });
    const t = r.voteTimes;
    expect(t.length).to.be.at.least(6);
    for (let i = 1; i < 6; i++) expect(t[i] - t[i - 1]).to.be.at.least(50);
  });

  it("leaving mid-game closes the tutorial game", function () {
    const r = sim("cop", [{ vote: ["Investigate", "Silas"] }], { leaveAt: "Day1" });
    expect(r.closed).to.be.true;
    expect(r.finished).to.be.false;
  });

  it("leaving after the end closes the postgame too", function () {
    const r = sim("sheriff", [{ choose: "shootReal" }], { leaveAfterFinish: true });
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.closed).to.be.true;
    expect(r.postgameOver).to.be.true;
  });

  it("can be replayed: a second run plays out the same way", function () {
    const a = sim("cop", [{ vote: ["Investigate", "Silas"] }, ...go(6)]);
    const b = sim("cop", [{ vote: ["Investigate", "Silas"] }, ...go(6)]);
    expect(a.winners).to.deep.equal(["Village"]);
    expect(b.winners).to.deep.equal(["Village"]);
  });

  it("Lessons only come from tutorial messages, never bot chat", function () {
    const r = sim("sheriff", [{ choose: "wait" }, ...go(4)]);
    expect(r.chat.join(" ")).to.not.match(/waiting to gather info|Lesson/i);
    expect(r.alerts.join(" ")).to.include("waiting to gather info");
  });
});
