import React, { useState, useContext } from "react";
import { GameContext } from "Contexts";
import { Box, Card, CardContent, Typography, Collapse } from "@mui/material";
import { emotify } from "../Emotes";
import { Avatar } from "../../pages/User/User";

function Newspaper(props) {
  const title = props.title || "Obituary";
  const timestamp = props.timestamp || Date.now();
  const deaths = props.deaths || [];
  const dayCount = props.dayCount || 0;
  const isAlignmentReveal = props.isAlignmentReveal || false;

  const [open, setOpen] = useState(true);

  // Example props.deaths input data:
  /* [{
        id: "l-jKFhbq6",
        name: "nearbear",
        avatar: true,
        avatarId: "l-jKFhbq6",
        deathMessage: "nearbear :zzz: died :zzz: while :zzz: testing :zzz: this :zzz: new :zzz: feature",
        revealMessage: "nearbear's role is Prankster:Insane/Telepathic",
        lastWill: ":will: nearbear did not leave a will."
    }, {
        id: "asdfasdf",
        name: "TheGameGuy",
        avatar: false,
        avatarId: "asdfasdf",
        deathMessage: "n1 TheGameGuy if you are jealous that he is better than you at EpicMafia. You can make up a fake excuse if you want to.",
        revealMessage: "TheGameGuy's role is Cop:Insane",
        lastWill: ":will: As read from TheGameGuy's last will: I knew you guys were jealous."
    }] */

  // Subtract 100 years from the game's start time to get MAFIA time
  const gameDate = new Date(timestamp + dayCount * 24 * 60 * 60 * 1000);
  gameDate.setFullYear(gameDate.getFullYear() - 100);

  const toggleCollapse = () => setOpen((prev) => !prev);

  return (
    <Card
      sx={{
        width: 324,
        mx: "auto",
        mt: 1,
        p: 1,
        fontFamily: '"Droid Serif", serif',
        fontSize: "18px",
        backgroundColor: "#f9f7f1",
        color: "#2f2f2f",
        border: "4px solid #000",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
        <Box
          onClick={toggleCollapse}
          sx={{
            cursor: "pointer",
            userSelect: "none",
            "&:hover": { color: "#000", opacity: 0.8 },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: "28px",
              textTransform: "uppercase",
              textAlign: "center",
              mb: 1,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Collapse in={open}>
          {deaths.length > 0 ? (
            deaths.map((death) => (
              <Box key={death.id} sx={{ mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    borderTop: "2px solid #2f2f2f",
                    borderBottom: "2px solid #2f2f2f",
                    textTransform: "uppercase",
                    textAlign: "center",
                    mb: 1,
                  }}
                >
                  {gameDate.toDateString()}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "20px",
                    textTransform: "uppercase",
                    mb: 0.5,
                  }}
                >
                  {death.name}
                </Typography>

                <Box display="flex" alignItems="flex-start" mb={0.5}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                      filter: "sepia(80%) grayscale(1) contrast(1)",
                      mixBlendMode: "multiply",
                    }}
                  >
                    <Avatar
                      id={death.id}
                      hasImage={death.avatar}
                      avatarId={death.avatarId}
                      name={death.name}
                      large
                      isSquare
                    />
                  </Box>

                  <Typography sx={{ flex: 1, overflow: "hidden" }}>
                    {emotify(death.deathMessage)}
                  </Typography>
                </Box>

                {death.revealMessage && (
                  <Typography>
                    {formatRevealMessage(
                      death.revealMessage,
                      death.name,
                      isAlignmentReveal
                    )}
                  </Typography>
                )}

                {death.lastWill && (
                  <Typography>{emotify(death.lastWill)}</Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography textAlign="center" sx={{ mt: 1 }}>
              No one died last night.
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

// --- Helper Functions ---

function formatRevealMessage(revealMessage, playerName, isAlignmentReveal) {
  const revealType = isAlignmentReveal ? "alignment" : "role";
  const revealResult = isAlignmentReveal
    ? getAlignmentName(revealMessage)
    : reformatRoleName(getRoleName(revealMessage));

  return (
    <>
      {playerName}'s {revealType} was:
      <span style={{ fontWeight: 900, fontStyle: "italic" }}>
        {" "}
        {revealResult}
      </span>
    </>
  );
}

const ROLE_SEARCH_TERM = "'s role is ";
function getRoleName(text) {
  if (!text) return "???";
  const indexStart = text.lastIndexOf(ROLE_SEARCH_TERM);
  const indexEnd = indexStart + ROLE_SEARCH_TERM.length;
  return text.substring(indexEnd);
}

const ALIGNMENT_SEARCH_TERM = "'s alignment is ";
function getAlignmentName(text) {
  if (!text) return "???";
  const indexStart = text.lastIndexOf(ALIGNMENT_SEARCH_TERM);
  const indexEnd = indexStart + ALIGNMENT_SEARCH_TERM.length;
  return text.substring(indexEnd);
}

function reformatRoleName(role) {
  const tokens = role.split(":");
  const roleName = tokens[0];
  const modifiers = tokens.length > 1 ? tokens[1].split("/") : [""];
  return `${modifiers.join(" ")} ${roleName}`;
}

/* Note from nearbear: I borrowed styling choices from this codepen so I'm crediting it */

/* Copyright (c) 2025 by Silke V (https://codepen.io/silkine/pen/QWBxVX)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 */

export function ObituariesMessage(props) {
  const game = useContext(GameContext);

  const message = props.message;
  const history = props.history;

  var title = null;
  if (message.source === "Day") {
    title = "Evening News";
  } else if (message.source === "Night") {
    title = "Obituaries";
    shouldAnimateSource = true;
  } else if (message.source === "Postgame") {
    title = "The Miller Times";
  } else {
    title = "Breaking News";
  }

  const deaths = message.obituaries.map((obituary) => {
    return {
      id: obituary.playerInfo.userId,
      name: obituary.playerInfo.name,
      avatar: obituary.playerInfo.avatar,
      customEmotes: obituary.playerInfo.customEmotes,
      deathMessage: obituary.snippets.deathMessage,
      revealMessage: obituary.snippets.revealMessage,
      lastWill: obituary.snippets.lastWill,
    };
  });

  return (
    <>
      <Newspaper
        title={title}
        timestamp={message.time}
        dayCount={message.dayCount}
        deaths={deaths}
        isAlignmentReveal={game.getSetupGameSetting("Alignment Only Reveal")}
      />
    </>
  );
}