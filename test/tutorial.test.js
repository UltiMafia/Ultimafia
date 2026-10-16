const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const { execFileSync } = require("child_process");

const chatMatch = require("../Games/core/tutorial/chatMatch");
const storylines = require("../Games/core/tutorial/storylines");
const { CAST, buildCast, ROSTER } = require("../Games/core/tutorial/cast");

const NAMES = ROSTER.map((r) => r.name);
// Names for bots in a given storyline (human seat excluded from roster seats).
function seats(storylineId) {
  return buildCast(storylines.get(storylineId).userSeat);
}
const copSeats = seats("cop");
const sheriffSeats = seats("sheriff");
const MAF = copSeats.mafioso.name;
const COP = sheriffSeats.cop.name; // when human is sheriff, cop is a bot
const JAN = sheriffSeats.janitor.name;
const LAW = sheriffSeats.lawyer.name;
const V1 = sheriffSeats.v1.name;
const V2 = sheriffSeats.v2.name;
const V3 = sheriffSeats.v3.name;

function sim(storyline, actions, opts = {}) {
  const out = execFileSync(
    process.execPath,
    [path.join(__dirname, "../scripts/tutorial/sim.js"), storyline, JSON.stringify(actions), JSON.stringify(opts)],
    { encoding: "utf8", timeout: 90000 }
  );
  return JSON.parse(out.trim().split("\n").pop());
}

