const chai = require("chai");
const should = chai.should();

// The module reads VAPID config once at require time, so it has to be set before
// the require below. Mocha runs each file in its own worker, so this is local.
process.env.VAPID_PUBLIC_KEY =
  "BBox3iOPqgDEx62MhFTmrv8YEBVACSVMdKTjIwIQpRoQ387eBHk0gBp2g3dav4kfPn7g1wLiburjIQh_L93629I";
process.env.VAPID_PRIVATE_KEY = "Nvv9yUKgO324l32336ogfzhJftPLex7XVs-2ZTfiti8";
process.env.VAPID_SUBJECT = "mailto:test@ultimafia.com";

const webpush = require("web-push");
const push = require("../modules/pushNotifications");

function subscription(endpoint) {
  return {
    endpoint: `https://push.example.com/${endpoint}`,
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
  };
}

describe("modules/pushNotifications", function () {
  let originalSend;
  let sent;

  beforeEach(function () {
    sent = [];
    originalSend = webpush.sendNotification;
    webpush.sendNotification = async (sub, payload) => {
      sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
    };
  });

  afterEach(function () {
    webpush.sendNotification = originalSend;
    push.unregisterUser("u1");
    push.unregisterUser("u2");
  });

  describe("register", function () {
    it("is enabled when VAPID keys are configured", function () {
      push.isEnabled().should.be.true;
      push.getPublicKey().should.equal(process.env.VAPID_PUBLIC_KEY);
    });

    it("accepts a well-formed web push subscription", function () {
      push.register("u1", subscription("a")).should.be.true;
      push.hasSubscription("u1").should.be.true;
    });

    it("rejects malformed subscriptions", function () {
      push.register("u1", null).should.be.false;
      push.register("u1", {}).should.be.false;
      // non-https endpoint
      push.register("u1", {
        endpoint: "http://push.example.com/a",
        keys: { p256dh: "x", auth: "y" },
      }).should.be.false;
      // missing keys
      push.register("u1", { endpoint: "https://push.example.com/a" }).should.be
        .false;
      push.hasSubscription("u1").should.be.false;
    });

    it("rejects an unknown transport type", function () {
      push.register("u1", { ...subscription("a"), type: "carrier-pigeon" })
        .should.be.false;
    });

    it("rejects a subscription with no user id", function () {
      push.register("", subscription("a")).should.be.false;
    });

    it("does not duplicate the same endpoint", async function () {
      push.register("u1", subscription("a"));
      push.register("u1", subscription("a"));

      await push.notifyUser("u1", { title: "hi" });
      sent.should.have.lengthOf(1);
    });

    it("evicts the oldest target past the per-user cap", async function () {
      for (let i = 0; i < push.MAX_TARGETS_PER_USER + 2; i++) {
        push.register("u1", subscription(`device-${i}`));
      }

      await push.notifyUser("u1", { title: "hi" });

      sent.should.have.lengthOf(push.MAX_TARGETS_PER_USER);
      // device-0 and device-1 were pushed out
      sent.map((s) => s.endpoint).should.not.include(
        "https://push.example.com/device-0"
      );
      sent.map((s) => s.endpoint).should.include(
        `https://push.example.com/device-${push.MAX_TARGETS_PER_USER + 1}`
      );
    });
  });

  describe("notifyUser", function () {
    it("delivers the payload to every registered device", async function () {
      push.register("u1", subscription("phone"));
      push.register("u1", subscription("laptop"));

      const count = await push.notifyUser("u1", {
        title: "Your game is ready!",
        url: "/game/abc",
      });

      count.should.equal(2);
      sent.should.have.lengthOf(2);
      sent[0].payload.title.should.equal("Your game is ready!");
      sent[0].payload.url.should.equal("/game/abc");
    });

    it("is a no-op for a user with no subscription", async function () {
      const count = await push.notifyUser("nobody", { title: "hi" });
      count.should.equal(0);
      sent.should.have.lengthOf(0);
    });

    it("prunes endpoints the push service reports as gone", async function () {
      push.register("u1", subscription("stale"));

      webpush.sendNotification = async () => {
        const err = new Error("gone");
        err.statusCode = 410;
        throw err;
      };

      const count = await push.notifyUser("u1", { title: "hi" });

      count.should.equal(0);
      push.hasSubscription("u1").should.be.false;
    });

    it("keeps endpoints after a transient failure", async function () {
      push.register("u1", subscription("flaky"));

      webpush.sendNotification = async () => {
        const err = new Error("rate limited");
        err.statusCode = 429;
        throw err;
      };

      await push.notifyUser("u1", { title: "hi" });

      push.hasSubscription("u1").should.be.true;
    });

    it("does not let one device's failure stop another's delivery", async function () {
      push.register("u1", subscription("broken"));
      push.register("u1", subscription("working"));

      webpush.sendNotification = async (sub, payload) => {
        if (sub.endpoint.endsWith("broken")) throw new Error("boom");
        sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
      };

      const count = await push.notifyUser("u1", { title: "hi" });

      count.should.equal(1);
      sent.should.have.lengthOf(1);
      sent[0].endpoint.should.equal("https://push.example.com/working");
    });

    it("notifies a list of users and totals the deliveries", async function () {
      push.register("u1", subscription("a"));
      push.register("u2", subscription("b"));

      // A repeated id must not double-send.
      const count = await push.notifyUsers(["u1", "u2", "u1"], { title: "hi" });

      count.should.equal(2);
      sent.should.have.lengthOf(2);
    });
  });

  describe("cleanup", function () {
    it("unregisters a single endpoint, leaving the others", async function () {
      push.register("u1", subscription("phone"));
      push.register("u1", subscription("laptop"));

      push.unregister("u1", "https://push.example.com/phone");

      await push.notifyUser("u1", { title: "hi" });
      sent.should.have.lengthOf(1);
      sent[0].endpoint.should.equal("https://push.example.com/laptop");
    });

    it("unregisters every endpoint for a user", function () {
      push.register("u1", subscription("phone"));
      push.register("u1", subscription("laptop"));

      push.unregisterUser("u1");

      push.hasSubscription("u1").should.be.false;
    });

    it("drops subscriptions past the TTL", function () {
      push.register("u1", subscription("a"));

      push.sweepExpired(Date.now() + push.SUBSCRIPTION_TTL - 1000);
      push.hasSubscription("u1").should.be.true;

      push.sweepExpired(Date.now() + push.SUBSCRIPTION_TTL + 1000);
      push.hasSubscription("u1").should.be.false;
    });
  });
});
