/**
 * Kicks-phase reminders: who to nudge when a game's timer runs out, what to
 * send them, and the marker that stops the same player being told twice for the
 * same kicks window.
 *
 * Kept out of Game so the recipient rule is one testable function. It is
 * deliberately not `Player.hasVotedInAllMeetings()`: that answers "who may kick
 * someone", which is a different (and looser) question than "who loses the game
 * if nobody kicks". Here the rule is the one `Meeting.finish()` uses to veg
 * people -- a live, voting, non-noVeg meeting the player can still act in.
 */

const pushNotifications = require("../../modules/pushNotifications");
const { accountIdOf } = require("../../modules/heartRefund");
const logger = require("../../modules/logging")("games");

const KIND = "kicks-reminder";

/**
 * Whether this player has given the meeting everything it needs, in the same
 * sense `Meeting.finish()` uses before vegging people.
 */
function votedEnough(meeting, player) {
  if (!meeting.multi) return meeting.votes[player.id] != null;

  // A multi-select action needs `multiMin` picks; a partial selection is vegged
  // too, so it is still an incomplete action. "*" is an explicit "no one" and
  // is never vegged.
  const vote = meeting.votes[player.id];
  const picks = vote == null ? [] : [].concat(vote);
  if (picks.indexOf("*") !== -1) return true;

  return picks.length >= (meeting.multiMin || 0);
}

/**
 * One meeting still waiting on this player, in the sense that finishing the
 * meeting would veg them for it.
 */
function meetingNeedsAction(meeting, player) {
  if (!meeting || meeting.finished) return false;
  if (!meeting.voting || meeting.noVeg) return false;

  const member = meeting.members[player.id];
  if (!member) return false;
  // A player who cannot vote (or cannot change a vote) is not vegged by this
  // meeting, so there is nothing to remind them about.
  if (!member.canVote || !member.canUpdateVote) return false;

  return !votedEnough(meeting, player);
}

/**
 * True when the game entering kicks means this player is at risk of being
 * vegged: alive, still in the game, a real account, in a game that vegs at all,
 * with at least one meeting outstanding.
 */
function needsAction(player, game) {
  if (!player || !player.alive || player.left) return false;
  if (player.isBot) return false;
  // Guests have no account to notify and no stats to damage.
  // Anonymous seats retain the real account only in originalProfile; resolve
  // that server-side identity without restoring it on the public user object.
  if (!player.user || player.user.guestId || !accountIdOf(player)) return false;
  // noVeg games never veg anyone, so kicks there are cosmetic.
  if (game.isNoVeg && game.isNoVeg()) return false;

  const meetings = player.getMeetings ? player.getMeetings() : [];
  return meetings.some((meeting) => meetingNeedsAction(meeting, player));
}

function recipients(game) {
  return (game.players || []).filter((player) => needsAction(player, game));
}

/**
 * One marker per player per game per kicks window. The state index is in the
 * key so the same player can be reminded again in a later state, and the game
 * id is in it so two games never share a marker.
 */
function dedupeKey(game, player) {
  return `${game.id}:${game.currentState}:${accountIdOf(player)}:kicks`;
}

/**
 * Recipients to remind now, recording each one's marker in `alreadySent` so a
 * retry, a second trigger, or re-entering checkVeg in the same kicks window
 * returns nobody. Markers are recorded *before* sending: a partial failure is
 * logged, never retried into a duplicate.
 */
function claim(game, alreadySent) {
  const claimed = [];

  for (const player of recipients(game)) {
    const key = dedupeKey(game, player);
    if (alreadySent && alreadySent.has(key)) continue;

    if (alreadySent) alreadySent.add(key);
    claimed.push(player);
  }

  return claimed;
}

/**
 * Payload contract v1 (see the push audit): `kind` is the discriminator the
 * service worker switches on, `tag` collapses to one live notification per game
 * so several games cannot stack up, and `url` is the player's action view.
 *
 * Copy does not promise a specific kicker: nobody is kicked automatically, other
 * players vote inside the kicks window.
 */
function payload(game) {
  return {
    kind: KIND,
    gameId: game.id,
    title: "Your game is in kicks",
    body: "You have not taken your action this phase. Do it now or you may be vegged.",
    tag: `game-${game.id}`,
    url: `${process.env.BASE_URL || ""}/game/${game.id}`,
    state: game.currentState,
    timestamp: Date.now(),
  };
}

/**
 * Claim this kicks window's recipients and push them the reminder.
 *
 * Fire-and-forget by contract: it never rejects and never throws, because by the
 * time it runs the game has already moved into kicks and a push failing must not
 * undo that. Resolves to the delivery report, or null when nobody needed telling
 * (or the send path itself failed).
 */
async function notify(game, alreadySent) {
  try {
    const claimed = claim(game, alreadySent);
    if (claimed.length === 0) return null;

    const reminder = payload(game);
    const report = await pushNotifications.notifyUsersWithReport(
      claimed.map(accountIdOf),
      reminder
    );

    logger.info(
      JSON.stringify({
        event: "kicks-push",
        gameId: game.id,
        gameType: game.type,
        state: reminder.state,
        recipients: report.recipients,
        reached: report.reached,
        targets: report.targets,
        sent: report.sent,
        failed: report.failed,
        pruned: report.pruned,
      })
    );

    return report;
  } catch (e) {
    logger.error(e);
    return null;
  }
}

module.exports = {
  KIND,
  meetingNeedsAction,
  needsAction,
  recipients,
  dedupeKey,
  claim,
  payload,
  notify,
  // exported for tests
  votedEnough,
};
