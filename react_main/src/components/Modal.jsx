import React from "react";

import "../css/modal.css";

export function Modal(props) {
  return (
    <>
      {props.show && (
        <>
          <div className="modal-bg" onClick={props.onBgClick} />
          <div className={`modal ${props.className ? props.className : ""}`}>
            <div className="modal-header">{props.header}</div>
            <div className="modal-content">{props.content}</div>
            <div className="modal-footer">{props.footer}</div>
          </div>
        </>
      )}
    </>
  );
}
