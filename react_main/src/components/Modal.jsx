import React from "react";

import { UiDialog } from "./ui";

export function Modal(props) {
  return (
    <UiDialog
      open={Boolean(props.show)}
      onClose={props.onBgClick}
      title={props.header}
      actions={props.footer}
      size={props.maxWidth || "sm"}
      className={props.className}
    >
      {props.content}
    </UiDialog>
  );
}
