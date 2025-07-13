import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";
import ReactMarkdown from "react-markdown";
import { basicRenderers, Time } from "../../components/Basic";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { VoteWidget } from "./Forums/Forums";
import { NameWithAvatar } from "../User/User";

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

  let [CommentMarkdown, setCommentMarkdown] = useState("asdfff");

  var content = comment.content;
  useEffect(() => {
    setCommentMarkdown(
      <ReactMarkdown renderers={basicRenderers()} source={content} />
    );
  }, [content]);

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete this?"
    );

    if (!shouldDelete) return;

    axios
      .post(`/comment/delete`, { comment: comment.id })
      .then(onDelete)
      .catch(errorAlert);
  }

  function onRestoreClick() {
    axios
      .post(`/comment/restore`, { comment: comment.id })
      .then(onRestore)
      .catch(errorAlert);
  }

  if (comment.deleted && user.settings.hideDeleted) content = "*deleted*";

  return (
    <Grid container>
      <Grid item xs={12} md={props?.fullWidth ? 12 : 6}>
        <Card
          sx={{
            width: "100%",
            my: props?.marginY,
          }}
          className={`${comment.deleted ? "deleted" : ""}`}
        >
          <CardContent
            sx={{
              display: "flex",
              p: 1.5,
              pl: 0.5,
              "&:last-child": { pb: 1.5 },
            }}
          >
            <Box sx={{ mr: 0.5 }}>
              <VoteWidget
                item={comment}
                itemHolder={comments}
                setItemHolder={setComments}
                itemType="comment"
              />
            </Box>
            <div className="commentMainWrapper">
              <div className="commentHeading">
                <div className="heading-left">
                  <div className="commentPostInfo">
                    <NameWithAvatar
                      id={comment.author.id}
                      name={comment.author.name}
                      avatar={comment.author.avatar}
                      groups={comment.author.groups}
                      color={theme.palette.text.primary}
                    />
                    <div className="post-date">
                      <Time minSec millisec={Date.now() - comment.date} />
                      {" ago"}
                    </div>
                  </div>
                </div>
                <div className="commentBtnWrapper">
                  {!comment.deleted &&
                    (user.perms.deleteAnyPost ||
                      (user.perms.deleteOwnPost &&
                        comment.author.id === user.id) ||
                      location === user.id) && (
                      <IconButton onClick={onDeleteClick}>
                        <i className="fas fa-trash" />
                      </IconButton>
                    )}
                  {comment.deleted && user.perms.restoreDeleted && (
                    <IconButton onClick={onRestoreClick}>
                      <i className="fas fa-trash-restore" />
                    </IconButton>
                  )}
                </div>
              </div>
              <Divider />
              <Box
                className="md-content"
                sx={{
                  backgroundColor: "transparent !important",
                  paddingTop: "8px",
                  paddingBottom: 0,
                  color: `${theme.palette.text.primary} !important`,
                }}
              >
                {CommentMarkdown}
              </Box>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
