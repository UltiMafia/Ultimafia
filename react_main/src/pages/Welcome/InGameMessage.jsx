import { NameWithAvatar } from "../User/User";
import { UserText } from "../../components/Basic";
import React, { useEffect, useRef, useState } from "react";
import "css/game.css";
import { Fade } from "@mui/material";

export const InGameMessage = ({
  delay,
  playerName,
  msg,
  isServerMessage,
  highlightMessage,
  setDemoFinished,
  scroll,
}) => {
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
      if (scroll) {
        ref.current.scrollIntoView();
      }

      if (setDemoFinished) {
        setDemoFinished(true);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [scroll]);

  if (!visible) {
    return "";
  }

  return (
    <Fade in={visible}>
      <div
        className="message"
        style={{ display: "flex", marginTop: "10px" }}
        ref={ref}
      >
        <div className="sender gameMessageSender" style={{ flexBasis: "90px" }}>
          {/*{props.settings.timestamps && <Timestamp time={message.time} />}*/}

          {!isServerMessage && (
            <NameWithAvatar
              // dead={playerDead && props.stateViewing > 0}
              // id={player.userId}
              // avatarId={avatarId}
              name={playerName}
              // avatar={player.avatar}
              color={"#68a9dc"}
              noLink
              small
            />
          )}
        </div>
        <div
          className={`content ${isServerMessage ? "server" : ""} ${
            highlightMessage ? "highlightMessage" : ""
          }`}
          style={{
            cursor: "default",
            ...(isServerMessage ? { borderLeft: "none" } : null),
          }}
        >
          {/*{message.prefix && <div className="prefix">({message.prefix})</div>}*/}
          <UserText
            text={msg}
            linkify
            emotify
            terminologyEmoticons={true}
            iconUsername
          />
        </div>
      </div>
    </Fade>
  );
};
