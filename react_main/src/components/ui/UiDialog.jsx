import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useViewActive } from "../../hooks/useViewActivity";
import { useDismissOnBack } from "../../hooks/useDismissOnBack";
import UiAction from "./UiAction";
import UiIcon from "./UiIcon";
import "./ui.css";

let nextDialogId = 0;

// Site and minigame dialogs share one frame, focus behavior and action region.
// Required decisions opt out of dismissal. Global ready checks stay separate.
export default function UiDialog({ open = true, title, description, onClose, actions, children, maxWidth = "sm", dismissible = !!onClose }) {
  const active = useViewActive();
  const [id] = useState(() => `ui-dialog-${++nextDialogId}`);
  const visible = open && active;
  useDismissOnBack(visible && dismissible, onClose);
  if (!active) return null;
  return <Dialog open={visible} onClose={dismissible ? onClose : undefined}
    disableEscapeKeyDown={!dismissible} fullWidth maxWidth={maxWidth}
    aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
    className="ui-dialog">
    <DialogTitle id={`${id}-heading`} className="ui-dialog-title">
      <span id={`${id}-title`}>{title}</span>
      {dismissible && <UiAction variant="ghost" iconOnly aria-label="Close" onClick={onClose}><UiIcon name="close" /></UiAction>}
    </DialogTitle>
    <DialogContent className="ui-dialog-content">
      {description && <p id={`${id}-description`} className="ui-dialog-description">{description}</p>}
      {children}
    </DialogContent>
    {actions && <DialogActions className="ui-dialog-actions">{actions}</DialogActions>}
  </Dialog>;
}
