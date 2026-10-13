const chai = require("chai");
const expect = chai.expect;
const github = require("../../modules/githubContributions");

describe("githubContributions", function () {
  let realFetch;
  beforeEach(function () {
    realFetch = global.fetch;
  });
  afterEach(function () {
    global.fetch = realFetch;
  });

  it("validates GitHub username format", function () {
    for (const ok of ["vinxp97", "a", "a-b", "A1-b2"]) expect(github.isValidUsername(ok), ok).to.equal(true);
    for (const bad of ["", "-a", "a-", "a--b", "a_b", "a".repeat(40), "a/b"]) expect(github.isValidUsername(bad), bad).to.equal(false);
  });

  it("counts line contributions as additions plus deletions", function () {
    expect(github.lineContributions({ additions: 10, deletions: 4 })).to.equal(14);
    expect(github.lineContributions({})).to.equal(0);
  });

  it("sums weekly stats per author case-insensitively", function () {
    const totals = github.summarize([
      { author: { login: "VinXP97" }, total: 3, weeks: [{ a: 5, d: 1 }, { a: 2, d: 0 }] },
      { author: null, total: 1, weeks: [{ a: 9, d: 9 }] },
    ]);
    expect(totals.get("vinxp97")).to.deep.equal({ additions: 7, deletions: 1, commits: 3 });
    expect(totals.size).to.equal(1);
  });

  it("sorts approved links by lines and keeps the rest in their order", function () {
    const list = [
      { id: "u1", github: null },
      { id: "l1", github: { lines: 5 } },
      { id: "u2", github: null },
      { id: "l2", github: { lines: 50 } },
    ];
    expect(github.sortContributors(list).map((c) => c.id)).to.deep.equal(["l2", "l1", "u1", "u2"]);
  });

  it("retries while GitHub is computing stats", async function () {
    const statuses = [202, 202, 200];
    global.fetch = async () => {
      const status = statuses.shift();
      return { status, ok: status == 200, json: async () => [{ author: { login: "x" }, weeks: [] }] };
    };
    const stats = await github.fetchContributorStats({ attempts: 3, waitMs: 1 });
    expect(stats).to.have.length(1);
    expect(statuses).to.have.length(0);
  });

  it("skips the daily sync when GITHUB_SYNC_ENABLED=false", async function () {
    process.env.GITHUB_SYNC_ENABLED = "false";
    expect(github.syncEnabled()).to.equal(false);
    expect(await github.syncIfDue()).to.equal(null);
    delete process.env.GITHUB_SYNC_ENABLED;
    expect(github.syncEnabled()).to.equal(true);
  });

  it("sends GITHUB_TOKEN only when it is set", async function () {
    const seen = [];
    global.fetch = async (url, init) => {
      seen.push(init.headers.authorization);
      return { status: 404, ok: false };
    };
    const saved = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    await github.findGithubLogin("nobody");
    process.env.GITHUB_TOKEN = "t";
    await github.findGithubLogin("nobody");
    if (saved === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = saved;
    expect(seen).to.deep.equal([undefined, "Bearer t"]);
  });
});
