const path = require("path");

module.exports = class Utils {
  static importGameClass(gameType, classType, pathName) {
    if (classType == "core") classType = "";

    pathName = this.pascalCase(pathName);
    return require(path.join(
      __dirname,
      "../types",
      gameType,
      classType,
      pathName
    ));
  }

  static removeSpaces(string) {
    return string.split(" ").join("");
  }

  static snakeCase(string) {
    return string.split(" ").join("_");
  }

  static camelCase(string) {
    const parts = string.split(" ");
    let res = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      res += part[0].toUpperCase() + part.slice(1, part.length);
    }

    return res;
  }

  static pascalCase(string) {
    const parts = string.split(" ");
    let res = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      res += part[0].toUpperCase() + part.slice(1, part.length);
    }

    return res;
  }

  static validProp(prop) {
    return {}[prop] == null;
  }

  static numToPos(n) {
    n = String(n);

    const lastDigit = n[n.length - 1];
    const secLastDigit = n.length > 1 ? n[n.length - 2] : "";

    if (secLastDigit == "1") return `${n}th`;

    if (lastDigit == "1") return `${n}st`;

    if (lastDigit == "2") return `${n}nd`;

    if (lastDigit == "3") return `${n}rd`;

    return `${n}th`;
  }
};
