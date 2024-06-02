import React, { useEffect } from "react";

import "../../css/learn.css";

export default function LearnLiarsDice(props) {
  // const gameType = "Liar's Dice";

  useEffect(() => {
    document.title = "Learn Liar's Dice | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Do dicing
          </div>
          <div className="paragraph">
            hehehehehehehehe.
          </div>
        </div>
      </div>
    </div>
  );
}
