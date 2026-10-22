const chai = require("chai");
const { requestUserObjectId } = require("../../modules/devApi/requestUser");

const expect = chai.expect;

describe("devApi/requestUser", function () {
  it("uses the session user _id for browser logins", async function () {
    const req = { session: { user: { id: "abc", _id: "oid-session" } } };
    const lookup = async () => {
      throw new Error("should not look up session users");
    };
    expect(await requestUserObjectId(req, lookup)).to.equal("oid-session");
  });

  it("looks up the _id for developer API bearer callers", async function () {
    const req = { session: {}, devApi: { userId: "dev1" } };
    const seen = [];
    const lookup = async (id) => {
      seen.push(id);
      return "oid-dev1";
    };
    expect(await requestUserObjectId(req, lookup)).to.equal("oid-dev1");
    expect(seen).to.deep.equal(["dev1"]);
  });

  it("returns undefined when nobody is logged in", async function () {
    expect(await requestUserObjectId({ session: {} }, async () => "x")).to.equal(undefined);
    expect(
      await requestUserObjectId({ session: {}, devApi: { userId: "gone" } }, async () => null)
    ).to.equal(undefined);
  });
});
