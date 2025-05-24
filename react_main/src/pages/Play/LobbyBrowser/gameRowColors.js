// Main is purposefully omitted from the lobby if statements because it can fall under either ranked or unranked

export function getRowColor(game, hover) {
    if (hover) {
        return "rgba(255, 255, 255, 0.05)"
    }
    else {
        if (game.competitive) {
            return "rgba(192, 192, 192, 0.15)";
        }
        else if (game.ranked) {
            return "rgba(255, 130, 169, 0.15)";
        }
        else if (game.lobby === "Games") { // minigames
            return "rgba(123, 237, 255, 0.15)";
        }
        else if (game.lobby === "Sandbox") {
            return "rgba(255, 213, 105, 0.15)";
        }
        else if (game.lobby === "Survivor") {
            return "rgba(92, 184, 92, 0.15)";
        }
        else {
            return "rgba(211, 211, 211, 0.15)";
        }
    }
}

export function getRowStubColor(game) {
    if (game.competitive) {
        return "gold";
    }
    else if (game.ranked) {
        return "#FF82A9";
    }
    else if (game.lobby === "Games") { // minigames
        return "#7BEDFF";
    }
    else if (game.lobby === "Sandbox") {
        return "#ffd569";
    }
    else if (game.lobby === "Survivor") {
        return "#5cb85c";
    }
    else {
        return "#d3d3d3";
    }
}