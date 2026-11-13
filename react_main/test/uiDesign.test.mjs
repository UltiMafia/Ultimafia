import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { uiTokens, uiCssVariables } from "../src/components/ui/designTokens.js";
import { resolveFontFamilySetting } from "../src/constants/fontFamilies.js";
import icons, { iconSources } from "../src/components/ui/hackernoon/icons.js";

const directory = new URL("../src/components/ui/", import.meta.url);
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
test("default red/yellow action palettes have readable foreground contrast", () => {
  for (const palette of Object.values(uiTokens.palettes)) for (const [background, text] of [[palette.red, palette.onRed], [palette.yellow, palette.onYellow], [palette.surface, palette.text], [palette.surface, palette.muted]]) {
    const values = [luminance(background), luminance(text)].sort((a, b) => a - b);
    assert.ok((values[1] + .05) / (values[0] + .05) >= 4.5, `${background}/${text}`);
  }
});
test("CSS and native controls consume the same type and geometry tokens", () => {
  const css = uiCssVariables();
  assert.equal(css["--ui-text-body"], uiTokens.type.body);
  assert.equal(css["--ui-action-height"], `${uiTokens.control.height}px`);
  assert.ok(uiTokens.control.touchHeight >= 44);
  assert.equal(uiTokens.type.body, "1rem");
});
test("Fira Sans is the default while explicit classic/system/readable preferences remain", () => {
  assert.equal(resolveFontFamilySetting("default").body, uiTokens.fontFamily);
  assert.equal(resolveFontFamilySetting("unknown").body, uiTokens.fontFamily);
  assert.match(resolveFontFamilySetting("classic").body, /Roboto/);
  assert.match(resolveFontFamilySetting("system").body, /system-ui/);
  assert.match(resolveFontFamilySetting("readable").body, /Tahoma/);
});
test("all self-hosted font faces match pinned WOFF2 data and retain OFL notice", () => {
  const source = JSON.parse(fs.readFileSync(new URL("fonts/SOURCE.json", directory)));
  assert.equal(source.license, "SIL OFL 1.1");
  assert.equal(source.files.length, 8);
  for (const file of source.files) {
    const bytes = fs.readFileSync(new URL("fonts/" + file.file, directory));
    assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
    assert.equal(hash(bytes), file.sha256);
  }
  assert.match(fs.readFileSync(new URL("fonts/OFL.txt", directory), "utf8"), /SIL OPEN FONT LICENSE/);
});
test("the heavier icon set is actual pinned HackerNoon artwork, with its artwork license", () => {
  const source = JSON.parse(fs.readFileSync(new URL("hackernoon/SOURCE.json", directory)));
  assert.equal(source.license, "CC BY 4.0");
  assert.equal(uiTokens.iconSet, "hackernoon-solid");
  assert.ok(Object.keys(iconSources).length >= 60);
  for (const file of source.files) {
    const bytes = fs.readFileSync(new URL("hackernoon/" + file.name + ".svg", directory));
    assert.equal(hash(bytes), file.sha256);
    assert.ok(icons[file.name].length > 0);
    const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
    const elements = flatten(icons[file.name]);
    for (const [type, attribute] of [["path", "d"], ["polygon", "points"]]) {
      const expected = [...bytes.toString().matchAll(new RegExp(`<${type}\\b[^>]*\\b${attribute}="([^"]+)"`, "g"))].map(match => match[1].replace(/\s+/g, " "));
      assert.deepEqual(elements.filter(node => node.type === type).map(node => node.attrs[attribute].replace(/\s+/g, " ")), expected, file.name);
    }
  }
  assert.match(fs.readFileSync(new URL("hackernoon/NOTICE.txt", directory), "utf8"), /Icons from Pixel Icon Library by HackerNoon/);
});
