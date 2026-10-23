const chai = require("chai");
chai.should();
const { planEmailSync } = require("../modules/accountEmail");

describe("modules/accountEmail planEmailSync", function () {
  const user = { fbUid: "uid1", email: ["old@gmail.com", "discord@gmail.com"] };
  const claims = { uid: "uid1", email: "New@Gmail.com", email_verified: true };
  const allowedDomains = ["gmail.com"];
  const base = { user, claims, allowedDomains, takenByOther: false };

  it("replaces the old address with the verified new one", function () {
    const p = planEmailSync({ ...base, oldEmail: "OLD@gmail.com" });
    p.ok.should.equal(true);
    p.changed.should.equal(true);
    p.emails.should.deep.equal(["new@gmail.com", "discord@gmail.com"]);
  });

  it("adds the new address first when the old one is not given", function () {
    planEmailSync(base).emails.should.deep.equal([
      "new@gmail.com",
      "old@gmail.com",
      "discord@gmail.com",
    ]);
  });

  it("does nothing when the address is already stored", function () {
    const p = planEmailSync({ ...base, claims: { ...claims, email: "old@gmail.com" } });
    p.ok.should.equal(true);
    p.changed.should.equal(false);
  });

  it("refuses an unverified address", function () {
    planEmailSync({ ...base, claims: { ...claims, email_verified: false } }).ok.should.equal(false);
  });

  it("refuses a token for another Firebase account", function () {
    planEmailSync({ ...base, claims: { ...claims, uid: "uid2" } }).ok.should.equal(false);
    planEmailSync({ ...base, user: { ...user, fbUid: undefined } }).ok.should.equal(false);
  });

  it("refuses a domain outside EMAIL_DOMAINS", function () {
    planEmailSync({ ...base, claims: { ...claims, email: "a@example.org" } }).ok.should.equal(false);
  });

  it("refuses an address another account uses", function () {
    planEmailSync({ ...base, takenByOther: true }).ok.should.equal(false);
  });
});
