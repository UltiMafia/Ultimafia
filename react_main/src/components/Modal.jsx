import React, { useState } from "react";

import { Dialog, DialogTitle, DialogContent, DialogActions, Box } from "@mui/material";
import UiAction from "./ui/UiAction";
import UiIcon from "./ui/UiIcon";

let nextModalId = 0;

export function Modal(props) {
  const [titleId] = useState(() => `modal-title-${++nextModalId}`);
  return (
    <>
      {props.show && (
        <Dialog
          open={props.show}
          onClose={props.onBgClick}
          className={props.className} fullWidth maxWidth={props.maxWidth || "sm"}
          aria-labelledby={titleId}
        >
          <DialogTitle component="div" id={titleId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>{props.header}</Box>
            {props.onBgClick && <UiAction iconOnly variant="ghost" aria-label="Close" onClick={props.onBgClick}><UiIcon name="close" /></UiAction>}
          </DialogTitle>
          <DialogContent>{props.content}</DialogContent>
          {props.footer && <DialogActions>{props.footer}</DialogActions>}
        </Dialog>
      )}
    </>
  );
}
