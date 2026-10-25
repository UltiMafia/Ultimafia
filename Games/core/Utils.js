const path = require("path");
const colorContrast = require("color-contrast");

module.exports = class Utils {
  static importGameClass(gameType, classType, pathName) {
    if (classType == "core") classType = "";

    pathName = this.pascalCase(pathName);
    return require(path.join(
      __dirname,
      "../types",
      this.removeSpaces(gameType),
      classType,
      pathName
    ));
  }

  static addArticle(string) {
    const vowelRegex = "^[aieouAIEOU].*";
    const article = string.match(vowelRegex) ? "an" : "a";
    return `${article} ${string}`;
  }

  static removeSpaces(string) {
    return string.split(" ").join("");
  }

  static snakeCase(string) {
    return string.split(" ").join("_");
  }

  static camelCase(string) {
    var parts = string.split(" ");
    var res = parts[0];

    for (let i = 1; i < parts.length; i++) {
      let part = parts[i];
      res += part[0].toUpperCase() + part.slice(1, part.length);
    }

    return res;
  }

  static pascalCase(string) {
    if (!string) {
      return "";
    }
    var parts = string.split(" ");
    var res = "";

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      res += part[0].toUpperCase() + part.slice(1, part.length);
    }

    return res;
  }

  static validProp(prop) {
    return {}[prop] == null;
  }

  static increaseBrightness(color, percent) {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      B = ((num >> 8) & 0x00ff) + amt,
      G = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
        (G < 255 ? (G < 1 ? 0 : G) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  static decreaseBrightness(color, percent) {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      B = ((num >> 8) & 0x00ff) - amt,
      G = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
        (G < 255 ? (G < 1 ? 0 : G) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }
  //#endregion
};
