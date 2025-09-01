// Main is purposefully omitted from the lobby if statements because it can fall under either ranked or unranked

export function getRowColor(game, hover) {
  if (hover) {
    return "rgba(255, 255, 255, 0.05)";
  } else {
    if (game.competitive) {
      return "rgba(12, 12, 12, 0.6)";
    } else if (game.ranked) {
      return "rgba(255, 130, 169, 0.15)";
    } else if (game.lobby === "Games") {
      // minigames
      return "rgba(123, 237, 255, 0.15)";
    } else if (game.lobby === "Sandbox") {
      return "rgba(255, 242, 117, 0.15)";
    } else if (game.lobby === "Survivor") {
      return "rgba(92, 184, 92, 0.15)";
    } else if (game.lobby === "Roleplay") {
      return "rgba(115, 92, 183, 0.15)";
    } else {
      return "rgba(211, 211, 211, 0.15)";
    }
  }
}

export function getRowStubColor(game) {
  if (game.competitive) {
    return "gold";
  } else if (game.ranked) {
    return "#FF82A9";
  } else if (game.lobby === "Games") {
    // minigames
    return "#7BEDFF";
  } else if (game.lobby === "Sandbox") {
    return "#FFF275";
  } else if (game.lobby === "Survivor") {
    return "#5cb85c";
  } else if (game.lobby === "Roleplay") {
    return "#735cb7";
  } else {
    return "#d3d3d3";
  }
}

export function getSetupBackgroundColor(game, hasTransparency) {
  const alpha = ".4";
  if (game.competitive) {
    return `rgba(0, 0, 0, ${alpha})`;
  } else if (game.ranked) {
    return `rgba(255, 130, 169, ${alpha})`;
  } else if (game.lobby === "Games") {
    // minigames
    return `rgba(123, 237, 255, ${alpha})`;
  } else if (game.lobby === "Sandbox") {
    return `rgba(255, 242, 117, ${alpha})`;
  } else if (game.lobby === "Survivor") {
    return `rgba(92, 184, 92, ${alpha})`;
  } else if (game.lobby === "Roleplay") {
    return `rgba(115, 92, 183, ${alpha})`;
  } else if (game.lobby === "Main") {
    return `rgba(102, 102, 102, ${alpha})`;
  } else {
    return undefined; // allow MUI theme to select color
  }
}
