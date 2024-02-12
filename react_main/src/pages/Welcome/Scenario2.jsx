import { InGameMessage } from "./InGameMessage";
import React, { useState } from "react";

const speedMultiplier = 1;
const introDelay = 4000 / speedMultiplier;
const tinyDelay = 1000 / speedMultiplier;
const smallDelay = 1750 / speedMultiplier;
const midDelay = 2500 / speedMultiplier;

export const Scenario2 = ({dialogOpen}) => {
  const [demoFinished, setDemoFinished] = useState(false);
  let time = 0;

  return (
    <>
      <InGameMessage
        delay={(time += introDelay)}
        isServerMessage={true}
        msg={"doggg was killed"}
        scroll={!dialogOpen}

      />
      <InGameMessage
        delay={(time += midDelay)}
        isServerMessage={true}
        msg={"doggg's role is Villager"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Donutz"}
        msg={"Hello!"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"I investigated Donutz, they're innocent :cat:"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Donutz"}
        msg={"Thank you!! best cop"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"BS, I'm cop, I was hooked at night and I received no report..."}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"How dare you... it's my first time playing a power role :( "}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Neo"}
        highlightMessage={demoFinished}
        msg={"hogged. Shreklok is real"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={
          "FTR I checked bricklover, I smelled his scum-stench from a mile afar"
        }
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Donutz"}
        msg={
          "ohhhhhh... I understand. I was inno'd by scum so I don't suspect them"
        }
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"I hate you so much"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"shad0w"}
        msg={"im gunned"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"chef"}
        msg={"I confirm. I'm gunsmith :gun: :gun:"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"chef"}
        msg={"Shoot the miscreant. bricklover must be fake!"}
        scroll={!dialogOpen}
      />

      <InGameMessage
        delay={(time += midDelay)}
        playerName={"bricklover"}
        msg={"this is a mistake"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        isServerMessage={true}
        msg={"shad0w pulls a gun and shoots at bricklover!"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        isServerMessage={true}
        msg={"bricklover collapses to the ground from a gunshot wound."}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        isServerMessage={true}
        msg={"bricklover's role is cop."}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"chef"}
        msg={"damn, we've been played"}
        scroll={!dialogOpen}
      />

      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Neo"}
        highlightMessage={demoFinished}
        msg={"glitch in the matrix. he was too real"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += smallDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"guys it was just a prank "}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"Donutz"}
        msg={"I can't believe I fell for this..."}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        playerName={"shad0w"}
        msg={"@Shreklok you are getting condemned for this"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += midDelay)}
        playerName={"Shreklok"}
        highlightMessage={demoFinished}
        msg={"JUST A PRANK BRO"}
        scroll={!dialogOpen}
      />
      <InGameMessage
        delay={(time += tinyDelay)}
        isServerMessage={true}
        msg={
          "Shreklok has been condemned to the gallows. Shreklok's role is Mafioso."
        }
        setDemoFinished={setDemoFinished}
        scroll={!dialogOpen}
      />
    </>
  );
};
