import React, { useContext, useEffect, useState } from "react";
import axios from "axios";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Time } from "components/Basic";
import CustomMarkdown from "components/CustomMarkdown";

import { VoteWidget } from "./Forums/Forums";
import { NameWithAvatar } from "../User/User";

import { Box, Divider, Grid, IconButton, Paper, Stack } from "@mui/material";
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
    <Grid container>
      <Grid item xs={12} md={props?.fullWidth ? 12 : 6}>
        <Paper sx={{ p: 1 }} className={`${comment.deleted ? "deleted" : ""}`}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <VoteWidget
              item={comment}
              itemHolder={comments}
              setItemHolder={setComments}
              itemType="comment"
            />
            <Stack direction="column" spacing={1} flexGrow="1">
              <Stack direction="row" spacing={1} alignItems="center">
                <NameWithAvatar
                  id={comment.author.id}
                  name={comment.author.name}
                  avatar={comment.author.avatar}
                  groups={comment.author.groups}
                  vanityUrl={comment.author.vanityUrl}
                  color={theme.palette.text.primary}
                  subContent={
                    <Box sx={{
                      opacity: "0.5",
                    }}>
                      <Time
                        minSec
                        millisec={Date.now() - comment.date}
                        suffix=" ago"
                      />
                    </Box>
                  }
                />
                <Stack direction="row" spacing={1} sx={{
                  alignItems: "center",
                  marginLeft: "auto !important",
                }}>
                  {!comment.deleted &&
                    (user.perms.deleteAnyPost ||
                      (user.perms.deleteOwnPost &&
                        comment.author.id === user.id) ||
                      location === user.id) && (
                      <IconButton onClick={onDeleteClick}>
                        <i className="fas fa-trash" />
                      </IconButton>
                    )
                  }
                  {comment.deleted && user.perms.restoreDeleted && (
                    <IconButton onClick={onRestoreClick}>
                      <i className="fas fa-trash-restore" />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
              <Divider />
              <Box
                className="md-content"
                sx={{
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  wordBreak: "break-word",
                }}
              >
                <CustomMarkdown>{content}</CustomMarkdown>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};
