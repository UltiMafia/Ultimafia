const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const schemas = require("../db/schemas");

describe("comment image schema projection", function () {
  it("excludes binary from ordinary queries and explicitly opts in for image reads", async function () {
    const connection = mongoose.createConnection();
    const Comment = connection.model("CommentImageProjection", schemas.Comment);
    const captured = [];
    Comment.collection.findOne = async (filter, options) => {
      captured.push(options.projection || {});
      // Behave like the driver after Mongo applies the captured projection.
      return {
        id: "projection",
        ...(options.projection?.image === 0 ? {} : { image: Buffer.from("webp") }),
      };
    };
    try {
      const ordinary = await Comment.findOne({ id: "projection" }).lean();
      assert.equal(captured[0].image, 0);
      assert.equal(ordinary.image, undefined);
      const selected = await Comment.findOne({ id: "projection" }).select("+image").lean();
      assert.notEqual(captured[1].image, 0);
      assert.ok(Buffer.isBuffer(selected.image));
      await Comment.findOne({ id: "projection" }).select("id content author -_id").lean();
      assert.equal(captured[2].image, undefined);
      assert.equal(captured[2].content, 1);
    } finally {
      await connection.close();
    }
  });
});
