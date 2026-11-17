import React from "react";
import UiPending from "./ui/UiPending";

// Compatibility entry for legacy callers. New interfaces use components/ui.
export const Loading = ({ small, extraSmall, label }) =>
  <UiPending compact={small || extraSmall} inline={extraSmall} label={label} />;
