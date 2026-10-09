const chai = require("chai");
const should = chai.should();
const {
  NO_ONE,
  KudosVote,
  rowWinners,
  guaranteedRowWinners,
  countRowVotes,
  rowKeyForAlignment,
  isWinLossResult,
} = require("../../Games/core/Kudos");

// Small helper: a vote with everyone on one alignment unless given.
function makeVote(players, alignments = {}) {
  return new KudosVote({
    candidates: players.map((id) => ({
      id,
      alignment: alignments[id] || "Village",
    })),
    voters: players,
  });
}

describe("Kudos", function () {
  describe("rowWinners (final rule)", function () {
    it("needs at least 2 votes", function () {
      rowWinners({ counts: { bob: 1, al: 0 }, noOne: 0 }).should.deep.equal([]);
      rowWinners({ counts: { bob: 2, al: 0 }, noOne: 0 }).should.deep.equal([
        "bob",
      ]);
    });

    it("No one beats the player only with strictly more votes", function () {
      rowWinners({ counts: { bob: 2 }, noOne: 2 }).should.deep.equal(["bob"]);
      rowWinners({ counts: { bob: 2 }, noOne: 3 }).should.deep.equal([]);
    });

    it("gives every tied top player a kudo", function () {
      rowWinners({ counts: { a: 2, b: 2, c: 1 }, noOne: 1 })
        .sort()
        .should.deep.equal(["a", "b"]);
    });

    it("counts only votes for that row's players or No one", function () {
      countRowVotes(["a", "b"], ["a", "x", NO_ONE, "a"]).should.deep.equal({
        counts: { a: 2, b: 0 },
        noOne: 1,
      });
    });
  });

  describe("spec examples", function () {
    it("3p: Alice->Bob, Carol->No one gives nothing; one more Bob vote wins", function () {
      const v = makeVote(["alice", "bob", "carol"]);
      should.not.exist(v.castVote("alice", "Village", "bob"));
      should.not.exist(v.castVote("carol", "Village", NO_ONE));
      v.evaluate().should.deep.equal([]);
      v.evaluate(true).should.deep.equal([]);

      const w = makeVote(["alice", "bob", "carol", "dan"]);
      w.castVote("alice", "Village", "bob");
      w.castVote("carol", "Village", NO_ONE);
      w.castVote("dan", "Village", "bob");
      // Bob 2, No one 1, Bob still to vote (can't vote for himself, but
      // could vote No one): 2 >= 1 + 1, so Bob is already safe.
      w.evaluate().should.deep.equal(["bob"]);
    });

    it("4p: 2 No one + 2 Bob gives Bob the kudo", function () {
      const v = makeVote(["a", "bob", "c", "d"]);
      v.castVote("a", "Village", "bob");
      v.castVote("c", "Village", "bob");
      v.castVote("bob", "Village", NO_ONE);
      v.castVote("d", "Village", NO_ONE);
      v.evaluate(true).should.deep.equal(["bob"]);
    });
  });

  describe("early (guaranteed) awards", function () {
    it("waits while remaining votes could still overtake or tie", function () {
      // Bob 2, Al 0, No one 0, 2 voters left: they could put Al or No one on 2.
      guaranteedRowWinners({ counts: { bob: 2, al: 0 }, noOne: 0 }, 2).should
        .deep.equal([]);
      guaranteedRowWinners({ counts: { bob: 3, al: 0 }, noOne: 0 }, 3).should
        .deep.equal([]); // 3-3 tie still possible
      // 3 vs at most 0 + 2 -> safe.
      guaranteedRowWinners({ counts: { bob: 3, al: 0 }, noOne: 0 }, 2).should
        .deep.equal(["bob"]);
    });

    it("can't settle a possible tie early, but settles a certain one", function () {
      const tally = { counts: { a: 2, b: 2 }, noOne: 0 };
      guaranteedRowWinners(tally, 1).should.deep.equal([]);
      guaranteedRowWinners(tally, 0).sort().should.deep.equal(["a", "b"]);
    });

    it("awards as soon as the lead can't be caught, then only once", function () {
      const players = ["p1", "p2", "p3", "p4", "p5", "p6"];
      const v = makeVote(players);
      v.castVote("p2", "Village", "p1");
      v.castVote("p3", "Village", "p1");
      v.evaluate().should.deep.equal([]); // 2 vs 0 + 4 remaining
      v.castVote("p4", "Village", "p1");
      v.castVote("p5", "Village", "p1");
      v.evaluate().should.deep.equal(["p1"]); // 4 vs 0 + 2
      v.evaluate().should.deep.equal([]);
      v.evaluate(true).should.deep.equal([]);
      v.awardedIds().should.deep.equal(["p1"]);
    });

    it("never settles a possible tie early; a certain tie gives both", function () {
      const v = makeVote(["a", "b", "c", "d", "e", "f"]);
      ["b", "c", "d"].forEach((x) => v.castVote(x, "Village", "a"));
      v.evaluate().should.deep.equal([]); // 3 vs 0 + 3: could end tied
      ["a", "e"].forEach((x) => v.castVote(x, "Village", "b"));
      v.evaluate().should.deep.equal([]); // 3 vs 2 + 1
      v.castVote("f", "Village", "b");
      v.evaluate().sort().should.deep.equal(["a", "b"]); // all in: 3-3
    });

    it("a tie with No one doesn't block an early award", function () {
      // Bob 3, No one 1, Al 0, 2 left: No one can reach 3 (tie favors Bob),
      // Al can reach 2.
      guaranteedRowWinners({ counts: { bob: 3, al: 0 }, noOne: 1 }, 2).should
        .deep.equal(["bob"]);
      // ...but No one overtaking is still possible here.
      guaranteedRowWinners({ counts: { bob: 3, al: 0 }, noOne: 2 }, 2).should
        .deep.equal([]);
    });
  });

  describe("leavers and finalizing", function () {
    it("treats leavers as non-voters (no automatic No one vote)", function () {
      const v = makeVote(["a", "b", "c", "d", "e", "f"]);
      v.castVote("a", "Village", "b");
      v.castVote("c", "Village", "b");
      v.evaluate().should.deep.equal([]); // 2 vs 0 + 4 remaining
      v.removeVoter("d");
      v.removeVoter("e");
      v.evaluate().should.deep.equal([]); // 2 vs 0 + 2 (b, f)
      v.removeVoter("f");
      v.evaluate().should.deep.equal(["b"]); // 2 vs 0 + 1
      v.tally("Village").noOne.should.equal(0);
    });

    it("keeps votes cast before leaving, and can't vote after leaving", function () {
      const v = makeVote(["a", "b", "c"]);
      v.castVote("a", "Village", "b");
      v.removeVoter("a");
      v.castVote("a", "Village", "c").should.be.a("string");
      v.tally("Village").counts.b.should.equal(1);
    });

    it("final settles with cast votes only and then locks everything", function () {
      const v = makeVote(["a", "b", "c", "d", "e", "f"]);
      v.castVote("a", "Village", "b");
      v.castVote("c", "Village", "b");
      v.evaluate().should.deep.equal([]);
      v.evaluate(true).should.deep.equal(["b"]);
      v.finalized.should.equal(true);
      v.castVote("d", "Village", NO_ONE).should.be.a("string");
    });
  });

  describe("voting rules", function () {
    it("rejects self votes", function () {
      const v = makeVote(["a", "b"]);
      v.castVote("a", "Village", "a").should.equal("You Cannot Kudo Yourself!");
      should.not.exist(v.castVote("a", "Village", NO_ONE));
    });

    it("locks a row once voted (no changes, no unvote)", function () {
      const v = makeVote(["a", "b", "c"]);
      should.not.exist(v.castVote("a", "Village", NO_ONE));
      v.castVote("a", "Village", "b").should.match(/locked/);
      v.castVote("a", "Village", NO_ONE).should.match(/locked/);
      v.stateFor("a").myVotes.should.deep.equal({ Village: NO_ONE });
    });

    it("lets players vote in every row, including their own alignment", function () {
      const v = makeVote(["t1", "t2", "m1", "m2"], { m1: "Mafia", m2: "Mafia" });
      should.not.exist(v.castVote("t1", "Village", "t2"));
      should.not.exist(v.castVote("t1", "Mafia", "m1"));
      v.castVote("t1", "Mafia", "t2").should.match(/Invalid/);
      v.castVote("t1", "Cult", NO_ONE).should.match(/Unknown/);
    });

    it("ignores non-voters (spectators, bots)", function () {
      const v = new KudosVote({
        candidates: [
          { id: "a", alignment: "Village" },
          { id: "b", alignment: "Village" },
        ],
        voters: ["a"],
      });
      v.castVote("spectator", "Village", "a").should.be.a("string");
      v.stateFor("spectator").canVote.should.equal(false);
    });
  });

  describe("rows and secrecy", function () {
    it("orders rows Town, Mafia, Cult, Independent and groups the rest", function () {
      rowKeyForAlignment("Hostile").should.equal("Independent");
      rowKeyForAlignment("Resistance").should.equal("Independent");
      const v = makeVote(["i1", "c1", "t1", "m1", "h1"], {
        i1: "Independent",
        c1: "Cult",
        m1: "Mafia",
        h1: "Hostile",
      });
      v.rows.map((r) => r.label).should.deep.equal([
        "Town",
        "Mafia",
        "Cult",
        "Independent",
      ]);
      v.getRow("Independent").candidates.should.deep.equal(["i1", "h1"]);
    });

    it("skips empty rows", function () {
      const v = makeVote(["t1", "m1"], { m1: "Mafia" });
      v.rows.map((r) => r.key).should.deep.equal(["Village", "Mafia"]);
    });

    it("never sends other players' votes or counts", function () {
      const v = makeVote(["a", "b", "c"]);
      v.castVote("a", "Village", "b");
      const s = v.stateFor("c");
      s.myVotes.should.deep.equal({});
      JSON.stringify(s).should.not.match(/count|noOne|ballot/i);
      Object.keys(s).sort().should.deep.equal([
        "awarded",
        "canVote",
        "finalized",
        "myVotes",
        "rows",
      ]);
    });
  });

  describe("eligibility", function () {
    it("needs a real win/loss", function () {
      isWinLossResult({ winnerGroups: ["Village"], winnerPlayerIds: ["a"] })
        .should.equal(true);
      // stalemate / everyone left
      isWinLossResult({ winnerGroups: ["No one"], winnerPlayerIds: [] })
        .should.equal(false);
      // meteor
      isWinLossResult({
        winnerGroups: ["No one"],
        winnerPlayerIds: [],
        meteor: true,
      }).should.equal(false);
      isWinLossResult({
        winnerGroups: ["Village"],
        winnerPlayerIds: ["a"],
        meteor: true,
      }).should.equal(false);
    });
  });
});
