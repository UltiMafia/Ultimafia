
import { useTheme } from '@emotion/react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import Color from 'color';
import { UserContext } from 'Contexts';
import { useIsPhoneDevice } from 'hooks/useIsPhoneDevice';
import { useContext } from 'react';

const DEFAULT_MINIMUM_CONTRAST = 3.5; // WCAG 2.1
const CHROMA_BANDS = 10;

// Solves for the lowest (dark mode: highest) lightness at the given chroma band
// and hue that still meets `minimumContrast` against `target`.
// Binary search with 10 iterations — same search as before, one cell at a time.
function solveBandHue(target, darkMode, minimumContrast, chromaBand, hue) {
  const chroma = (chromaBand * 145) / CHROMA_BANDS;

  let low = 0, high = 100;
  let bestLightness = 0;
  for (let i = 0; i < 10; i++) {
    const mid = (low + high) / 2;
    const currentRatio = target.contrast(Color.lch(mid, chroma, hue));
    if (currentRatio >= minimumContrast) {
      bestLightness = mid;
      if (darkMode) {
        high = mid;
      }
      else {
        low = mid
      }
    } else {
      if (darkMode) {
        low = mid
      }
      else {
        high = mid;
      }
    }
  }

  return Color.lch(bestLightness, chroma, hue).hex();
}

// Returns a memoizing lookup rather than a precomputed table.
//
// This used to eagerly fill all (CHROMA_BANDS + 1) x 360 cells, which is 39,600
// Color.contrast() calls — ~150ms of synchronous main-thread work on every page
// load, landing right between "user data arrived" and "routes render". A page
// only ever asks for the handful of (band, hue) pairs it actually paints, so
// cells are now solved on first use and cached. Results are identical to the
// eager table; only when the work happens has changed.
export function generateContrastLookup(backgroundColor, minimumContrast = DEFAULT_MINIMUM_CONTRAST) {
  if (minimumContrast === 0) {
    return null;
  }

  const target = Color(backgroundColor);
  const darkMode = target.isDark();
  const cache = new Map();

  return {
    get(chromaBand, hue) {
      const key = chromaBand * 360 + hue;
      let hex = cache.get(key);
      if (hex === undefined) {
        hex = solveBandHue(target, darkMode, minimumContrast, chromaBand, hue);
        cache.set(key, hex);
      }
      return hex;
    },
  };
}

export function autoContrastColor(sourceColor, backgroundColor, contrastLookup, minimumContrast = DEFAULT_MINIMUM_CONTRAST) {
  if (!contrastLookup) {
    return sourceColor;
  }
  if (sourceColor == null || sourceColor === '') {
    return sourceColor ?? 'inherit';
  }
  let color;
  try {
    color = Color(sourceColor);
  } catch {
    return typeof sourceColor === 'string' ? sourceColor : 'inherit';
  }
  const target = Color(backgroundColor);
  const contrast = target.contrast(color);
  if (contrast >= minimumContrast) {
    return sourceColor;
  }
  else {
    const colorLch = color.lch().array();
    const chromaBand = Math.min(CHROMA_BANDS, Math.trunc(colorLch[1] / CHROMA_BANDS));
    const hue = Math.trunc(colorLch[2]);
    return contrastLookup.get(chromaBand, hue);
  }
}

const NUM_EXAMPLES = 12;

export function ContrastComparison() {
  const theme = useTheme();
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  const backgroundColor = Color(theme.palette.background.paper);
  const badContrastLightness = backgroundColor.isDark() ? 20 : 80;

  const hueStep = Math.trunc(360 / NUM_EXAMPLES);
  const hueExamples = Array.from(
    { length: NUM_EXAMPLES },
    (_, i) => i * hueStep
  ).map((hue => Color.lch(badContrastLightness, 70, hue).hex()));
  hueExamples.push(Color.lch(badContrastLightness, 0, 0).hex());

  const exampleSpacing = isPhoneDevice ? 0.5 : 1;

  return (
    <Stack spacing={0.5} sx={{
      alignItems: "center",
    }}>
      <Paper elevation={2} sx={{
        p: 1,
      }}>
        <Typography sx={{
          textAlign: "center",
        }}>
          Contrast before (upper) and after (lower)
        </Typography>
        <Stack direction="row" spacing={exampleSpacing}>
          {hueExamples.map((color) => (
            <Typography key={color} sx={{
              color: color,
            }}>
              aA
            </Typography>
          ))}
        </Stack>
        <Stack direction="row" spacing={exampleSpacing}>
          {hueExamples.map((color) => (
            <Typography key={color} sx={{
              color: user.autoContrastColor(color),
            }}>
              aA
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}