import { InGameMessage } from "./InGameMessage";
import React, { useState } from "react";

const speedMultiplier = 1;
const introDelay = 4000 / speedMultiplier;
const tinyDelay = 1000 / speedMultiplier;
const smallDelay = 1750 / speedMultiplier;
const midDelay = 2500 / speedMultiplier;

export const Scenario2 = () => {
  const [demoFinished, setDemoFinished] = useState(false);
  let time = 0;

  return (
    <>
      <InGameMessage
        delay={(time += introDelay)}
        isServerMessage={true}
        msg={"doggg was killed"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        isServerMessage={true}
        msg={"doggg's role is Villager"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Donutz"}
        msg={"Hello!"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"I investigated Donutz, they're innocent :cat:"}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Donutz"}
        msg={"Thank you!! best cop"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"BS, I'm cop, I was hooked at night and I received no report..."}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"How dare you... it's my first time playing a power role :( "}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Neo"}
        highlightMessage={demoFinished}
        msg={"hogged. Shreklok is real"}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={
          "FTR I checked bricklover, I smelled his scum-stench from a mile afar"
        }
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Donutz"}
        msg={
          "ohhhhhh... I understand. I was inno'd by scum so I don't suspect them"
        }
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"I hate you so much"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"shad0w"}
        msg={"im gunned"}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"chef"}
        msg={"I confirm. I'm gunsmith :gun: :gun:"}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"chef"}
        msg={"Shoot the miscreant. bricklover must be fake!"}
      />

      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"this is a mistake"}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        isServerMessage={true}
        msg={"shad0w pulls a gun and shoots at bricklover!"}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        isServerMessage={true}
        msg={"bricklover collapses to the ground from a gunshot wound."}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        isServerMessage={true}
        msg={"bricklover's role is cop."}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"chef"}
        msg={"damn, we've been played"}
      />

      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Neo"}
        highlightMessage={demoFinished}
        msg={"glitch in the matrix. he was too real"}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"guys it was just a prank "}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Donutz"}
        msg={"I can't believe I fell for this..."}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"shad0w"}
        msg={"@Shreklok you are getting condemned for this"}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"JUST A PRANK BRO"}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        isServerMessage={true}
        msg={
          "Shreklok has been condemned to the gallows. Shreklok's role is Mafioso."
        }
        setDemoFinished={setDemoFinished}
      />
    </>
  );
};
