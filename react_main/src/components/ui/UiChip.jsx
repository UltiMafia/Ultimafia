import "./ui.css";

// One chip per job: a read-only status, a filter toggle, or a removable tag.
// No page-local pills or badges. See docs/frontend-redesign/UI_CONTROLS.md.
const VARIANTS = new Set(["status", "filter", "tag"]);
const TONES = new Set(["neutral", "brand", "positive", "destructive"]);

export default function UiChip({
  variant = "status",
  tone = "neutral",
  pressed,
  onClick,
  onRemove,
  removeLabel = "Remove",
  className = "",
  children,
  ...props
}) {
  if (!VARIANTS.has(variant)) throw new TypeError(`UiChip: unsupported variant "${variant}"`);
  if (!TONES.has(tone)) throw new TypeError(`UiChip: unsupported tone "${tone}"`);
  if (variant === "filter" && typeof onClick !== "function") throw new TypeError("UiChip filter requires onClick");
  if (variant === "tag" && typeof onRemove !== "function") throw new TypeError("UiChip tag requires onRemove");
  const interaction = variant === "filter"
    ? { component: "button", type: "button", onClick, "aria-pressed": Boolean(pressed) }
    : {};
  const Element = variant === "filter" ? "button" : "span";
  return <Element
    {...props}
    {...interaction}
    data-ui-chip={variant}
    data-tone={tone}
    data-pressed={variant === "filter" ? String(Boolean(pressed)) : undefined}
    className={`ui-chip ui-chip--${variant} ${className}`}
  >
    <span className="ui-chip-label">{children}</span>
    {variant === "tag" && <button type="button" className="ui-chip-remove" aria-label={`${removeLabel} ${typeof children === "string" ? children : ""}`.trim()} onClick={onRemove}>×</button>}
  </Element>;
}
