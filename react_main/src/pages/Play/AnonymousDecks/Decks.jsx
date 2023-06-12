import React from "react";
import "../../../css/host.css";

export default function AnonymousDecks(props) {
  const defaultOption = "Featured";
  const [deckNavOption, setDeckNavOption] = useState(defaultOption);

  const deckMenuLabels = [
    "Featured",
    "Popular",
    "Yours",
    "CreateDeck"
  ];

  const deckMenu = deckMenuLabels.map((label) => (
    <TopBarLink
      text={label}
      sel={listType}
      onClick={() => onDeckNavClick(label)}
      key={label}
    />
  ));
}