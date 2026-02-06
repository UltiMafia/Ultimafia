import React from "react";

import "css/modal.css";
import { Dialog } from "@mui/material";

export function Modal(props) {
  return (
    <>
      {props.show && (
        <Dialog
          open={props.show}
          onClose={props.onBgClick}
          scroll="body"
        >
          <div className="modal-header">{props.header}</div>
          <div className="modal-content">{props.content}</div>
          <div className="modal-footer">{props.footer}</div>
        </Dialog>
      )}
    </>
  );
}
