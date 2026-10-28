// Lobby names: the default a host gets when they leave the name blank, and
// whether a name is custom. A rehost keeps a custom name and gives a default
// one to the new host ("<rehoster>'s lobby").

function defaultLobbyName(hostName) {
  return `${hostName}'s lobby`;
}

function sameName(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

// What the host typed. Blank (or the "undefined" an old client could send)
// is not custom, and neither is typing the default for yourself.
function isCustomLobbyName(name, hostName) {
  if (name == null) return false;
  name = String(name);
  if (name.trim() === "" || name === "undefined") return false;
  if (hostName != null && sameName(name, defaultLobbyName(hostName)))
    return false;
  return true;
}

// For a game being rehosted. Games record lobbyNameCustom when they are
// created. Older games did not, so fall back to comparing the name with the
// default for the people who could have hosted it (the original host, or
// anyone in the game when the host is unknown). A custom name that merely
// contains "'s lobby" stays custom.
function rehostLobbyNameIsCustom({ lobbyName, lobbyNameCustom, hostNames }) {
  if (lobbyName == null || String(lobbyName).trim() === "") return false;
  if (typeof lobbyNameCustom === "boolean") return lobbyNameCustom;
  return !(hostNames || []).some(
    (n) => n != null && sameName(lobbyName, defaultLobbyName(n)),
  );
}

module.exports = {
  defaultLobbyName,
  isCustomLobbyName,
  rehostLobbyNameIsCustom,
};
