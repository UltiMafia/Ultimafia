import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./ui.css";

// One segmented choice, used wherever a page picks one of a small set of
// filters or data views. The visual treatment lives here, not in the caller.
export default function UiSegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  ...props
}) {
  const scroller = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return undefined;
    const update = () => {
      // Only show the edge fade when there is more content past the right edge.
      setOverflowing(element.scrollWidth - element.clientWidth - element.scrollLeft > 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [options.length]);

  // A width change can leave the previous scroll offset past the new end.
  useEffect(() => {
    const element = scroller.current;
    if (element && element.scrollLeft > 0 && element.scrollWidth <= element.clientWidth) {
      element.scrollLeft = 0;
    }
  }, [options.length]);

  return (
    <div className={`ui-segmented-shell ${className}`} data-overflow={overflowing || undefined}>
      <div
        {...props}
        ref={scroller}
        className="ui-segmented"
        role="group"
        aria-label={ariaLabel}
        data-ui-control="segmented"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="ui-segmented-option"
            aria-pressed={value === option.value}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
