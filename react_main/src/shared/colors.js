// 100% copy-pasted from ./shared (backend) with courage
const Color = require("color");

// GPT magic here. It works well, tested with a few colors
const getLuminance = (color) => {
  const rgb = Color(color).rgb().array();
  return rgb.reduce((luminance, value, i) => {
    value /= 255;
    value =
      value < 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    return luminance + value * [0.2126, 0.7152, 0.0722][i];
  }, 0);
};

const getContrast = (color1, color2) => {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);

  const ratio =
    luminance1 > luminance2
      ? (luminance1 + 0.05) / (luminance2 + 0.05)
      : (luminance2 + 0.05) / (luminance1 + 0.05);

  return ratio;
};

export const colorHasGoodBackgroundContrast = (color, theme = "dark") => {
  const MIN_CONTRAST_RATIO = 3.0;
  const backgroundColorDark = "#121212";
  const backgroundColorLight = "#ffffff";

  const darkRatio = getContrast(color, backgroundColorDark);
  const lightRatio = getContrast(color, backgroundColorLight);

  if (theme === "light") {
    return lightRatio >= MIN_CONTRAST_RATIO;
  } else {
    return darkRatio >= MIN_CONTRAST_RATIO;
  }
};

export const colorHasGoodContrastForBothThemes = (color) => {
  const MIN_CONTRAST_RATIO = 3.0;
  const backgroundColorDark = "#121212";
  const backgroundColorLight = "#ffffff";

  const darkRatio = getContrast(color, backgroundColorDark);
  const lightRatio = getContrast(color, backgroundColorLight);

  return darkRatio >= MIN_CONTRAST_RATIO && lightRatio >= MIN_CONTRAST_RATIO;
};

export { getContrast, getLuminance };
