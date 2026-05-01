/**
 * Learn page copy for each game type. Block format matches data/violations.js
 * (paragraph + list). Optional "parts" on a paragraph supports inline links.
 */

const learnGameDescriptions = {
  Mafia: [
    {
      type: "paragraph",
      content:
        "Mafia is a chat-based social deduction game created by Dimitry Davidoff. The Town includes both hidden Mafia and Village-aligned players. The Village wins by eliminating all Mafia; the Mafia wins by making up at least half of the living players.",
    },
    {
      type: "paragraph",
      content:
        "Play alternates between night and day. At night the Mafia secretly choose a player to kill. By day the Town meets to discuss and then vote on who to eliminate; the Village must find the Mafia while the Mafia try to blend in. Each player has a role with an alignment and possibly special abilities—check your role’s description to see how you can help your side.",
    },
  ],
  Resistance: [
    {
      type: "paragraph",
      parts: [
        { type: "text", content: "Based on the card game " },
        {
          type: "link",
          content: "The Resistance",
          href: "https://www.boardgamegeek.com/boardgame/41114/resistance",
        },
        { type: "text", content: " by Don Eskridge." },
      ],
    },
    {
      type: "paragraph",
      content:
        "In Resistance, a group of rebels is trying to overthrow the government by completing a series of missions. However, the government has caught word of the plan and has recruited spies to infiltrate the resistance and sabotage the missions.",
    },
    {
      type: "paragraph",
      content:
        "At the beginning of each mission a player is selected as the leader and must recruit several group members to the team. All players vote on the selected team and if the majority approve then the mission will proceed. Otherwise, a new leader is chosen to make a new team. If several leaders are unable to form a team then that mission automatically fails.",
    },
    {
      type: "paragraph",
      content:
        "During a mission the members of the teams who are spies can choose to either make the mission succeed or fail. If at least one team member opts for it to fail then the entire mission will fail, otherwise it will succeed. The game continues until a certain number of missions succeed or fail, with the Resistance and the Spies winning respectively.",
    },
  ],
  Jotto: [
    {
      type: "paragraph",
      content:
        "Jotto is a logic-oriented word game where each player has a secret word of the same length. On your turn you guess a word and receive feedback on how many letters match your opponent’s word. Use that information to narrow down possibilities; the first player to correctly identify the opponent’s word wins.",
    },
  ],
  Acrotopia: [
    {
      type: "paragraph",
      content:
        "Acrotopia is a social word game wherein players are given an acronym and tasked to create a backronym based on it! All players then vote for their favorites, with the winners of each round getting points. The person with the most points at the end of the game is declared the winner!",
    },
  ],
  "Secret Dictator": [
    {
      type: "paragraph",
      parts: [
        { type: "text", content: "Based on the card game " },
        {
          type: "link",
          content: "Secret Hitler",
          href: "https://secrethitler.com",
        },
        { type: "text", content: " by Goat, Wolf, & Cabbage." },
      ],
    },
    {
      type: "paragraph",
      content:
        "In Secret Dictator, players are politicians attempting to hold a fragile Liberal government together and stem the rising tide of Fascism. Watch out though—there are secret Fascists among you, and one player is Secret Dictator.",
    },
    {
      type: "paragraph",
      content:
        "At the beginning of the game, each player is secretly assigned to one of three roles: Liberal, Fascist, or the Dictator. The Liberals have a majority, but they don't know for sure who anyone is; Fascists must resort to secrecy and sabotage to accomplish their goals. The Dictator plays for the Fascist team, and the Fascists know the Dictator's identity from the outset, but most of the time, the Dictator doesn't know the Fascists and must work to figure them out.",
    },
    {
      type: "paragraph",
      content:
        "The Liberals win by enacting five Liberal Policies or killing the Dictator. The Fascists win by enacting six Fascist Policies, or if the Dictator is elected Chancellor after three Fascist Policies have been enacted.",
    },
    {
      type: "paragraph",
      content:
        "Whenever a Fascist Policy is enacted, the government becomes more powerful, and the President is granted a single-use power which must be used before the next round can begin. It doesn't matter what team the President is on; in fact, even Liberal players might be tempted to enact a Fascist Policy to gain new powers.",
    },
  ],
  "Wacky Words": [
    {
      type: "paragraph",
      content:
        "Wacky Words is a social word game wherein all players are given a prompt and tasked to answer it! All players then vote for their favorites, with the winners of each round getting points. The person with the most points at the end of the game is declared the winner!",
    },
  ],
  "Liars Dice": [
    {
      type: "paragraph",
      content:
        "Liar's Dice is a social dice game. Each player has dice only they can see. On your turn you bid how many of a chosen face exist across all players’ dice; the next player may raise the bid or call the previous bid a lie. If a call is wrong, the caller loses a die; if it is right, the bidder loses one. Players who run out of dice are eliminated, and the last player left wins.",
    },
    {
      type: "paragraph",
      content:
        "Hosts can enable Spot On: on your turn you may claim the previous bid was exactly right; if you are correct everyone else loses a die, if wrong only you lose one (never on the first turn of a round). With Wild Ones, ones count toward any bid face. Players start with as many dice as the host configures (typically five).",
    },
  ],
  "Texas Hold Em": [
    {
      type: "paragraph",
      content:
        "Also known as Poker. Texas Hold'em is a social card game wherein all players are given two cards and chips to bet with. Players will place bets as community cards are revealed. The player who creates the best hand using the community cards and the two cards they were given wins the bets. Players who are unable to make the minimum bet at the start of round are eliminated.",
    },
  ],
  Cheat: [
    {
      type: "paragraph",
      content:
        "Cheat is a social card game wherein players will try to get to 0 cards. Each round players will be given a card type to play. They may play that card type or lie and play a different card type. After they play their cards other players may call them out for lying. Players who are caught lying or who incorrectly call out another player must add all played cards to their hand.",
    },
  ],
  "Spot It": [
    {
      type: "paragraph",
      content:
        "Spot It is a fast-paced visual matching game. Every player is dealt a card filled with symbols, and a center card is placed for all to see. Each card shares exactly one matching symbol with the center card. Be the first to spot the matching symbol between your card and the center card and click it to claim the point. The player with the most points when the deck runs out wins!",
    },
  ],
  Ratscrew: [
    {
      type: "heading",
      content: "Goal",
    },
    {
      type: "paragraph",
      content: "Be the last player with cards.",
    },
    {
      type: "heading",
      content: "How a turn works",
    },
    {
      type: "paragraph",
      content:
        "On your turn, play the top card from your deck onto the pile. Then it's the next player's turn.",
    },
    {
      type: "heading",
      content: "Slapping",
    },
    {
      type: "paragraph",
      content:
        "You can slap at any time — even when it isn't your turn. A slap is valid when the top card matches:",
    },
    {
      type: "list",
      items: [
        "Doubles — the card directly under it",
        "Sandwich — the card two below it",
        "Top & bottom — the bottom card of the pile",
      ],
    },
    {
      type: "paragraph",
      content:
        "Valid slap: take the entire pile and play next. Wrong slap: you burn one card from your hand face-down into the middle of the pile (it won't count for any combo).",
    },
    {
      type: "heading",
      content: "Optional rules (host-configurable)",
    },
    {
      type: "list",
      items: [
        "Sum to 10 — slap when the top card and the previous card add up to 10",
        "Marriage — slap when a King and Queen are adjacent",
      ],
    },
    {
      type: "heading",
      content: "Face cards (J, Q, K, A)",
    },
    {
      type: "paragraph",
      content:
        "Playing a face card challenges the next player to play another face card within a set number of attempts:",
    },
    {
      type: "list",
      items: [
        "Jack — 1 attempt",
        "Queen — 2 attempts",
        "King — 3 attempts",
        "Ace — 4 attempts",
      ],
    },
    {
      type: "paragraph",
      content:
        "Hit a face card in time → the challenge passes to the next player with a new count. Run out of attempts → the original face-card player takes the pile. A valid slap interrupts the challenge at any time.",
    },
  ],
  Battlesnakes: [
    {
      type: "paragraph",
      content:
        "Battlesnakes is a competitive game where each player controls a snake on a shared grid. Snakes move each turn and grow by eating food; they are eliminated if they hit a wall, another snake, or their own body. The last snake left alive wins.",
    },
  ],
  "Dice Wars": [
    {
      type: "paragraph",
      content:
        "Dice Wars is a turn-based strategy game where players fight to conquer a map of territories. Each territory holds a stack of dice. On your turn, attack neighboring enemy territories by rolling all dice on both sides and comparing totals — higher total wins the fight.",
    },
    {
      type: "paragraph",
      content:
        "To attack, click one of your territories that has at least two dice, then click an adjacent enemy territory. If your total is higher, you conquer the territory and move dice in (leaving one behind). If the defender ties or beats you, the attack fails and you are left with just one die on the territory you attacked from.",
    },
    {
      type: "paragraph",
      content:
        "When you end your turn, you receive bonus dice equal to the size of your largest connected group of territories; those dice are placed randomly across your lands. Keeping your territories connected is the key to growing stronger. A player who loses every territory is eliminated. The last player with any territory on the board wins.",
    },
  ],
  "Connect Four": [
    {
      type: "paragraph",
      parts: [
        { type: "text", content: "Based on the board game " },
        {
          type: "link",
          content: "Connect Four",
          href: "https://boardgamegeek.com/boardgame/2719/connect-four",
        },
        { type: "text", content: " invented by David Bowie." },
      ],
    },
    {
      type: "paragraph",
      content:
        "Connect Four is a social board game played on a vertical grid. Players take turns dropping discs into columns; each disc falls to the lowest open space. The first player to get four of their discs in a horizontal or vertical row wins.",
    },
  ],
};

function getLearnGameDescription(gameType) {
  return learnGameDescriptions[gameType] || [];
}

module.exports = {
  learnGameDescriptions,
  getLearnGameDescription,
};
