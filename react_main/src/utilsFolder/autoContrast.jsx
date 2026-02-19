
import { useTheme } from '@emotion/react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import Color from 'color';
import { UserContext } from 'Contexts';
import { useIsPhoneDevice } from 'hooks/useIsPhoneDevice';
import { useContext } from 'react';

const DEFAULT_MINIMUM_CONTRAST = 3.5; // WCAG 2.1
const CHROMA_BANDS = 10;

export function generateContrastLookup(backgroundColor, minimumContrast = DEFAULT_MINIMUM_CONTRAST) {
  const target = Color(backgroundColor);
  const darkMode = target.isDark();

  if (minimumContrast === 0) { 
    return null;
  }

  let contrastLookup = {};
  for (let c = 0; c < CHROMA_BANDS + 1; c++) {
    contrastLookup[c] = {};
    const chroma = c * 145 / CHROMA_BANDS;

    for (let h = 0; h < 360; h++) {
      // Binary search with 10 iterations for the lowest lightness that meets contrast
      let low = 0, high = 100;
      let bestLightness = 0;
      for (let i = 0; i < 10; i++) {
        const mid = (low + high) / 2;
        const currentRatio = target.contrast(Color.lch(mid, chroma, h));
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

      contrastLookup[c][h] = Color.lch(bestLightness, chroma, h).hex();
    }
  }

  return contrastLookup;
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
    return contrastLookup[chromaBand][hue];
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