import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, FormControlLabel,
} from "@mui/material";
import { UserContext, SiteInfoContext } from "../Contexts";

const ACK_SETTING = "hideExternalLinkWarning";

export default function PostedExternalLink({ href, children }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const accountId = user?.loggedIn ? user.id : null;
  const currentAccount = useRef(accountId);
  currentAccount.current = accountId;
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const acknowledged =
    accountId && user?.settings?.[ACK_SETTING] === true;

  useEffect(() => {
    setOpen(false);
    setRemember(false);
  }, [accountId]);

  function requestOpen(event) {
    event.stopPropagation();
    if (event.type === "auxclick" && event.button !== 1) return;
    if (acknowledged) return;
    event.preventDefault();
    setRemember(false);
    setOpen(true);
  }

  function confirmOpen(event) {
    event.stopPropagation();
    if (event.type === "auxclick" && event.button !== 1) return;
    setOpen(false);
    // The real anchor opens synchronously from this click; never await a
    // settings request before opening, and never navigate the game window.
    if (!remember || !accountId) return;
    const requestedAccount = accountId;
    axios.post("/api/user/settings/update", {
      prop: ACK_SETTING,
      value: true,
    }).then(() => {
      if (currentAccount.current !== requestedAccount) return;
      user.set((previous) => previous.id === requestedAccount ? {
        ...previous,
        settings: { ...previous.settings, [ACK_SETTING]: true },
      } : previous);
    }).catch(() => {
      if (currentAccount.current === requestedAccount) {
        siteInfo?.showAlert(
          "The link was opened, but your warning preference could not be saved. Please try again.",
          "error"
        );
      }
    });
  }

  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer nofollow"
        onClick={requestOpen} onAuxClick={requestOpen}>
        {children}
      </a>
      <Dialog open={open} onClose={() => setOpen(false)}
        onClick={(event) => event.stopPropagation()}
        aria-labelledby="posted-external-link-title">
        <DialogTitle id="posted-external-link-title">Visit external link?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ overflowWrap: "anywhere" }}>
            This link opens in a new tab: {href}
          </DialogContentText>
          {accountId && (
            <FormControlLabel
              control={<Checkbox checked={remember}
                onChange={(event) => setRemember(event.target.checked)} />}
              label="Don't warn me again on this account"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button component="a" href={href} target="_blank"
            rel="noopener noreferrer nofollow" onClick={confirmOpen}
            onAuxClick={confirmOpen}>
            Open link
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
