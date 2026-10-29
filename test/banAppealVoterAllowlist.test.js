const assert = require("node:assert/strict");

describe("BAN_APPEAL_VOTER_ALLOWLIST", function () {
  const stubbed = {
    models: require.resolve("../db/models"),
    utils: require.resolve("../routes/utils"),
    siteSender: require.resolve("../modules/siteSender"),
  };
  const appealsPath = require.resolve("../modules/banAppeals");
  let previous, previousAppeals, previousEnv, members;

  function load(envValue) {
    if (envValue === undefined) delete process.env.BAN_APPEAL_VOTER_ALLOWLIST;
    else process.env.BAN_APPEAL_VOTER_ALLOWLIST = envValue;
    delete require.cache[appealsPath];
    return require("../modules/banAppeals");
  }

  function query(result) {
    return { select: async () => result };
  }

  before(function () {
    previous = Object.fromEntries(Object.entries(stubbed).map(([k, p]) => [k, require.cache[p]]));
    previousAppeals = require.cache[appealsPath];
    previousEnv = process.env.BAN_APPEAL_VOTER_ALLOWLIST;
    const groups = [
      { _id: "gOwner", name: "Owner" },
      { _id: "gAdmin", name: "Admin" },
      { _id: "gMod", name: "Mod" },
    ];
    const models = {
      Group: { find: ({ name }) => query(groups.filter((g) => name.$in.includes(g.name))) },
      InGroup: { find: ({ group }) => query(members.filter((m) => group.$in.includes(m.group))) },
      User: {
        find: ({ _id }) =>
          query(
            _id.$in
              .filter((id) => !id.startsWith("deleted"))
              .map((id) => ({ id }))
          ),
      },
    };
    const exportsFor = { models, utils: {}, siteSender: { SITE_SENDER_ID: "site" } };
    for (const [k, p] of Object.entries(stubbed))
      require.cache[p] = { id: p, filename: p, loaded: true, exports: exportsFor[k] };
  });

  after(function () {
    if (previousEnv === undefined) delete process.env.BAN_APPEAL_VOTER_ALLOWLIST;
    else process.env.BAN_APPEAL_VOTER_ALLOWLIST = previousEnv;
    for (const [k, p] of Object.entries(stubbed)) {
      if (previous[k]) require.cache[p] = previous[k];
      else delete require.cache[p];
    }
    if (previousAppeals) require.cache[appealsPath] = previousAppeals;
    else delete require.cache[appealsPath];
  });

  beforeEach(function () {
    members = [
      { user: "ownerA", group: "gOwner" },
      { user: "adminB", group: "gAdmin" },
      { user: "testAdmin", group: "gAdmin" },
      { user: "testOwner", group: "gOwner" },
      { user: "testOwner", group: "gAdmin" },
      { user: "deletedAdmin", group: "gAdmin" },
      { user: "testMod", group: "gMod" },
    ];
  });

  describe("unset (default)", function () {
    it("treats unset, empty, and only spaces and commas as no allowlist", function () {
      const banAppeals = load(undefined);
      [undefined, null, "", "   ", ",", " , ,, "].forEach((v) =>
        assert.equal(banAppeals.parseVoterAllowlist(v), null, String(v))
      );
      assert.equal(banAppeals.voterAllowlistStartupWarning(), null);
      assert.equal(load("").voterAllowlistStartupWarning(), null);
    });

    it("counts every Owner and Admin, as on prod", async function () {
      for (const v of [undefined, "", " , "]) {
        assert.deepEqual(await load(v).getAdminIds(), ["adminB", "ownerA", "testAdmin", "testOwner"], String(v));
      }
    });
  });

  describe("set", function () {
    it("parses a comma-separated id list, trimming spaces and skipping blanks", function () {
      const banAppeals = load(undefined);
      assert.deepEqual([...banAppeals.parseVoterAllowlist(" testAdmin , testOwner,,")], ["testAdmin", "testOwner"]);
    });

    it("reads the env value once at load and logs a warning", function () {
      const banAppeals = load("testAdmin,testOwner");
      assert.match(banAppeals.voterAllowlistStartupWarning(), /BAN_APPEAL_VOTER_ALLOWLIST is set: .* 2 listed/);
    });

    it("keeps only listed users who are also Owner or Admin", async function () {
      // testMod is listed but only a Mod; deletedAdmin is deleted; nobody is a typo.
      const banAppeals = load("testAdmin, testOwner, testMod, deletedAdmin, nobody");
      assert.deepEqual(await banAppeals.getAdminIds(), ["testAdmin", "testOwner"]);
    });

    it("gives no admins (N = 0) when nobody listed is an Owner or Admin", async function () {
      assert.deepEqual(await load("testMod,nobody").getAdminIds(), []);
    });

    it("ids are matched exactly (case-sensitive)", async function () {
      assert.deepEqual(await load("testadmin,TESTOWNER").getAdminIds(), []);
    });

    it("applyVoterAllowlist leaves the list alone without an allowlist", function () {
      const banAppeals = load(undefined);
      assert.deepEqual(banAppeals.applyVoterAllowlist(["a", "b"], null), ["a", "b"]);
      assert.deepEqual(banAppeals.applyVoterAllowlist(["a", "b"], new Set(["b"])), ["b"]);
    });
  });
});
