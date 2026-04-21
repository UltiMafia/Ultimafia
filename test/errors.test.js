const chai = require("chai");
const should = chai.should();
const errors = require("../lib/errors");

function makeMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("lib/errors", function () {
  const cases = [
    { fn: "badRequest", status: 400, msg: "bad input" },
    { fn: "unauthorized", status: 401, msg: "login required" },
    { fn: "forbidden", status: 403, msg: "not allowed" },
    { fn: "notFound", status: 404, msg: "missing" },
    { fn: "conflict", status: 409, msg: "already exists" },
    { fn: "payloadTooLarge", status: 413, msg: "too big" },
    { fn: "unprocessable", status: 422, msg: "invalid" },
    { fn: "tooManyRequests", status: 429, msg: "slow down" },
    { fn: "serverError", status: 500, msg: "boom" },
  ];

  cases.forEach(({ fn, status, msg }) => {
    it(`${fn} sets status ${status} and sends the message body`, function () {
      const res = makeMockRes();
      errors[fn](res, msg);
      res.statusCode.should.equal(status);
      res.body.should.equal(msg);
    });
  });

  it("serverError falls back to a default message when none is provided", function () {
    const res = makeMockRes();
    errors.serverError(res);
    res.statusCode.should.equal(500);
    res.body.should.be.a("string").and.have.length.above(0);
  });
});
