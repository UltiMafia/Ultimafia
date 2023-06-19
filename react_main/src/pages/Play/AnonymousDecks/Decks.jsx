import React, { useState } from "react";
import "../../../css/host.css";
import { TopBarLink } from "../Play";

export default function AnonymousDecks(props) {
  const defaultOption = "Featured";
  const [deckNavOption, setDeckNavOption] = useState(defaultOption);

  const deckMenuLabels = [
    "Featured",
    "Popular",
    "Yours",
    "CreateDeck"
  ];

  function onDeckNavClick() {

  }

  const deckMenu = deckMenuLabels.map((label) => (
    <TopBarLink
      text={label}
      sel={label}
      onClick={() => onDeckNavClick(label)}
      key={label}
    />
  ));

  return <>hi</>
}