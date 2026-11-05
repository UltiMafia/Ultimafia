const chai = require("chai");
const expect = chai.expect;
const {
  reviewPlayerSettings,
  REVIEW_SETTINGS_FIELDS,
} = require("../modules/reviewPlayerSettings");

describe("review player settings", () => {
  const cosmetic = {
    textColor: "#ff0000",
    nameColor: "#00ff00",
    nameFont: "Poppins",
    animatedNameColor: "rainbow",
    nameGradientColorA: "#111111",
    nameGradientColorB: "#222222",
    nameGradientColorC: "#333333",
    gameAvatarShape: "square",
    customEmotes: { wave: "wave-1" },
    customStickers: { hi: "hi-1" },
  };

  it("keeps every field the review client renders", () => {
    const out = reviewPlayerSettings(cosmetic);

    for (const field of REVIEW_SETTINGS_FIELDS) {
      expect(out[field], field).to.deep.equal(cosmetic[field]);
    }
    expect(out.animatedNameColor).to.equal("rainbow");
    expect(out.nameFont).to.equal("Poppins");
    expect(out.gameAvatarShape).to.equal("square");
  });

  it("uses the stored name color rather than copying the text color", () => {
    const out = reviewPlayerSettings({ textColor: "#ff0000", nameColor: "#00ff00" });

    expect(out.textColor).to.equal("#ff0000");
    expect(out.nameColor).to.equal("#00ff00");
  });

  it("does not leak unrelated account settings", () => {
    const out = reviewPlayerSettings({
      ...cosmetic,
      disableProTips: true,
      autoplay: false,
      fontFamily: "Roboto",
      hideStatistics: true,
      backgroundRepeatMode: "tile",
      bday: "2000-01-01",
    });

    expect(out).to.not.have.property("disableProTips");
    expect(out).to.not.have.property("autoplay");
    expect(out).to.not.have.property("fontFamily");
    expect(out).to.not.have.property("hideStatistics");
    expect(out).to.not.have.property("backgroundRepeatMode");
    expect(out).to.not.have.property("bday");
    expect(Object.keys(out).sort()).to.deep.equal([...REVIEW_SETTINGS_FIELDS].sort());
  });

  it("omits unset fields instead of returning undefined keys", () => {
    const out = reviewPlayerSettings({ textColor: "#ff0000" });

    expect(out).to.deep.equal({ textColor: "#ff0000" });
  });

  it("is safe when a user has no settings object", () => {
    expect(reviewPlayerSettings(undefined)).to.deep.equal({});
    expect(reviewPlayerSettings(null)).to.deep.equal({});
  });
});
