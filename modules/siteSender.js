// A chat sender that is the site itself, not a user account. Ban appeals are
// posted into the admins' group DM under this sender, so the banned user does
// not have to be a member of the channel. Its id can't collide with a user id:
// user ids come from shortid and never contain a colon.
const SITE_SENDER_ID = "site:ban-appeals";

const SITE_SENDER_INFO = {
  id: SITE_SENDER_ID,
  name: "Ban Appeals",
  avatar: false,
  status: "offline",
  groups: [],
  settings: {},
};

function isSiteSender(senderId) {
  return senderId === SITE_SENDER_ID;
}

module.exports = { SITE_SENDER_ID, SITE_SENDER_INFO, isSiteSender };
