import test from "node:test";
import assert from "node:assert/strict";
import { avatarCropSource, AVATAR_CROP_OUTPUT_SIZE } from "../src/utils/avatarCropGeometry.mjs";

const crop = values => avatarCropSource({ naturalWidth: 400, naturalHeight: 400, previewSize: 200, zoom: 1, position: { x: 0, y: 0 }, ...values });
test("responsive avatar preview covers portrait, landscape and square inputs", () => {
  assert.deepEqual(crop({}), { x: 0, y: 0, size: 400 });
  assert.deepEqual(crop({ naturalWidth: 800 }), { x: 200, y: 0, size: 400 });
  assert.deepEqual(crop({ naturalHeight: 800 }), { x: 0, y: 200, size: 400 });
});
test("resizing the preview and scaling its pan preserves the selected source crop", () => {
  const before = crop({ previewSize: 300, position: { x: 30, y: -15 }, zoom: 2 });
  const after = crop({ previewSize: 200, position: { x: 20, y: -10 }, zoom: 2 });
  assert.deepEqual(before, after);
  assert.equal(AVATAR_CROP_OUTPUT_SIZE, 300);
});
test("invalid image or frame dimensions cannot be sent to canvas cropping", () => {
  for (const value of [0, -1, NaN, Infinity]) assert.equal(crop({ naturalHeight: value }), null);
});
