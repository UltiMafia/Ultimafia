// Evaluate only messages the server delivered to this game session. Membership
// comes from the server, not the URL, old spectator names, or a dead role.
function isSpectatorPing(content, isSpectator) {
  return isSpectator === true && typeof content === "string" &&
    /(?:^|[^\p{L}\p{N}_@-])@(?:cucksection|cucks|cuck)(?=$|[^\p{L}\p{N}_-])/iu.test(content);
}

module.exports = { isSpectatorPing };
