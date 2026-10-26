const chai = require("chai"),
  should = chai.should();
const {
  lobbyCountFromInfo,
  displayedLobbyCount,
  lobbyBarValue,
} = require("../react_main/src/shared/lobbyCount");

// The lobby card count (PlayerCount) takes the live count from the game info
// popover, so it no longer shows a number one list refresh old next to a
// popover that lists fewer players.
describe("Lobby card player count", function () {
  it("counts the players in a live /info response for an open game", function () {
    lobbyCountFromInfo({
      status: "Open",
      players: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }],
    }).should.equal(4);
    lobbyCountFromInfo({ status: "Open", players: [] }).should.equal(0);
  });

  it("ignores finished games, errors and malformed responses", function () {
    should.equal(lobbyCountFromInfo({ status: "Finished", players: [1] }), null);
    should.equal(lobbyCountFromInfo("Game not found"), null);
    should.equal(lobbyCountFromInfo(null), null);
    should.equal(lobbyCountFromInfo({ status: "Open" }), null);
  });

  it("ignores a finished game's /info, which has no status field", function () {
    // Finished games come from Mongo without a status; their players list
    // used to fill the grey "Xh ago" box blue once the popover opened.
    should.equal(
      lobbyCountFromInfo({ players: [1, 2, 3, 4, 5, 6, 7], endTime: 1 }),
      null
    );
    displayedLobbyCount(0, null).should.equal(0);
  });

  it("draws the bar for open and in-progress games only", function () {
    lobbyBarValue("Open", 3).should.equal(3);
    lobbyBarValue("In Progress", 7).should.equal(7);
    lobbyBarValue("Finished", 7).should.equal(0);
    lobbyBarValue(undefined, 7).should.equal(0);
    lobbyBarValue("Open", undefined).should.equal(0);
  });

  it("shows the live count over the list row it was fetched for (6/7 card, 4 in the popover)", function () {
    displayedLobbyCount(6, { count: 4, listCount: 6 }).should.equal(4);
  });

  it("lets the next list refresh take over again", function () {
    displayedLobbyCount(5, { count: 4, listCount: 6 }).should.equal(5);
    displayedLobbyCount(3, null).should.equal(3);
    displayedLobbyCount(undefined, null).should.equal(0);
  });
});
