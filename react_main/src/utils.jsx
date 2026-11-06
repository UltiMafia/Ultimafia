import React from "react";
import axios from "axios";

export function hyphenDelimit(roleName) {
  roleName = roleName.slice();

  for (let i = 0; i < roleName.length; i++) {
    if (roleName[i] === " ") roleName = roleName.replace(" ", "-");
  }

  return roleName;
}

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.substring(1);
}

export function camelCase(string) {
  let subStrings = string.toLowerCase().split(" ");
  let result = "";

  for (let i = 0; i < subStrings.length; i++) {
    if (i === 0) result += subStrings[i];
    else
      result +=
        subStrings[i].charAt(0).toUpperCase() + subStrings[i].substring(1);
  }

  return result;
}

export function pascalCase(string) {
  var parts = string.split(" ");
  var res = "";

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    res += part[0].toUpperCase() + part.slice(1, part.length);
  }

  return res;
}

export function replaceAll(string, from, to) {
  while (string.indexOf(from) !== -1) string = string.replace(from, to);

  return string;
}

export function pad(value, amt, char) {
  while (value.length < amt) value = char + value;

  return value;
}

export function dateToHTMLString(date) {
  if (!date) return "";
  else if (typeof date == "string") return date;

  date = new Date(date);

  var day = date.toLocaleDateString();
  var time = date.toTimeString();

  day = day.split("/");
  day =
    pad(day[2], 2, "0") + "-" + pad(day[0], 2, "0") + "-" + pad(day[1], 2, "0");

  time = time.split(":");
  time = time[0] + ":" + time[1];

  date = day + "T" + time;
  return date;
}

export async function verifyRecaptcha(action) {
  return;
  return new Promise((res, rej) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(
          import.meta.env.REACT_APP_RECAPTCHA_KEY,
          { action }
        );
        await axios.post("/api/auth/verifyCaptcha", { token });
        res(token);
      } catch (e) {
        rej(e);
      }
    });
  });
}

export function setCaptchaVisible(visible) {
  var el = document.getElementsByClassName("grecaptcha-badge")[0];

  if (el) el.style.visibility = visible ? "visible" : "hidden";
}

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnlyString(value) {
  return typeof value === "string" && ISO_DATE_ONLY_REGEX.test(value);
}

export function normalizeBirthday(value) {
  if (value == null || value === "" || value === 0 || value === "0") {
    return undefined;
  }

  if (isDateOnlyString(value)) {
    return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatBirthdayForInput(value) {
  return normalizeBirthday(value) || "";
}

export function formatUTCDateOnly(value) {
  if (!value) return "";

  if (isDateOnlyString(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
      undefined,
      { timeZone: "UTC" }
    );
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, { timeZone: "UTC" });
}

export function formatUTCDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString(undefined, { timeZone: "UTC" })} ${date.toLocaleTimeString(undefined, { timeZone: "UTC" })} UTC`;
}
