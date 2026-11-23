const assert = require("node:assert/strict");

const OWNER = "CazgBa82qhMe5thSj4hABGLfF8a6ts3He5ptpjJi4RB4";
const ATA = "OwnerUsdcTokenAccount1111111111111111111111";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Solana invoice matching reads only tx.meta, so legacy, v0 and v1
// transactions all match; one transaction the RPC can't return must not stop
// the scan of the others.
describe("Solana crypto invoice matching", function () {
  const previous = new Map();
  const environment = new Map();
  let cryptoPayments, rpcCalls, transactions, logs, credited;

  function replace(relative, exports) {
    const filename = require.resolve(relative);
    if (!previous.has(filename))
      previous.set(filename, require.cache[filename]);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  }

  function query(result) {
    const chain = {
      select: () => chain,
      lean: () => chain,
      exec: async () => result,
    };
    return chain;
  }

  function payment(signature, version, amount) {
    return {
      version,
      meta: {
        err: null,
        preTokenBalances: [
          {
            accountIndex: 1,
            mint: USDC,
            owner: OWNER,
            uiTokenAmount: { amount: "0" },
          },
        ],
        postTokenBalances: [
          {
            accountIndex: 1,
            mint: USDC,
            owner: OWNER,
            uiTokenAmount: { amount },
          },
        ],
      },
      transaction: { signatures: [signature] },
    };
  }

  function invoice(expectedAmountRaw) {
    return {
      _id: "invoice-db-id",
      invoiceId: "inv1",
      userId: "user1",
      chain: "solana",
      asset: "USDC",
      mint: USDC,
      coins: 5,
      expectedAmountRaw,
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
    };
  }

  before(function () {
    for (const [name, value] of Object.entries({
      ALCHEMY_API_KEY: "test-alchemy-key",
      ALCHEMY_SOLANA_URL: "https://solana.test/rpc",
      SOLANA_DEPOSIT_ADDRESS: OWNER,
    })) {
      environment.set(name, process.env[name]);
      process.env[name] = value;
    }
    replace("axios", {
      async post(url, body) {
        rpcCalls.push(body);
        if (body.method === "getTokenAccountsByOwner") {
          return { data: { result: { value: [{ pubkey: ATA }] } } };
        }
        if (body.method === "getSignaturesForAddress") {
          return {
            data: {
              result: Object.keys(transactions).map((signature) => ({
                signature,
                err: null,
              })),
            },
          };
        }
        if (body.method === "getTransaction") {
          const entry = transactions[body.params[0]];
          if (entry.error) return { data: { error: entry.error } };
          if (entry.version > body.params[1].maxSupportedTransactionVersion) {
            return {
              data: {
                error: {
                  code: -32015,
                  message: `Transaction version (${entry.version}) is not supported`,
                },
              },
            };
          }
          return { data: { result: entry } };
        }
        throw new Error(`unexpected RPC ${body.method}`);
      },
      async get() {
        throw new Error("unexpected GET");
      },
    });
    replace("../db/models", {
      CryptoInvoice: {
        updateOne(filter, update) {
          credited = update.$set;
          return query({ modifiedCount: 1 });
        },
        findOne: () => query(null),
      },
      User: { updateOne: () => query({}), findOne: () => query(null) },
      Group: { findOne: () => query(null) },
      InGroup: { findOne: () => query(null) },
    });
    replace("../modules/redis", {
      async cacheUserInfo() {},
      async cacheUserPermissions() {},
    });
    replace("../modules/logging", () => ({
      error: (entry) => logs.push(["error", entry]),
      warn: (entry) => logs.push(["warn", entry]),
      info() {},
    }));
  });

  beforeEach(function () {
    const filename = require.resolve("../modules/cryptoPayments");
    if (!previous.has(filename))
      previous.set(filename, require.cache[filename]);
    delete require.cache[filename];
    cryptoPayments = require("../modules/cryptoPayments");
    rpcCalls = [];
    logs = [];
    credited = null;
  });

  after(function () {
    for (const [filename, saved] of [...previous.entries()].reverse()) {
      if (saved) require.cache[filename] = saved;
      else delete require.cache[filename];
    }
    for (const [name, value] of environment) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  for (const version of [1, 0, "legacy"]) {
    it(`matches a ${version} transaction paying the exact amount`, async function () {
      transactions = { sigPaid: payment("sigPaid", version, "1000123") };
      const doc = await cryptoPayments.checkInvoice(invoice("1000123"));
      assert.equal(doc.status, "completed");
      assert.equal(doc.txSignature, "sigPaid");
      assert.equal(credited.txSignature, "sigPaid");
    });
  }

  it("asks the RPC for transactions up to version 1", async function () {
    transactions = { sigPaid: payment("sigPaid", 1, "1000123") };
    await cryptoPayments.checkInvoice(invoice("1000123"));
    const requests = rpcCalls.filter(
      (call) => call.method === "getTransaction",
    );
    assert.equal(requests.length, 1);
    assert.equal(requests[0].params[1].maxSupportedTransactionVersion, 1);
  });

  it("skips a transaction the RPC rejects and still matches a later one", async function () {
    transactions = {
      sigBroken: { error: { code: -32009, message: "Slot was skipped" } },
      sigOther: payment("sigOther", 1, "5000000"),
      sigPaid: payment("sigPaid", 0, "1000123"),
    };
    const doc = await cryptoPayments.checkInvoice(invoice("1000123"));
    assert.equal(doc.status, "completed");
    assert.equal(doc.txSignature, "sigPaid");
    const warnings = logs.filter(([level]) => level === "warn");
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0][1].signature, "sigBroken");
    assert.equal(warnings[0][1].code, -32009);
    assert.equal(
      logs.some(
        ([, entry]) => entry.message === "Alchemy invoice check failed",
      ),
      false,
    );
  });

  it("logs a distinct error for an unsupported transaction version and keeps scanning", async function () {
    transactions = {
      sigFuture: payment("sigFuture", 2, "1000123"),
      sigPaid: payment("sigPaid", 1, "1000123"),
    };
    const doc = await cryptoPayments.checkInvoice(invoice("1000123"));
    assert.equal(doc.txSignature, "sigPaid");
    const errors = logs.filter(([level]) => level === "error");
    assert.equal(errors.length, 1);
    assert.equal(errors[0][1].signature, "sigFuture");
    assert.match(errors[0][1].message, /version not supported/);
  });

  it("leaves the invoice pending when nothing matches", async function () {
    transactions = { sigOther: payment("sigOther", 1, "5000000") };
    const doc = await cryptoPayments.checkInvoice(invoice("1000123"));
    assert.equal(doc.status, "pending");
    assert.equal(credited, null);
  });
});
