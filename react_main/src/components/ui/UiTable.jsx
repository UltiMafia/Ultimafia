import React from "react";
import UiIcon from "./UiIcon";
import "./ui.css";

// One table for records and data. Administrative records become labeled
// continuous rows on phones; sortable data tables keep their actions usable.
// See docs/frontend-redesign/UI_CONTROLS.md.
export default function UiTable({
  label, columns, rows, rowKey, emptyMessage = "No results.",
  variant = "records", onRowClick, sort, onSort, rowClassName,
}) {
  if (!["records", "comparison"].includes(variant)) throw new TypeError(`UiTable: unsupported variant "${variant}"`);
  const sortable = typeof onSort === "function";
  return <table className={`ui-table ui-table--${variant}`} aria-label={label} role="table">
    <thead><tr role="row">
      {columns.map(column => {
        const active = sortable && sort?.key === column.key;
        const className = [column.nowrap ? "is-nowrap" : "", column.actions ? "ui-table-cell--actions" : ""].filter(Boolean).join(" ") || undefined;
        return <th key={column.key} scope="col" role="columnheader" className={className}
          data-align={column.align} data-phone={column.hideOnPhone ? "hide" : undefined}
          aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
          {column.sortable && sortable
            ? <button type="button" className="ui-table-sort" onClick={() => onSort(column.key)} title={column.tooltip}>
                {column.label}
                {active && <UiIcon name={sort.direction === "asc" ? "up" : "down"} size={14} />}
              </button>
            : column.label}
        </th>;
      })}
    </tr></thead>
    <tbody>
      {!rows.length && <tr role="row"><td role="cell" colSpan={columns.length}>{emptyMessage}</td></tr>}
      {rows.map(row => <tr key={row[rowKey]} role="row"
        className={[onRowClick ? "is-clickable" : "", rowClassName ? rowClassName(row) : ""].filter(Boolean).join(" ") || undefined}
        onClick={onRowClick ? (event) => onRowClick(row, event) : undefined}>
        {columns.map(column => {
          const className = [column.nowrap ? "is-nowrap" : "", column.actions ? "ui-table-cell--actions" : ""].filter(Boolean).join(" ") || undefined;
          return <td key={column.key} role="cell" className={className}
            data-align={column.align} data-phone={column.hideOnPhone ? "hide" : undefined}>
            <span className="ui-table-mobile-label" aria-hidden="true">{column.label}</span>
            <div className={`ui-table-value${column.code ? " ui-table-value--code" : ""}`}>
              {column.render ? column.render(row) : row[column.key]}
            </div>
          </td>;
        })}
      </tr>)}
    </tbody>
  </table>;
}
