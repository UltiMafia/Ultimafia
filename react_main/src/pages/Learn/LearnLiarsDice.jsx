import React, { useEffect } from "react";

import "../../css/learn.css";

export default function LearnLiarsDice(props) {
  // const gameType = "Liars Dice";

  useEffect(() => {
    document.title = "Learn Liars Dice | UltiMafia";
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
