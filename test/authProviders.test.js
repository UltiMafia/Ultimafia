const chai = require("chai");
chai.should();
const {
  signInProvider,
  isAppleRelayEmail,
  isAllowedSignupEmail,
} = require("../modules/authProviders");

describe("modules/authProviders", function () {
  const allowed = ["gmail.com", "icloud.com"];

  it("reads the sign-in provider from verified token claims", function () {
    signInProvider({ firebase: { sign_in_provider: "apple.com" } }).should.equal("apple.com");
    signInProvider({ firebase: { sign_in_provider: "password" } }).should.equal("password");
    signInProvider({}).should.equal("");
    signInProvider(null).should.equal("");
  });

  it("recognises Apple private relay addresses", function () {
    isAppleRelayEmail("abc123@privaterelay.appleid.com").should.equal(true);
    isAppleRelayEmail("ABC@PrivateRelay.AppleID.com").should.equal(true);
    isAppleRelayEmail("someone@icloud.com").should.equal(false);
    isAppleRelayEmail(undefined).should.equal(false);
  });

  it("allows a relay address only for an Apple sign-in", function () {
    isAllowedSignupEmail("abc@privaterelay.appleid.com", "apple.com", allowed).should.equal(true);
    isAllowedSignupEmail("abc@privaterelay.appleid.com", "password", allowed).should.equal(false);
    isAllowedSignupEmail("abc@privaterelay.appleid.com", "google.com", allowed).should.equal(false);
    isAllowedSignupEmail("abc@privaterelay.appleid.com", "", allowed).should.equal(false);
  });

  it("keeps the EMAIL_DOMAINS rule for everything else", function () {
    isAllowedSignupEmail("a@gmail.com", "google.com", allowed).should.equal(true);
    isAllowedSignupEmail("a@icloud.com", "apple.com", allowed).should.equal(true);
    isAllowedSignupEmail("a@example.org", "apple.com", allowed).should.equal(false);
    isAllowedSignupEmail("no-at-sign", "apple.com", allowed).should.equal(false);
    isAllowedSignupEmail("", "apple.com", allowed).should.equal(false);
  });
});
