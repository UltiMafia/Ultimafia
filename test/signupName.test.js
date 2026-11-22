const { expect } = require("chai");
const { chooseSignupName } = require("../modules/signupName");

describe("chooseSignupName", function () {
  const generate = () => "Generated123";
  const maxLength = 20;

  it("keeps a Discord display name nobody has used", function () {
    expect(
      chooseSignupName({
        displayName: "Aspect",
        nameTaken: false,
        generate,
        maxLength,
      })
    ).to.equal("Aspect");
  });

  it("generates a name when the display name is taken", function () {
    expect(
      chooseSignupName({
        displayName: "Aspect",
        nameTaken: true,
        generate,
        maxLength,
      })
    ).to.equal("Generated123");
  });

  it("generates a name when Discord supplies none", function () {
    // The pre-existing crash: this returned null from the lookup instead of
    // falling through, so the caller read `.id` of null.
    expect(
      chooseSignupName({
        displayName: null,
        nameTaken: false,
        generate,
        maxLength,
      })
    ).to.equal("Generated123");
    expect(
      chooseSignupName({
        displayName: undefined,
        nameTaken: false,
        generate,
        maxLength,
      })
    ).to.equal("Generated123");
  });

  it("treats a blank display name as none", function () {
    expect(
      chooseSignupName({
        displayName: "   ",
        nameTaken: false,
        generate,
        maxLength,
      })
    ).to.equal("Generated123");
  });

  it("trims the display name it keeps", function () {
    expect(
      chooseSignupName({
        displayName: "  Aspect  ",
        nameTaken: false,
        generate,
        maxLength,
      })
    ).to.equal("Aspect");
  });

  it("truncates a generated name to the limit", function () {
    expect(
      chooseSignupName({
        displayName: null,
        nameTaken: false,
        generate: () => "x".repeat(40),
        maxLength,
      })
    ).to.have.length(maxLength);
  });
});
