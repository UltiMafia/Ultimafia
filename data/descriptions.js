/**
 * Learn page copy for game modes. Block shape matches rule descriptions in violations.js:
 * { type: "paragraph", content?: string } or { type: "paragraph", parts: [...] };
 * { type: "subheading", content: string };
 * { type: "list", items: Array<string | { strong: string, text: string }> }.
 *
 * Paragraph parts (inline links): { type: "text", content }; { type: "link", href, label };
 * { type: "routerLink", to, label }.
 */

const learnGameDescriptions = [
  {
    gameType: "Mafia",
    description: [
      {
        type: "paragraph",
        content:
          "Mafia is a chat-based social deduction game created by Dimitry Davidoff. The Town includes both hidden Mafia and Village-aligned players. The Village wins by eliminating all Mafia; the Mafia wins by making up at least half of the living players.",
      },
      {
        type: "paragraph",
        content:
          "Play alternates between night and day. At night the Mafia secretly choose a player to kill. By day the Town meets to discuss and then vote on who to eliminate; the Village must find the Mafia while the Mafia try to blend in. Each player has a role with an alignment and possibly special abilities — check your role's description to see how you can help your side.",
      },
    ],
  },
  {
    gameType: "Resistance",
    description: [
      {
        type: "paragraph",
        parts: [
          { type: "text", content: "Based on the card game " },
          {
            type: "link",
            href: "https://www.boardgamegeek.com/boardgame/41114/resistance",
            label: "The Resistance",
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
  },
  {
    gameType: "Jotto",
    description: [
      {
        type: "paragraph",
        content:
          "Jotto is a logic-oriented word game where each player has a secret word of the same length. On your turn you guess a word and receive feedback on how many letters match your opponent's word. Use that information to narrow down possibilities; the first player to correctly identify the opponent's word wins.",
      },
    ],
  },
  {
    gameType: "Acrotopia",
    description: [
      {
        type: "paragraph",
        content:
          "Acrotopia is a social word game wherein players are given an acronym and tasked to create a backronym based on it! All players then vote for their favorites, with the winners of each round getting points. The person with the most points at the end of the game is declared the winner!",
      },
    ],
  },
  {
    gameType: "Secret Dictator",
    description: [
      {
        type: "paragraph",
        parts: [
          { type: "text", content: "Based on the card game " },
          {
            type: "link",
            href: "https://secrethitler.com",
            label: "Secret Hitler",
          },
          { type: "text", content: " by Goat, Wolf, & Cabbage." },
        ],
      },
      {
        type: "paragraph",
        content:
          "In Secret Dictator, players are politicians attempting to hold a fragile Liberal government together and stem the rising tide of Fascism. Watch out though — there are secret Fascists among you, and one player is Secret Dictator.",
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
  },
  {
    gameType: "Wacky Words",
    description: [
      {
        type: "paragraph",
        content:
          "Wacky Words is a social word game where players answer prompts (or riff on prompts and answers depending on mode), vote for favorites, and score points across rounds — whoever has the most points at the end wins. Lobby settings pick which mode everyone plays:",
      },
      {
        type: "list",
        items: [
          {
            strong: "Reverse Mode",
            text: " — Instead of a prompt leading to an answer, players first invent answers together, then invent funny prompts that could have produced those answers.",
          },
          {
            strong: "Wacky People",
            text: " — Players answer questions about themselves, then everyone else submits decoy answers too. Afterwards, players guess the real answers. Guessing correctly scores 2 points; fooling someone into guessing your fake scores 1; the genuine answer scores 2 when others pick it.",
          },
          {
            strong: "Acrotopia mode",
            text: " — Everyone gets the same acronym and writes a backronym; voting awards points each round.",
          },
          {
            strong: "Wacky Decisions",
            text: " — One player authors a Would You Rather each round while others vote; scoring rewards splits close to a 50/50 vote.",
          },
        ],
      },
    ],
  },
  {
    gameType: "Draw It",
    description: [
      {
        type: "paragraph",
        content:
          "Draw It is a turn-based draw-and-guess minigame for 3–12 players. Each turn, one player picks a word from the chosen deck and draws it on a shared canvas while everyone else types guesses in chat. Speed-tier scoring rewards quick guessers, and the drawer earns the average of their guessers' scores — so the clearer you draw, the better.",
      },
      {
        type: "paragraph",
        content:
          "Once you guess the word, your subsequent messages stay in the main chat but are only visible to the drawer and other correct guessers — so you can chat freely without spoiling the answer for the players still guessing.",
      },
    ],
  },
  {
    gameType: "Liars Dice",
    description: [
      {
        type: "paragraph",
        content:
          "Liar's Dice is a social dice game. Each player has dice only they can see. On your turn you bid how many of a chosen face exist across all players' dice; the next player may raise the bid or call the previous bid a lie. If a call is wrong, the caller loses a die; if it is right, the bidder loses one. Players who run out of dice are eliminated, and the last player left wins.",
      },
      {
        type: "paragraph",
        content:
          "Hosts may turn on Spot On: on your turn you can call Spot On meaning the previous player guessed the exact amount of the chosen dice. Called correctly — everyone except the caller loses a die; called wrongly — only the caller loses a die. Spot On can't be used on the first turn of each round. Wild Ones makes ones count toward any dice amount. Starting Dice sets how many dice each player begins with — default five.",
      },
    ],
  },
  {
    gameType: "Texas Hold Em",
    description: [
      {
        type: "paragraph",
        content:
          "Also known as Poker. Texas Hold'em is a social card game wherein all players are given two cards and chips to bet with. Players will place bets as community cards are revealed. The player who creates the best hand using the community cards and the two cards they were given wins the bets. Players who are unable to make the minimum bet at the start of round die.",
      },
    ],
  },
  {
    gameType: "Cheat",
    description: [
      {
        type: "paragraph",
        content:
          "Cheat is a social card game wherein players will try to get to 0 cards. Each round players will be given a card type to play. They may play that card type or lie and play a diffrent card type. After they play their cards other players may call them out for lying. Players who called out for lying or incorrectly call out for lying must add all played cards to their hand.",
      },
    ],
  },
  {
    gameType: "Ratscrew",
    description: [
      { type: "subheading", content: "Goal" },
      { type: "paragraph", content: "Be the last player with cards." },
      { type: "subheading", content: "How a turn works" },
      {
        type: "paragraph",
        content:
          "On your turn, play the top card from your deck onto the pile. Then it's the next player's turn.",
      },
      { type: "subheading", content: "Slapping" },
      {
        type: "paragraph",
        content:
          "You can slap at any time — even when it isn't your turn. A slap is valid when the top card matches:",
      },
      {
        type: "list",
        items: [
          { strong: "Doubles", text: " — the card directly under it" },
          { strong: "Sandwich", text: " — the card two below it" },
          {
            strong: "Top & bottom",
            text: " — the bottom card of the pile",
          },
        ],
      },
      {
        type: "paragraph",
        content:
          "Valid slap: take the entire pile and play next. Wrong slap: you burn one card from your hand face-down into the middle of the pile (it won't count for any combo).",
      },
      { type: "subheading", content: "Optional rules (host-configurable)" },
      {
        type: "list",
        items: [
          {
            strong: "Sum to 10",
            text: " — slap when the top card and the previous card add up to 10",
          },
          {
            strong: "Marriage",
            text: " — slap when a King and Queen are adjacent",
          },
        ],
      },
      { type: "subheading", content: "Face cards (J, Q, K, A)" },
      {
        type: "paragraph",
        content:
          "Playing a face card challenges the next player to play another face card within a set number of attempts:",
      },
      {
        type: "list",
        items: [
          { strong: "Jack", text: " — 1 attempt" },
          { strong: "Queen", text: " — 2 attempts" },
          { strong: "King", text: " — 3 attempts" },
          { strong: "Ace", text: " — 4 attempts" },
        ],
      },
      {
        type: "paragraph",
        content:
          "Hit a face card in time → the challenge passes to the next player with a new count. Run out of attempts → the original face-card player takes the pile. A valid slap interrupts the challenge at any time.",
      },
    ],
  },
  {
    gameType: "Spot It",
    description: [
      {
        type: "paragraph",
        content:
          "Spot It is a fast-paced visual matching game. Every player is dealt a card filled with symbols, and a center card is placed for all to see. Each card shares exactly one matching symbol with the center card. Be the first to spot the matching symbol between your card and the center card and click it to claim the point. The player with the most points when the deck runs out wins!",
      },
    ],
  },
  {
    gameType: "Battlesnakes",
    description: [
      {
        type: "paragraph",
        content:
          "Battlesnakes is a competitive game where each player controls a snake on a shared grid. Snakes move each turn and grow by eating food; they are eliminated if they hit a wall, another snake, or their own body. The last snake left alive wins.",
      },
    ],
  },
  {
    gameType: "Dice Wars",
    description: [
      {
        type: "paragraph",
        content:
          "Dice Wars is a turn-based strategy game where players fight to conquer a map of territories. Each territory holds a stack of dice.",
      },
      {
        type: "paragraph",
        content:
          "To attack, click one of your territories that has two or more dice, then choose an adjacent enemy territory. Both sides roll all dice on those territories and sum the results — higher total wins ties going to the defender. If your attack succeeds, you capture the territory and move your dice forward while leaving one die behind at the attacking territory; if defense wins, your territory keeps only one die.",
      },
      {
        type: "paragraph",
        content:
          "End your turn to receive reinforcement dice equal to your largest contiguous group of territories. Those dice spill randomly onto your holdings, so chaining territory clusters is crucial for accelerating your army.",
      },
      {
        type: "paragraph",
        content:
          "Lose every territory and you are eliminated from the board. Fight until you're the sole owner of the map.",
      },
    ],
  },
  {
    gameType: "Connect Four",
    description: [
      {
        type: "paragraph",
        parts: [
          { type: "text", content: "Based on the board game " },
          {
            type: "link",
            href: "https://boardgamegeek.com/boardgame/2719/connect-four",
            label: "Connect Four",
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
  },
];

const learnGameDescriptionByType = learnGameDescriptions.reduce(
  (acc, entry) => {
    acc[entry.gameType] = entry.description;
    return acc;
  },
  {}
);

module.exports = {
  learnGameDescriptions,
  learnGameDescriptionByType,
};
