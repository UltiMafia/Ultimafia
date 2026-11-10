import React, { forwardRef } from "react";
import { TextField } from "@mui/material";
import "./ui.css";

// Long policy/category names need their complete selected value and menu option,
// rather than an ellipsis. Ordinary fields retain MUI's existing defaults.
const UiField = forwardRef(function UiField({ selectText, className = "", SelectProps, ...props }, ref) {
  if (selectText != null && (selectText !== "wrap" || !props.select)) {
    throw new Error("UiField selectText supports wrap on select fields only");
  }
  const wrapping = selectText === "wrap";
  const selection = wrapping ? {
    ...SelectProps,
    MenuProps: {
      ...SelectProps?.MenuProps,
      PaperProps: {
        ...SelectProps?.MenuProps?.PaperProps,
        className: `ui-select-options--wrap ${SelectProps?.MenuProps?.PaperProps?.className || ""}`,
      },
    },
  } : SelectProps;
  return <TextField {...props} ref={ref} SelectProps={selection}
    className={`${wrapping ? "ui-field--wrap-select " : ""}${className}`} />;
});

export default UiField;
