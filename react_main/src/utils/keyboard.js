export function activateOnEnterOrSpace(event, callback) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback(event);
  }
}

export function getKeyboardActivationProps(onActivate, options = {}) {
  const { disabled = false, ariaLabel, ariaExpanded, ariaHaspopup } = options;

  if (disabled || !onActivate) {
    return {};
  }

  return {
    role: "button",
    tabIndex: 0,
    onKeyDown: (event) => activateOnEnterOrSpace(event, onActivate),
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...(ariaExpanded != null ? { "aria-expanded": ariaExpanded } : {}),
    ...(ariaHaspopup ? { "aria-haspopup": ariaHaspopup } : {}),
  };
}
