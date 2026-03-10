import React, { useContext, useState } from "react";
import axios from "axios";
import update from "immutability-helper";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { usePopoverOpen } from "hooks/usePopoverOpen";

import {
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export function VoteWidget(props) {
  const theme = useTheme();
  const item = props.item;
  const itemType = props.itemType;
  const itemHolder = props.itemHolder;
  const setItemHolder = props.setItemHolder;
  const itemKey = props.itemKey;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [userVotes, setUserVotes] = useState([]);

  const upvoters = userVotes.slice().filter((vote) => vote.direction === 1);
  const downvoters = userVotes.slice().filter((vote) => vote.direction === -1);

  const { popoverOpen, openByClick, anchorEl, handleClick, closePopover } =
    usePopoverOpen();

  function updateItemVoteCount(direction, newDirection) {
    var voteCount = item.voteCount ?? 0;

    if (item.vote === 0) voteCount += direction;
    else if (item.vote === direction) voteCount += -1 * direction;
    else voteCount += 2 * direction;

    return update(item, {
      vote: {
        $set: newDirection,
      },
      voteCount: {
        $set: voteCount,
      },
    });
  }

  function onVote(itemId, direction) {
    if (!user.perms?.vote) return;

    axios
      .post("/api/votes", {
        item: itemId,
        itemType,
        direction,
      })
      .then((res) => {
        var newDirection = Number(res.data);
        var newItem = updateItemVoteCount(direction, newDirection);

        if (itemHolder == null) {
          setItemHolder(newItem);
          return;
        }

        var items = itemKey ? itemHolder[itemKey] : itemHolder;

        for (let i in items) {
          if (items[i].id === itemId) {
            var newItems = items.slice();
            newItems[i] = newItem;

            if (itemKey) {
              setItemHolder(
                update(itemHolder, {
                  [itemKey]: {
                    $set: newItems,
                  },
                })
              );
            } else setItemHolder(newItems);
            break;
          }
        }
      })
      .catch(errorAlert);
  }

  function getVotes(e, itemId) {
    if (!user.perms?.viewVotes) return;
    handleClick(e);
    axios.get(`/api/votes/${itemId}`).then((res) => {
      setUserVotes(res.data);
    });
  }

  return (
    <Stack direction="column">
      <IconButton
        className={`fas fa-arrow-up`}
        sx={{
          fontSize: "1em",
          ...(item.vote === 1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(item.id, 1)}
      />
      <IconButton
        onClick={(e) => getVotes(e, item.id)}
        sx={{
          position: "relative",
          fontSize: "1em",
          minWidth: "2em",
          minHeight: "2em",
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            lineHeight: "1",
          }}
        >
          {item.voteCount ?? 0}
        </Typography>
      </IconButton>
      <IconButton
        className={`fas fa-arrow-down`}
        sx={{
          fontSize: "1em",
          ...(item.vote === -1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(item.id, -1)}
      />
      <Popover
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        onClose={closePopover}
        disableScrollLock
        disableRestoreFocus
      >
        <Stack
          direction="column"
          spacing={1}
          sx={{
            p: 1,
          }}
        >
          <i className="fas fa-arrow-up" style={{ alignSelf: "center" }} />
          {upvoters.map((e) => (
            <NameWithAvatar
              small
              id={e.voter.id}
              name={e.voter.name}
              vanityUrl={e.voter.vanityUrl}
              avatar={e.voter.avatar}
            />
          ))}
          {upvoters.length === 0 && (
            <Typography sx={{ alignSelf: "center" }}>None</Typography>
          )}
          <Divider orientation="horizontal" flexItem />
          {downvoters.map((e) => (
            <NameWithAvatar
              small
              id={e.voter.id}
              name={e.voter.name}
              vanityUrl={e.voter.vanityUrl}
              avatar={e.voter.avatar}
            />
          ))}
          {downvoters.length === 0 && (
            <Typography sx={{ alignSelf: "center" }}>None</Typography>
          )}
          <i className="fas fa-arrow-down" style={{ alignSelf: "center" }} />
        </Stack>
      </Popover>
    </Stack>
  );
}
