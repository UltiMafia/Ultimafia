// Registry of tutorial storylines. To add one, create a file exporting
// { id, title, blurb, userSeat, available, intro, states, epilogue } and list
// it here. Seats are keys of TutorialController.CAST.
const list = [
  require("./cop"),
  require("./journalist"),
  require("./lawyer"),
  require("./janitor"),
  require("./sheriff"),
];

const byId = Object.fromEntries(list.map((s) => [s.id, s]));

module.exports = {
  list,
  get: (id) => byId[String(id)],
  // What the client shows on the picker.
  summary: () =>
    list.map((s) => ({
      id: s.id,
      title: s.title,
      blurb: s.blurb,
      role: s.roleName,
      available: !!s.available,
    })),
};
