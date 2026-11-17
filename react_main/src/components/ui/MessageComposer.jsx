import React from "react";
import { TextareaAutosize } from "@mui/material";
import UiAction from "./UiAction";
import UiIcon from "./UiIcon";
import "./ui.css";

// Presentation only. Each caller owns its draft, permissions, recipient,
// submission/acknowledgement rules and transport. No network/session assumptions.
export default function MessageComposer({
  value, onChange, onKeyDown, onSend, canSend, disabled = false,
  label = "Message", placeholder = "Message", inputId, inputRef, inputProps = {},
  sendLabel = "Send message", sendButtonProps = {},
  tools, context, contextClassName = "", preview, status, statusLive = false, progress, className = "", ...props
}) {
  return <div {...props} className={`message-composer ${className}`}>
    <div className="composer-surface">
      {preview && <div className="composer-preview reply-preview">{preview}</div>}
      {context && <div className={`composer-context ${contextClassName}`}>{context}</div>}
      <div className="composer-row">
        <TextareaAutosize {...inputProps} id={inputId} ref={inputRef}
          className="composer-editor" minRows={1} maxRows={4}
          aria-label={label} value={value} onChange={onChange}
          onKeyDown={onKeyDown} placeholder={placeholder} disabled={disabled} />
      </div>
      <div className="composer-toolbar">
        <div className="composer-tools">{tools}</div>
        <UiAction {...sendButtonProps} className="composer-send" variant="primary" iconOnly
          aria-label={sendLabel} title={`${sendLabel} (Enter)`}
          disabled={!canSend || disabled} onMouseDown={event => event.preventDefault()}
          onClick={onSend}><UiIcon name="send" /></UiAction>
      </div>
      {progress != null && <div className="composer-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>}
    </div>
    {status && <div className="composer-status" role={statusLive ? "status" : undefined}>{status}</div>}
  </div>;
}
