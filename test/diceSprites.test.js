const chai = require("chai");
const fs = require("fs");
const path = require("path");
chai.should();

const img = (n) => path.join(__dirname, "../react_main/src/images", n);
function ihdr(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
}

describe("Liar's Dice sprites", function () {
  for (const name of ["diceset.png", "diceset-mask.png", "diceset-light-pips.png"]) {
    it(`${name} keeps the 256x64 sheet size and has an alpha channel`, function () {
      const h = ihdr(img(name));
      h.w.should.equal(256);
      h.h.should.equal(64);
      h.colorType.should.equal(6); // RGBA
    });
  }

  it("CSS paints the face color under the sprite and masks it to the die", function () {
    const css = fs.readFileSync(path.join(__dirname, "../react_main/src/css/gameLiarsDice.css"), "utf8");
    css.should.include("background-color: var(--dice-color, #ffffff)");
    css.should.include('mask-image: url("/src/images/diceset-mask.png")');
    css.should.include("mask-position: var(--dice-sheet-pos)");
    css.should.not.match(/\.dice-[1-6] \{ background-position/);
  });

  it("settings validate diceColor as #rrggbb", function () {
    const src = fs.readFileSync(path.join(__dirname, "../routes/user.js"), "utf8");
    src.should.include('if (prop === "diceColor")');
    src.should.include("/^#[0-9a-fA-F]{6}$/.test(value)");
  });

  it("player info carries diceColor for everyone in the game", function () {
    const p = fs.readFileSync(path.join(__dirname, "../Games/core/Player.js"), "utf8");
    p.should.include("diceColor: this.user.diceColor");
  });
});
