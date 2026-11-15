import { forwardRef } from "react";
import "./ui.css";

// Two independent axes: what the action means (tone) and how loud it is
// (emphasis). Elevation is its own property: only a primary emphasis is raised,
// and `raised` can override it. See docs/frontend-redesign/UI_CONTROLS.md.
const TONES = new Set(["neutral", "brand", "positive", "destructive"]);
const EMPHASES = new Set(["default", "primary", "quiet"]);

// Transitional alias. Existing call sites name a fused variant; it maps onto the
// axes and the architecture guard counts it. New code must use tone/emphasis.
const LEGACY_VARIANTS = {
  primary: ["brand", "primary"],
  secondary: ["neutral", "default"],
  ghost: ["neutral", "quiet"],
  success: ["positive", "default"],
  danger: ["destructive", "default"],
  "danger-quiet": ["destructive", "quiet"],
};
// Kept only so existing audit selectors keep resolving during migration.
const LEGACY_CLASS = {
  "brand:primary": "ui-action--primary",
  "neutral:default": "ui-action--secondary",
  "neutral:quiet": "ui-action--ghost",
  "positive:default": "ui-action--success",
  "destructive:default": "ui-action--danger",
  "destructive:quiet": "ui-action--danger-quiet",
};

function resolveAxes({ tone, emphasis, variant }) {
  if (variant !== undefined) {
    if (tone !== undefined || emphasis !== undefined) {
      throw new TypeError("UiAction: pass either the legacy `variant` or `tone`/`emphasis`, not both");
    }
    const mapped = LEGACY_VARIANTS[variant];
    if (!mapped) throw new TypeError(`UiAction: unsupported legacy variant "${variant}"; use tone and emphasis`);
    return mapped;
  }
  const resolvedTone = tone ?? "neutral";
  const resolvedEmphasis = emphasis ?? (resolvedTone === "brand" ? "primary" : "default");
  if (!TONES.has(resolvedTone)) throw new TypeError(`UiAction: unsupported tone "${resolvedTone}"`);
  if (!EMPHASES.has(resolvedEmphasis)) throw new TypeError(`UiAction: unsupported emphasis "${resolvedEmphasis}"`);
  return [resolvedTone, resolvedEmphasis];
}

const UiAction = forwardRef(function UiAction({
  component: Component = "button",
  tone, emphasis, variant, raised,
  size = "default", block = false, iconOnly = false, busy = false, disabled = false,
  className = "", children, onClick, type = "button", ...props
}, ref) {
  const isButton = Component === "button";
  const [resolvedTone, resolvedEmphasis] = resolveAxes({ tone, emphasis, variant });
  const isRaised = raised ?? resolvedEmphasis === "primary";
  const legacyClass = LEGACY_CLASS[`${resolvedTone}:${resolvedEmphasis}`] || "";
  return <Component {...props} ref={ref}
    type={isButton ? type : undefined}
    disabled={isButton ? (disabled || busy) : undefined}
    aria-disabled={(!isButton && (disabled || busy)) || undefined}
    aria-busy={busy || undefined}
    data-tone={resolvedTone}
    data-emphasis={resolvedEmphasis}
    data-raised={isRaised ? "true" : undefined}
    className={`ui-action${size === "small" ? " ui-action--small" : ""}${block ? " ui-action--block" : ""}${iconOnly ? " ui-action--icon" : ""}${disabled || busy ? " is-disabled" : ""}${legacyClass ? ` ${legacyClass}` : ""} ${className}`}
    onClick={event => {
      if (disabled || busy) { event.preventDefault(); return; }
      onClick?.(event);
    }}>
    {busy && <span className="ui-progress" aria-hidden="true" />}
    {children}
  </Component>;
});

export default UiAction;
