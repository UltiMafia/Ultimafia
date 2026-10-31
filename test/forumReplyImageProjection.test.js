const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const schemas = require("../db/schemas");

describe("forum reply image schema projection", function () {
  it("excludes binary from ordinary queries and explicitly opts in for image reads", async function () {
    const connection = mongoose.createConnection();
    const ForumReply = connection.model("ForumReplyImageProjection", schemas.ForumReply);
    const captured = [];
    ForumReply.collection.findOne = async (filter, options) => {
      captured.push(options.projection || {});
      // Behave like the driver after Mongo applies the captured projection.
      return {
        id: "projection",
        ...(options.projection?.image === 0 ? {} : { image: Buffer.from("webp") }),
      };
    };
    try {
      const ordinary = await ForumReply.findOne({ id: "projection" }).lean();
      assert.equal(captured[0].image, 0);
      assert.equal(ordinary.image, undefined);
      const selected = await ForumReply.findOne({ id: "projection" }).select("+image content thread").lean();
      assert.notEqual(captured[1].image, 0);
      assert.ok(Buffer.isBuffer(selected.image));
      await ForumReply.findOne({ id: "projection" }).select("id content author -_id").lean();
      assert.equal(captured[2].image, undefined);
      assert.equal(captured[2].content, 1);
    } finally {
      await connection.close();
    }
  });
});