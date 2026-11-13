import React from "react";
import { IconButton, Tooltip } from "@mui/material";

import CountBadge from "../CountBadge";
import { useDmWindow } from "./DmWindowContext";
import { dmButtonState } from "../../utils/dmWindow";
import UiIcon from "../ui/UiIcon";

// Speech bubble in the header, left of the heart counts. Opens and closes the
// floating DM window; disabled while the server says DMs are locked.
export default function DmButton() {
  const dm = useDmWindow();
  const { disabled, tooltip } = dmButtonState(dm.access);

  return (
    <Tooltip title={tooltip}>
      {/* span: a disabled button still shows its tooltip */}
      <span>
        <IconButton
          size="small"
          aria-label="Direct messages"
          data-testid="dm-button"
          disabled={disabled}
          onClick={dm.toggle}
          sx={{ width: 34, height: 34 }}
        >
          <CountBadge count={disabled ? 0 : dm.unread} label="unread conversations" offset={-6}>
            <UiIcon name={disabled ? "lock" : "chat"} size={20} />
          </CountBadge>
        </IconButton>
      </span>
    </Tooltip>
  );
}
