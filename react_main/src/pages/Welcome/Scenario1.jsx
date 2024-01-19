import { InGameMessage } from "./InGameMessage";
import React from "react";

export const Scenario1 = () => {
  return (
    <>
      <InGameMessage isServerMessage={true} msg={"doggg was killed"} />
      <InGameMessage isServerMessage={true} msg={"doggg's role is Villager"} />
      <InGameMessage playerName={"Donutz"} msg={"Hello!"} />
      <InGameMessage
        playerName={"bricklover"}
        msg={"I investigated shad0w, they're innocent :cat:"}
      />
      <InGameMessage
        playerName={"Shreklok"}
        msg={"BS, I'm cop, Donutz is sided with the mafia"}
      />
      <InGameMessage
        playerName={"Donutz"}
        msg={"That's not true! I'm blue, Shreklok is fake"}
      />
      <InGameMessage playerName={"shad0w"} msg={"im gunned"} />
      <InGameMessage
        playerName={"chef"}
        msg={"I confirm, I'm gunslinger :gun: :gun:"}
      />
      <InGameMessage
        playerName={"Shreklok"}
        msg={"@shad0w shoot Donnelly, he's scum"}
      />
      <InGameMessage
        playerName={"Shreklok"}
        msg={"you seriously cannot believe his fake claim..."}
      />
      <InGameMessage
        isServerMessage={true}
        msg={"shad0w pulls a gun and shoots at Shreklok!"}
      />
      <InGameMessage
        isServerMessage={true}
        msg={"Shreklok collapses to the ground from a gunshot wound."}
      />
      <InGameMessage
        isServerMessage={true}
        msg={"Shreklok's role is Mafioso."}
      />
      <InGameMessage playerName={"bricklover"} msg={"PWNED"} />
      <InGameMessage playerName={"chef"} msg={"nice shot, it's autowin gg"} />
      <InGameMessage playerName={"shad0w"} msg={"gg"} />
    </>
  );
};
