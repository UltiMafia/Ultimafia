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

  static numToPos(n) {
    n = String(n);

    var lastDigit = n[n.length - 1];
    var secLastDigit = n.length > 1 ? n[n.length - 2] : "";

    if (secLastDigit == "1") return `${n}th`;

    if (lastDigit == "1") return `${n}st`;

    if (lastDigit == "2") return `${n}nd`;

    if (lastDigit == "3") return `${n}rd`;

    return `${n}th`;
  }

  static adjustColor(color) {
    return {
      darkTheme: this.getIncreasedBrightness(color, "#181a1b"),
      lightTheme: this.getDecreasedBrightness(color, "#ffffff"),
    };
  }

  //#region Text color stuff
  static getIncreasedBrightness(color1, color2) {
    let contrastVal = colorContrast(color1, color2);
    if (contrastVal < 1.5) {
      return this.increaseBrightness(color1, 60);
    } else if (contrastVal <= 2.5) {
      return this.increaseBrightness(color1, 45);
    } else if (contrastVal <= 4.5) {
      return this.increaseBrightness(color1, 30);
    } else {
      return color1;
    }
  }

  static getDecreasedBrightness(color1, color2) {
    let contrastVal = colorContrast(color1, color2);
    if (contrastVal < 1.5) {
      return this.decreaseBrightness(color1, 50);
    } else if (contrastVal <= 2.5) {
      return this.decreaseBrightness(color1, 40);
    } else if (contrastVal <= 4.5) {
      return this.decreaseBrightness(color1, 30);
    } else {
      return color1;
    }
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
