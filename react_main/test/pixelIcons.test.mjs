import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { PIXEL_ICON_GRID, pixelIconLayout, pixelIconPaths, pixelIconSources, pixelIcons } from "../src/components/ui/pixelIcons.js";

const directory = new URL("../src/components/ui/pixelarticons/", import.meta.url);
const provenance = JSON.parse(fs.readFileSync(new URL("SOURCE.json", directory), "utf8"));
const sha256 = contents => crypto.createHash("sha256").update(contents).digest("hex");

test("icons use the actual MIT-licensed Pixelarticons set on its original 24px grid", () => {
  assert.equal(PIXEL_ICON_GRID, 24);
  assert.equal(provenance.library, "Pixelarticons (free set)");
  assert.equal(provenance.author, "Gerrit Halfmann");
  assert.equal(provenance.license, "MIT");
  assert.match(provenance.revision, /^[0-9a-f]{40}$/);
  assert.ok(Object.keys(pixelIcons).length >= 60);
});

test("every vendored SVG matches its pinned original bytes and rendered path data", () => {
  for (const file of provenance.files) {
    const bytes = fs.readFileSync(new URL(file.file, directory));
    assert.equal(sha256(bytes), file.sha256, file.name);
    assert.ok(file.source.includes(`/${provenance.revision}/svg/${file.file}`));
    const svg = bytes.toString();
    assert.match(svg, /viewBox="0 0 24 24"/);
    const upstreamPaths = [...svg.matchAll(/\bd="([^"]+)"/g)].map(match => match[1].replace(/\s+/g, " "));
    const semanticName = Object.keys(pixelIconSources).find(name => pixelIconSources[name] === file.name);
    assert.ok(semanticName, file.name);
    assert.deepEqual(pixelIcons[semanticName].paths.map(path => path.d.replace(/\s+/g, " ")), upstreamPaths, file.name);
  }
});

test("all semantic names resolve to unmodified upstream paths, never generated approximations", () => {
  const available = new Set(provenance.files.map(file => file.name));
  for (const [name, icon] of Object.entries(pixelIcons)) {
    assert.ok(available.has(icon.source), name);
    assert.ok(icon.paths.length > 0, name);
    for (const path of icon.paths) {
      assert.match(path.d, /^[MmLlHhVvZz0-9.,\s+-]+$/, name);
      assert.ok(!path.fillRule || ["evenodd", "nonzero"].includes(path.fillRule));
    }
    assert.equal(pixelIconPaths[name], icon.paths.map(path => path.d).join(" "));
  }
});

test("the original MIT notice ships as both vendored and public build data", () => {
  const license = fs.readFileSync(new URL("LICENSE.txt", directory));
  const publicLicense = fs.readFileSync(new URL("../public/licenses/pixelarticons.txt", import.meta.url));
  assert.equal(sha256(license), provenance.licenseSha256);
  assert.deepEqual(publicLicense, license);
  assert.match(license.toString(), /Copyright \(c\) 2019 Gerrit Halfmann/);
});

for (const size of [16, 18, 20, 24, 32, 40, 48, 64]) {
  test(`${size}px display size preserves the caller's slot, with source geometry kept at 24px`, () => {
    assert.equal(pixelIconLayout(size).extent, size);
    assert.equal(PIXEL_ICON_GRID, 24);
  });
}

test("primary icons default to native 24px; invalid sizes remain bounded", () => {
  assert.equal(pixelIconLayout().extent, 24);
  for (const value of [NaN, Infinity, -1, 0, "not-a-size"]) assert.equal(pixelIconLayout(value).extent, 24);
  assert.equal(pixelIconLayout(12).extent, 16);
});

test("opposed actions use distinct upstream artwork", () => {
  for (const [first, second] of [["eye", "eyeOff"], ["lock", "unlock"], ["previous", "next"], ["back", "forward"], ["up", "down"]]) {
    assert.notEqual(pixelIconPaths[first], pixelIconPaths[second], `${first}/${second}`);
  }
});
