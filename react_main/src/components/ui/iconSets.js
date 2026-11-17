import { pixelIcons } from "./pixelIcons.js";
import hackerNoonArtwork, { iconSources, solidIconSources } from "./hackernoon/icons.js";

export const uiIconSets = {
  pixelarticons: {
    label: "Pixelarticons", grid: 24,
    icons: Object.fromEntries(Object.entries(pixelIcons).map(([name, icon]) => [name, {
      source: icon.source,
      elements: icon.paths.map(path => ({ type: "path", attrs: { ...path }, children: [] })),
    }])),
  },
  hackernoon: {
    label: "HackerNoon Pixel Icon Library", grid: 24,
    icons: Object.fromEntries(Object.entries(iconSources).map(([name, source]) => [name, { source, elements: hackerNoonArtwork[source] }])),
  },
  "hackernoon-solid": {
    label: "HackerNoon Pixel Icon Library · solid", grid: 24,
    icons: Object.fromEntries(Object.entries(solidIconSources).map(([name, source]) => [name, { source, elements: hackerNoonArtwork[source] }])),
  },
};
