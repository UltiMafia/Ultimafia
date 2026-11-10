import React, { useContext, useEffect, useState } from "react";
import axios from "axios";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Time } from "components/Basic";
import CustomMarkdown from "components/CustomMarkdown";

import { VoteWidget } from "components/VoteWidget";
import { EmoteReactions } from "components/EmoteReactions";
import "css/emote-reactions.css";
import { NameWithAvatar } from "../User/UserWidgets";

import { Box, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const Comment = (props) => {
  const theme = useTheme();
  const location = props.location;
  const comment = props.comment;
  const comments = props.comments;
  const setComments = props.setComments;
  const onDelete = props.onDelete;
  const onRestore = props.onRestore;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  var content = comment.content;

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete this?"
    );

    if (!shouldDelete) return;

    axios
      .post(`/api/comment/delete`, { comment: comment.id })
      .then(onDelete)
      .catch(errorAlert);
  }

  function onRestoreClick() {
    axios
      .post(`/api/comment/restore`, { comment: comment.id })
      .then(onRestore)
      .catch(errorAlert);
  }

  if (comment.deleted && user.settings.hideDeleted) content = "*deleted*";

  return (
    <article className={`comment-row${comment.deleted ? " deleted" : ""}`} aria-label={`Comment by ${comment.author.name}`}>
      <header className="comment-header">
        <NameWithAvatar
          id={comment.author.id}
          name={comment.author.name}
          avatar={comment.author.avatar}
          avatarSize={32}
          groups={comment.author.groups}
          vanityUrl={comment.author.vanityUrl}
          color={theme.palette.text.primary}
        />
        <span className="comment-time"><Time minSec millisec={Date.now() - comment.date} suffix=" ago" /></span>
        <div className="comment-actions">
          {!comment.deleted && (user.perms.deleteAnyPost ||
            (user.perms.deleteOwnPost && comment.author.id === user.id) ||
            location === user.id || props.canModerateLocation) && (
            <IconButton aria-label="Delete comment" onClick={onDeleteClick}><i className="fas fa-trash" /></IconButton>
          )}
          {comment.deleted && user.perms.restoreDeleted && (
            <IconButton aria-label="Restore comment" onClick={onRestoreClick}><i className="fas fa-trash-restore" /></IconButton>
          )}
        </div>
      </header>
      <Box className="comment-content md-content" sx={{ backgroundColor: "transparent !important", color: `${theme.palette.text.primary} !important`, wordBreak: "break-word" }}>
        <CustomMarkdown>{content}</CustomMarkdown>
      </Box>
      {!comment.deleted && <footer className="comment-footer">
        <div className="comment-vote">
          <VoteWidget item={comment} itemHolder={comments} setItemHolder={setComments} itemType="comment" />
        </div>
        <EmoteReactions item={comment} itemType="comment" itemHolder={comments} setItemHolder={setComments} />
      </footer>}
    </article>
  );
};
