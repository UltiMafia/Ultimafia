const chai = require("chai");
const should = chai.should();
const { splitEmail, normalizeEmail, aliasRegex, isSameIdentity } = require("../modules/emailAlias");

describe("modules/emailAlias", function () {
  it("splits a trimmed, lowercase email", function () {
    splitEmail(" AB+1@GMAIL.COM ").should.deep.equal({ local: "ab+1", domain: "gmail.com" });
  });

  it("normalizes Gmail plus aliases, dots, and googlemail", function () {
    normalizeEmail("A.B+1@GoogleMail.com").should.equal("ab@gmail.com");
    isSameIdentity("ab@gmail.com", "a.b+anything@googlemail.com").should.equal(true);
  });

  it("only removes plus suffixes for other domains", function () {
    normalizeEmail("John.Smith+3@Example.com").should.equal("john.smith@example.com");
    isSameIdentity("john@example.com", "john+3@example.com").should.equal(true);
    isSameIdentity("john@example.com", "j.ohn@example.com").should.equal(false);
  });

  it("normalizes case and rejects junk", function () {
    normalizeEmail("User@Example.COM").should.equal("user@example.com");
    ["", "no-at-sign", "a@", "@b.com", null].forEach((email) => chai.expect(normalizeEmail(email)).to.equal(null));
  });

  it("matches Gmail dot and plus aliases, but not other mailboxes", function () {
    const regex = aliasRegex("ab@gmail.com");
    ["ab@gmail.com", "a.b@gmail.com", "AB+1@gmail.com", "ab+anything@googlemail.com"].forEach((email) => regex.test(email).should.equal(true));
    ["abc@gmail.com", "ab@yahoo.com"].forEach((email) => regex.test(email).should.equal(false));
  });

  it("matches non-Gmail plus aliases but preserves dots and domain", function () {
    const regex = aliasRegex("john@example.com");
    regex.test("john+3@example.com").should.equal(true);
    regex.test("j.ohn@example.com").should.equal(false);
    regex.test("john@other.com").should.equal(false);
  });

  it("anchors aliases on both ends", function () {
    const regex = aliasRegex("ab@gmail.com");
    regex.test("ab@gmail.comx@gmail.com").should.equal(false);
    regex.test(" ab@gmail.com").should.equal(false);
  });
});
