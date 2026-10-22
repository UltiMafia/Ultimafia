const chai = require("chai");
chai.should();
const crypto = require("crypto");
const { verifyAppleNotification } = require("../modules/appleNotifications");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test", alg: "RS256" };
const getKeys = async () => [jwk];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function sign(claims, key = privateKey) {
  const data = `${b64({ alg: "RS256", kid: "test" })}.${b64(claims)}`;
  return `${data}.${crypto.sign("RSA-SHA256", Buffer.from(data), key).toString("base64url")}`;
}

const now = Date.now();
const base = () => ({
  iss: "https://appleid.apple.com",
  aud: "VCCCLLC.Ultimafia",
  exp: Math.floor(now / 1000) + 300,
  events: JSON.stringify({ type: "consent-revoked", sub: "001.abc", event_time: now }),
});
const opts = { getKeys, audiences: ["VCCCLLC.Ultimafia"], now };

describe("modules/appleNotifications", function () {
  it("accepts a valid notification", async function () {
    const { event } = await verifyAppleNotification(sign(base()), opts);
    event.type.should.equal("consent-revoked");
    event.sub.should.equal("001.abc");
  });

  const rejects = {
    "wrong audience": { aud: "other.app" },
    "wrong issuer": { iss: "https://evil.example" },
    expired: { exp: Math.floor(now / 1000) - 3600 },
    "unknown event": { events: JSON.stringify({ type: "password-changed", sub: "x" }) },
  };
  Object.entries(rejects).forEach(([name, patch]) =>
    it(`rejects ${name}`, async function () {
      let err;
      try { await verifyAppleNotification(sign({ ...base(), ...patch }), opts); } catch (e) { err = e; }
      chai.expect(err).to.be.an("error");
    })
  );

  it("rejects a bad signature", async function () {
    const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    let err;
    try { await verifyAppleNotification(sign(base(), other), opts); } catch (e) { err = e; }
    chai.expect(err).to.be.an("error");
  });
});
