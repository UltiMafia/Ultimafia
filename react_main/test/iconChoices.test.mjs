import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { iconChoices } from "./icon-choices/families.js";
const root = new URL("./icon-choices/", import.meta.url);
test("comparison choices retain pinned original SVG bytes and license notices", () => {
  const files = JSON.parse(fs.readFileSync(new URL("SOURCE.json", root), "utf8"));
  assert.equal(files.length, 56); assert.equal(iconChoices.length, 4);
  for (const file of files) {
    const bytes = fs.readFileSync(new URL(`${file.family}/${file.name}.svg`, root));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), file.sha256);
    const family = iconChoices.find(family => family.id === file.family);
    assert.match(file.source, new RegExp(family.revision));
    assert.match(bytes.toString(), new RegExp(`viewBox="0 0 ${family.grid} ${family.grid}"`));
  }
  for (const family of iconChoices) assert.ok(fs.readFileSync(new URL(`${family.id}/LICENSE.txt`, root), "utf8").length > 1000);
});
test("duotone opacity is retained and comparison controls resolve within each family", () => {
  const flatten = elements => elements.flatMap(element => [element, ...flatten(element.children || [])]);
  for (const family of iconChoices) for (const name of ["games", "chat", "people", "book", "rankings", "settings", "info", "check", "send", "emotes", "menu", "add", "close", "help"]) assert.ok(family.icons[name], `${family.id}: ${name}`);
  const duo = iconChoices.find(family => family.id === "phosphor-duotone");
  assert.ok(flatten(duo.icons.chat.elements).some(element => Number(element.attrs.opacity) > 0 && Number(element.attrs.opacity) < 1));
});