describe("Tutorial chat matching", function () {
  const target = "Aspect8445";
  const want = { role: "cop", target, verdict: "guilty" };

  it("accepts lenient claims", function () {
    for (const text of [
      `I'm the Cop. ${target} is guilty!`,
      `cop here, aspe is mafia`,
      `COP: checked ${target} -> GUILTY`,
    ])
      expect(chatMatch.evaluate(text, want, NAMES).ok, text).to.be.true;
  });

  it("names the problem", function () {
    expect(chatMatch.evaluate(`I'm the sheriff, ${target} is guilty`, want, NAMES).problem).to.equal("wrongRole");
    expect(chatMatch.evaluate(`cop: Z is guilty`, want, NAMES).problem).to.equal("wrongTarget");
    expect(chatMatch.evaluate(`cop: ${target} is innocent`, want, NAMES).problem).to.equal("wrongVerdict");
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

  it("cast uses all 8 live players as bots; human is the 9th", function () {
    expect(ROSTER.map((r) => r.name).sort()).to.deep.equal(
      ["Aspect8445", "Birbtales", "Gauss", "Giga13", "Golbolco", "Z", "nia", "sure"].sort()
    );
    for (const id of ["cop", "journalist", "lawyer", "janitor", "sheriff"]) {
      const c = seats(id);
      const botNames = Object.keys(c)
        .filter((k) => k !== storylines.get(id).userSeat)
        .map((k) => c[k].name)
        .sort();
      expect(botNames, id).to.deep.equal(ROSTER.map((r) => r.name).sort());
      expect(c[storylines.get(id).userSeat].name).to.equal(null);
    }
    const sample = seats("cop").journalist;
    expect(sample.avatar).to.match(/^\/images\/tutorial-bots\//);
  });
});

describe("Tutorial storylines end to end", function () {
  this.timeout(240000);
  const go = (n) => Array.from({ length: n }, () => ({ do: "go" }));
  const lessons = (r) => r.alerts.filter((a) => a.includes("✗"));

  it("Cop: wrong claim gets a reaction, bad choices teach a lesson, town wins; Sheriff shoots the guilty", function () {
    const r = sim("cop", [
      { vote: ["Investigate", MAF] },
      { chat: "im the journalist" },
      { do: "go" },
      { do: "voteOther" },
      ...go(6),
    ]);
    expect(r.winners).to.deep.equal(["Village"]);
    expect(r.failed).to.be.false;
    expect(r.log.some((l) => l.startsWith("react wrongRole"))).to.be.true;
    expect(r.log).to.include("vote sheriff@Shoot Gun -> mafioso");
    expect(r.alerts.join(" ")).to.match(/autowin/i);
    expect(r.errors).to.deep.equal([]);
  });

  it("Cop: a random guilty gets you shot by the Sheriff and ends the run", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, { do: "randomGuilty" }]);
    expect(r.failed).to.be.true;
    expect(r.humanAlive).to.be.false;
    expect(r.log).to.include("vote sheriff@Shoot Gun -> cop");
    expect(r.lastOverlay).to.include({ done: true, failed: true });
  });

  it("Cop game has all 8 live bots and no Eli", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)]);
    expect(r.botNames.slice().sort()).to.deep.equal(ROSTER.map((x) => x.name).sort());
    expect(r.humanSeat).to.equal("cop");
    expect(r.botNames).to.not.include("Eli");
    expect(r.winners).to.deep.equal(["Village"]);
  });

  it("Cop: everyone votes on a lynch including the condemned", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)]);
    expect(r.log.some((l) => l === `vote lawyer@Village -> lawyer` || l.startsWith("vote lawyer@Village"))).to.be.true;
    // Condemned lawyer votes (for themself or via everyoneVotes)
    expect(r.log.filter((l) => /@Village ->/.test(l)).length).to.be.at.least(6);
  });

  for (const branch of ["cop", "janitor"]) {
    it(`Journalist (${branch} branch): exposes Janitor D1, Cop dies N2, shares last report D2, town wins`, function () {
      const r = sim("journalist", [
        { do: "go" }, // N1 receive
        { do: "go" }, // D1 claim
        { do: "go" }, // D1 lynch mafioso
        { do: "go" }, // N2 receive Cop
        { do: "go" }, // D2 share lawyer guilty
        { do: "go" }, // D2 lynch lawyer
        ...go(2),
      ], { branch });
      expect(r.branch).to.equal(branch);
      expect(r.winners).to.deep.equal(["Village"]);
      expect(r.log).to.include("vote sheriff@Shoot Gun -> janitor");
      expect(r.log.some((l) => /@Mafia Kill -> cop/.test(l))).to.be.true;
      expect(r.alerts.join(" ")).to.match(/last report|Cop dies|Journalist/i);
      expect(r.errors).to.deep.equal([]);
    });
  }

  it("Journalist: claiming Cop gets you shot", function () {
    const r = sim("journalist", [{ do: "go" }, { do: "claimCop" }], { branch: "janitor" });
    expect(r.failed).to.be.true;
    expect(r.humanAlive).to.be.false;
  });

  it("Journalist: wrong Day-2 report is fatal (lynched, town loses)", function () {
    const r = sim("journalist", [
      { do: "go" },
      { do: "go" },
      { do: "go" },
      { do: "go" },
      { do: "wrongReport" },
    ], { branch: "cop" });
    expect(r.failed).to.be.true;
    expect(r.alerts.join(" ")).to.match(/wrong report|lynched you/i);
  });

  it("Lawyer: requires kill vote and Litigate; jan code; leaking gets you shot", function () {
    const r = sim("lawyer", [{ do: "go" }, { do: "litigateJanitor" }, ...go(2), { do: "voteTeammate" }, ...go(4)]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.log).to.include("state Night2");
    expect(r.log).to.include("state Day2");
    expect(r.alerts.join(" ")).to.match(/Reminder: you should always use your Lawyer action/);
    expect(r.alerts.join(" ")).to.match(/another Villager/);
    expect(r.alerts.join(" ")).to.match(/both|Litigate|kill/i);
    expect(lessons(r).length).to.equal(2);
    const bad = sim("lawyer", [...go(2), { do: "leakCode" }]);
    expect(bad.failed).to.be.true;
    expect(bad.humanAlive).to.be.false;
  });

  it("Lawyer (Loyal): the Litigate box lists only Mafia teammates, never town", function () {
    const r = sim("lawyer", go(8));
    const law = seats("lawyer");
    // Night 1 lists both teammates; Night 2 (Janitor shot Day 1) only the Mafioso.
    const n2 = r.litigateTargets.filter((l) => !l.includes(law.janitor.name) && l.includes(law.mafioso.name));
    expect(n2.length, "Night 2 Litigate list").to.be.greaterThan(0);
    const town = ["cop", "journalist", "sheriff", "v1", "v2", "v3"].map((k) => law[k].name);
    expect(r.litigateTargets.length).to.be.greaterThan(0);
    for (const list of r.litigateTargets) {
      const people = list.filter((n) => n !== "*");
      expect(people.length).to.be.greaterThan(0);
      for (const n of people) expect([law.mafioso.name, law.janitor.name]).to.include(n);
      for (const n of town) expect(list).to.not.include(n);
      expect(list).to.not.include("Newbie");
    }
    expect(r.winners).to.deep.equal(["Mafia"]);
  });

  it("No tutorial line teaches a Lawyer framing town in Frontier Justice", function () {
    const fs = require("fs");
    const dir = path.join(__dirname, "../Games/core/tutorial/storylines");
    const src = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    expect(src).to.not.match(/Lawyer on them|framed by a Lawyer|Litigating a town player makes them look GUILTY/i);
    expect(src).to.match(/non-Loyal\) Lawyer can also make a town player look guilty/);
  });

  for (const victim of ["v1", "cop", "journalist", "sheriff"]) {
    it(`Janitor (${victim} clean): sets a code, drops the phrase, Mafia wins`, function () {
      const r = sim("janitor", [...go(20)], { branch: victim, victim });
      expect(r.winners).to.deep.equal(["Mafia"]);
      expect(r.alerts.join(" ")).to.match(/jan code|code/i);
      expect(r.errors).to.deep.equal([]);
    });
  }

  it("Janitor: claiming Villager is a lesson on the villager-clean path", function () {
    const r = sim("janitor", [...go(3), { do: "claimVillager" }, { do: "go" }, ...go(6)], { victim: "v1" });
    expect(r.winners).to.deep.equal(["Mafia"]);
  });

  it("Janitor: leaking the cleaned role is fatal", function () {
    // Night1: code chat, kill, clean (3). Day1 phrase step offers leakRole.
    const r = sim("janitor", [...go(3), { do: "leakRole" }], { victim: "v1" });
    expect(r.failed).to.be.true;
  });

  for (const [choice, winner] of [["wait", "Village"], ["shootFake", "Village"], ["shootReal", "Mafia"]]) {
    it(`Sheriff (${choice}) ends in a ${winner} win and never no-lynches Day 1`, function () {
      const r = sim("sheriff", [{ do: choice }, { do: "noLynch" }, ...go(4)]);
      expect(r.branch).to.equal(choice);
      expect(r.winners).to.deep.equal([winner]);
      expect(r.log.some((l) => /@Village -> \*/.test(l))).to.be.false;
      if (choice === "shootReal") expect(r.alerts.join(" ")).to.include("waiting to gather info");
      if (choice === "wait") {
        expect(r.alerts.join(" ")).to.match(new RegExp(`flipped ${CAST.lawyer.role.split(":")[0]}`, "i"));
        expect(r.alerts.join(" ")).to.not.match(/flipped Villager/i);
      }
    });
  }

  it("Sheriff: Cop and Janitor guilties are Lawyer and Villager, not each other", function () {
    const r = sim("sheriff", [{ do: "wait" }, ...go(4)]);
    const day1 = r.chat.join("\n");
    expect(day1).to.include(LAW);
    expect(day1).to.include(V1);
    expect(day1).to.match(new RegExp(`checked ${LAW}`, "i"));
    expect(day1).to.match(new RegExp(`checked ${V1}`, "i"));
  });

  it("Sheriff: shooting a random player ends the run with a lesson", function () {
    const r = sim("sheriff", [{ do: "shootRandom" }]);
    expect(r.failed).to.be.true;
    expect(r.alerts.join(" ")).to.include("Never shoot without a reason");
    expect(r.lastOverlay).to.include({ done: true, failed: true });
  });

  it("phases wait for Continue: early clicks are rejected and nothing advances on its own", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)], { earlyContinue: true });
    expect(r.log.filter((l) => l === "continue rejected").length).to.be.at.least(3);
    expect(r.winners).to.deep.equal(["Village"]);
    expect(r.alerts.join(" ")).to.include("time does NOT stop");
    const stuck = sim("cop", [{ vote: ["Investigate", MAF] }], { noContinue: true, timeoutMs: 1500 });
    expect(stuck.state).to.equal("Night 1");
    expect(stuck.log).to.include("ready");
    expect(stuck.log).to.not.include("advance");
  });

  it("tutorial steps only move on Next, never on a timer", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)]);
    expect(r.nexts).to.be.at.least(10);
    const stuck = sim("cop", [{ vote: ["Investigate", MAF] }], { noNext: true, timeoutMs: 1500 });
    expect(stuck.log).to.not.include("human chose go");
    expect(stuck.lastOverlay.hasNext).to.be.true;
    expect(stuck.state).to.equal("Night 1");
  });

  it("night tutorial text never reveals the coming report", function () {
    for (const [story, opts] of [["cop", {}], ["journalist", { branch: "cop" }], ["journalist", { branch: "janitor" }]]) {
      const r = sim(story, [{ do: "go" }, ...go(10)], opts);
      let night = false;
      for (const l of r.log) {
        if (l.startsWith("state ")) night = l.startsWith("state Night");
        else if (night && l.startsWith("guide") && !l.includes("Welcome")) expect(l, l).to.not.match(/GUILTY|innocent|cleaned |learned/i);
      }
      expect(r.winners).to.deep.equal(["Village"]);
    }
  });

  it("Journalist picks the Cop or Janitor branch at random", function () {
    const seen = new Set();
    for (let i = 0; i < 12 && seen.size < 2; i++) seen.add(sim("journalist", [], { timeoutMs: 400 }).branch);
    expect([...seen].sort()).to.deep.equal(["cop", "janitor"]);
  });

  it("town votes are staggered; confirmed Mafia gets a quick pile-on", function () {
    const slow = sim("lawyer", go(5), { timing: { vote: [60, 90], fastVote: [5, 10] } }).voteTimes;
    expect(slow.length).to.be.at.least(6);
    for (let i = 1; i < 6; i++) expect(slow[i] - slow[i - 1]).to.be.within(50, 200);
    const fast = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)], { timing: { vote: [300, 400], fastVote: [20, 40] } }).voteTimes;
    expect(fast.length).to.be.at.least(4);
    for (let i = 1; i < 4; i++) expect(fast[i] - fast[i - 1]).to.be.below(150);
  });

  it("leaving mid-game closes the tutorial game", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }], { leaveAt: "Day1" });
    expect(r.closed).to.be.true;
    expect(r.finished).to.be.false;
  });

  it("leaving after the end closes the postgame too", function () {
    const r = sim("sheriff", [{ do: "shootReal" }], { leaveAfterFinish: true });
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.closed).to.be.true;
    expect(r.postgameOver).to.be.true;
  });

  it("never runs kudos in a tutorial game", function () {
    const r = sim("sheriff", [{ do: "shootReal" }]);
    expect(r.winners).to.deep.equal(["Mafia"]);
    expect(r.kudosStarted).to.be.false;
    expect(r.kudosEvents).to.equal(0);
  });

  it("can be replayed: a second run plays out the same way", function () {
    const a = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)]);
    const b = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(8)]);
    expect(a.winners).to.deep.equal(["Village"]);
    expect(b.winners).to.deep.equal(["Village"]);
  });

  it("Lessons only come from tutorial messages, never bot chat", function () {
    const r = sim("sheriff", [{ do: "wait" }, ...go(4)]);
    expect(r.chat.join(" ")).to.not.match(/waiting to gather info|Lesson/i);
    expect(r.alerts.join(" ")).to.include("waiting to gather info");
  });
  it("real-UI decisions: no buttons in the box, highlights point at the meeting/row/chat", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(10)]);
    expect(r.buttons).to.equal(0);
    const flat = r.highlights.flat();
    expect(flat.some((h) => h.meeting && h.target)).to.be.true;
    expect(flat.some((h) => h.chat)).to.be.true;
    expect(flat.some((h) => h.ui === "actions")).to.be.true;
    expect(r.examples.length).to.be.greaterThan(0);
  });

  it("pins Z as Cop and Gauss as Janitor whenever those seats are bots", function () {
    expect(COP).to.equal("Z");
    expect(JAN).to.equal("Gauss");
    const asSheriff = seats("sheriff");
    expect(asSheriff.cop.name).to.equal("Z");
    expect(asSheriff.janitor.name).to.equal("Gauss");
    const asCop = seats("cop");
    expect(asCop.janitor.name).to.equal("Gauss");
    // Human is janitor → Gauss seat empty, Cop still Z
    const asJan = seats("janitor");
    expect(asJan.cop.name).to.equal("Z");
    expect(asJan.janitor.name).to.equal(null);
  });

  it("Sheriff shootFake: Z posts :ez: :clap:, then LMAO, then :jerry:", function () {
    const r = sim("sheriff", [{ do: "shootFake" }, ...go(6)]);
    expect(r.branch).to.equal("shootFake");
    expect(r.winners).to.deep.equal(["Village"]);
    const chat = r.chat.join("\n");
    expect(chat).to.match(/:ez: :clap:/);
    expect(chat).to.match(/\bLMAO\b/);
    expect(chat).to.match(/:jerry:/);
    // Order: :ez: :clap: → LMAO → :jerry: (big sticker last)
    const i1 = chat.indexOf(":ez: :clap:");
    const i2 = chat.indexOf("LMAO");
    const i3 = chat.indexOf(":jerry:");
    expect(i1).to.be.at.least(0);
    expect(i2).to.be.above(i1);
    expect(i3).to.be.above(i2);
  });

  it("Sheriff wait/shootFake: if Z survives D1, Mafia kills Z N2 and Journalist shares the final guilty", function () {
    const mafN = seats("sheriff").mafioso.name;
    for (const choice of ["wait", "shootFake"]) {
      const r = sim("sheriff", [{ do: choice }, ...go(8)]);
      expect(r.log, choice).to.include("vote mafioso@Mafia Kill -> cop");
      const chat = r.chat.join("\n");
      expect(chat, choice).to.match(/Journalist/i);
      expect(chat, choice).to.match(new RegExp(`last check: ${mafN} GUILTY|last check was ${mafN}: GUILTY|Checked ${mafN} last night: GUILTY`, "i"));
      expect(r.winners, choice).to.deep.equal(["Village"]);
    }
  });

  it("rejoining mid-game (refresh / come back) restores the box: step, Next/Continue and highlights", function () {
    const r = sim("cop", [{ vote: ["Investigate", MAF] }, ...go(10)], { rejoinAtPending: true });
    expect(r.rejoin).to.be.an("object");
    expect(r.rejoin.got.length).to.be.greaterThan(0);
    const last = r.rejoin.got[0];
    expect(last.text).to.equal(r.rejoin.before.text);
    expect(last.highlight).to.deep.equal(r.rejoin.before.highlight);
    expect(last).to.have.property("hasNext");
    expect(last).to.have.property("canContinue");
    expect(r.rejoin.phases.length).to.be.greaterThan(0);
    expect(r.errors).to.deep.equal([]);
  });
});
