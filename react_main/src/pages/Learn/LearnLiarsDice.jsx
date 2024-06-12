import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnLiarsDice(props) {
  const gameType = "Liars Dice";

  useEffect(() => {
    document.title = "Learn Liars Dice | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Each player starts with 5 dice unless customized, and can only see faces of their own dice.<br></br>
            Taking turns, players guess how many of a chosen face are present in all players' dice combined.<br></br>
            <br></br>
            If a player thinks the player before them is wrong, they can call a lie. In this case, if there are fewer<br></br>
            dice showing that face than guessed, the previous player loses a die. If there are more or an equal<br></br>
            number of dice showing that face, the player who called a lie loses a die.<br></br>
            <br></br>
            When a player runs out of dice, they are eliminated. The last player remaining is the winner.
          </div>
          <div className="paragraph">
            Customizable settings:<br></br>
            <br></br>
            Wild Ones: Ones will count towards any dice amount.<br></br>
            <br></br>
            Spot On:<br></br>
            - Players will receive a new option to call 'Spot on' during their turn.<br></br>
            - This means that the previous player guessed the exact amount of the chosen dice.<br></br>
            - If called correctly, everyone except the caller will lose a dice.<br></br>
            - If called wrongly, only the caller will lose a dice.<br></br>
            - Spot on cannot be used on the first turn of each round.<br></br>
            <br></br>
            Starting Dice: Players will start with amount of dice specified here. Default is 5.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
