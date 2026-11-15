import { Pagination, PaginationItem } from "@mui/material";
import "./ui.css";

// One pagination widget for every list. MUI owns keyboard support, the current
// page announcement and ellipsis behaviour; this owns the shared presentation.
// See docs/frontend-redesign/UI_CONTROLS.md.
//
// Some lists do not know their total (the lobby, forum boards, polls): the API
// returns one page at a time and "next" may exist. Those render the same MUI
// items in cursor form — previous, the current page, next — instead of inventing
// a total, which would disable the only way forward.
export default function UiPagination({
  page,
  count,
  onChange,
  label = "Pagination",
  disabled = false,
  className = "",
}) {
  if (!Number.isInteger(page) || page < 1) throw new TypeError(`UiPagination: page must be a positive integer, got ${page}`);
  const known = Number.isInteger(count);
  const pages = known ? Math.max(1, count) : null;
  const itemLabel = (type, value) => type === "page" ? `Page ${value}`
    : type === "first" ? "First page"
    : type === "last" ? "Last page"
    : type === "next" ? "Next page" : "Previous page";
  if (!known) {
    return <nav className={`page-nav ui-pagination ui-pagination--cursor ${className}`} aria-label={label}>
      <PaginationItem type="previous" disabled={disabled || page <= 1}
        aria-label={itemLabel("previous")} onClick={() => onChange?.(page - 1)} />
      <PaginationItem type="page" page={page} selected
        aria-label={itemLabel("page", page)} onClick={() => onChange?.(page)} />
      <PaginationItem type="next" disabled={disabled}
        aria-label={itemLabel("next")} onClick={() => onChange?.(page + 1)} />
    </nav>;
  }
  return <nav className={`page-nav ui-pagination ${className}`} aria-label={label}>
    <Pagination
      count={pages}
      page={Math.min(page, pages)}
      disabled={disabled}
      siblingCount={1}
      boundaryCount={1}
      color="primary"
      onChange={(_, value) => onChange?.(value)}
      getItemAriaLabel={itemLabel}
    />
  </nav>;
}
