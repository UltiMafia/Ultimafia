import axios from "axios";
import colorContrast from "color-contrast";

// "bad" because it's not cryptographically secure + not very random (but good enough for us)
export const badMathRandomWithSeed = (seed) => {
  const x = Math.sin(seed + 10000) * 10000;
  return x - Math.floor(x);
};

export const hashStrToInt = (str) => {
  const MAX_VAL = 666013;

  const letters = str.split("");
  const lettersCharCodes = letters.map((letter) => letter.charCodeAt(0));
  const base = lettersCharCodes.reduce(
    (acc, val) => Math.max(acc, val),
    -Infinity
  );
  const lettersToVal = lettersCharCodes.map(
    (letterCode, index) => (base ** index * letterCode) % MAX_VAL
  );
  const result = lettersToVal.reduce((acc, val) => (acc + val) % MAX_VAL, 0);

  return result;
};

export function hyphenDelimit(roleName) {
  roleName = roleName.slice();

  for (let i = 0; i < roleName.length; i++) {
    if (roleName[i] == " ") roleName = roleName.replace(" ", "-");
  }

  return roleName;
}

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.substring(1);
}

export function hexToHSL(H) {
  // CHECK IF UNDEFINED!!!!
  // May break certain pages if this is not done.
  if (H == undefined) {
    H = "#000000";
  }

  // Convert hex to RGB first
  let r = 0;
  let g = 0;
  let b = 0;
  if (H.length == 4) {
    r = `0x${H[1]}${H[1]}`;
    g = `0x${H[2]}${H[2]}`;
    b = `0x${H[3]}${H[3]}`;
  } else if (H.length == 7) {
    r = `0x${H[1]}${H[2]}`;
    g = `0x${H[3]}${H[4]}`;
    b = `0x${H[5]}${H[6]}`;
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h},${s},${l}`;
}

export function HSLToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  // Having obtained RGB, convert channels to hex
  r = Math.round((r + m) * 255).toString(16);
  g = Math.round((g + m) * 255).toString(16);
  b = Math.round((b + m) * 255).toString(16);

  // Prepend 0s, if necessary
  if (r.length == 1) r = `0${r}`;
  if (g.length == 1) g = `0${g}`;
  if (b.length == 1) b = `0${b}`;

  return `#${r}${g}${b}`;
}

export function adjustColor(hexColor) {
  let contrastVal = 0;
  let colorScheme = "light";
  let colorAutoScheme = false;
  if (document.documentElement.classList.length === 0) {
    colorAutoScheme = true;
  } else if (!document.documentElement.classList.contains("light-mode")) {
    if (!document.documentElement.classList.contains("dark-mode")) {
      colorAutoScheme = true;
    } else {
      colorScheme = "dark";
    }
  }

  if (colorAutoScheme) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      colorScheme = "dark";
    }
  }

  if (colorScheme === "light") {
    contrastVal = colorContrast(hexColor, "#ffffff");
    if (contrastVal < 1.5) {
      return "darkest";
    }
    if (contrastVal <= 2.5) {
      return "darker";
    }
    if (contrastVal <= 4.5) {
      return "dark";
    }
  } else {
    contrastVal = colorContrast(hexColor, "#181a1b");
    if (contrastVal < 1.5) {
      return "brightest";
    }
    if (contrastVal <= 2.5) {
      return "brighter";
    }
    if (contrastVal <= 4.5) {
      return "bright";
    }
  }
  return "";
}

export function flipTextColor(hexColor) {
  const contrastVal = 0;
  let hslColor = hexToHSL(hexColor);
  let hslVals = hslColor.split(",");
  let h = hslVals[0];
  let s = hslVals[1];
  let l = hslVals[2];

  let colorScheme = "light";
  let colorAutoScheme = false;
  if (document.documentElement.classList.length === 0) {
    colorAutoScheme = true;
  } else if (!document.documentElement.classList.contains("light-mode")) {
    if (!document.documentElement.classList.contains("dark-mode")) {
      colorAutoScheme = true;
    } else {
      colorScheme = "dark";
    }
  }

  if (colorAutoScheme) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      colorScheme = "dark";
    }
  }

  if (l > 70 && colorScheme === "light") {
    var difference = l - 70;
    hslColor = hslColor.replace(
      /[0-9.]+(?!.*[0-9])/,
      String(parseInt(hslColor.match(/[0-9.]+(?!.*[0-9])/) - difference, 10))
    );
  } else if (l < 30 && colorScheme === "dark") {
    var difference = 30 - l;
    hslColor = hslColor.replace(
      /[0-9.]+(?!.*[0-9])/,
      String(difference + parseInt(hslColor.match(/[0-9.]+(?!.*[0-9])/), 10))
    );
  }

  hslVals = hslColor.split(",");
  h = hslVals[0];
  s = hslVals[1];
  l = hslVals[2];
  return HSLToHex(h, s, l);
}

export function camelCase(string) {
  const subStrings = string.toLowerCase().split(" ");
  let result = "";

  for (let i = 0; i < subStrings.length; i++) {
    if (i == 0) result += subStrings[i];
    else
      result +=
        subStrings[i].charAt(0).toUpperCase() + subStrings[i].substring(1);
  }

  return result;
}

export function pascalCase(string) {
  const parts = string.split(" ");
  let res = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    res += part[0].toUpperCase() + part.slice(1, part.length);
  }

  return res;
}

export function replaceAll(string, from, to) {
  while (string.indexOf(from) != -1) string = string.replace(from, to);

  return string;
}

export function pad(value, amt, char) {
  while (value.length < amt) value = char + value;

  return value;
}

export function dateToHTMLString(date) {
  if (!date) return "";
  if (typeof date === "string") return date;

  date = new Date(date);

  let day = date.toLocaleDateString();
  let time = date.toTimeString();

  day = day.split("/");
  day = `${pad(day[2], 2, "0")}-${pad(day[0], 2, "0")}-${pad(day[1], 2, "0")}`;

  time = time.split(":");
  time = `${time[0]}:${time[1]}`;

  date = `${day}T${time}`;
  return date;
}

export async function verifyRecaptcha(action) {
  return new Promise((res, rej) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(
          process.env.REACT_APP_RECAPTCHA_KEY,
          { action }
        );
        await axios.post("/auth/verifyCaptcha", { token });
        res(token);
      } catch (e) {
        console.log(e);
        rej(e);
      }
    });
  });
}

export function setCaptchaVisible(visible) {
  const el = document.getElementsByClassName("grecaptcha-badge")[0];

  if (el) el.style.visibility = visible ? "visible" : "hidden";
}
