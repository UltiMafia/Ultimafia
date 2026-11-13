import React from "react";
import "./ui.css";

// Administrative records become labeled continuous rows on phones. Keeping the
// labels and actions with each record avoids hiding the last columns offscreen.
export default function UiTable({ label, columns, rows, rowKey, emptyMessage = "No results.", variant = "records" }) {
  if (!["records", "comparison"].includes(variant)) throw new TypeError(`Unsupported UiTable variant: ${variant}`);
  return <table className={`ui-table ui-table--${variant}`} aria-label={label} role="table">
    <thead><tr role="row">
      {columns.map(column => <th key={column.key} scope="col" role="columnheader" className={column.nowrap ? "is-nowrap" : undefined}>{column.label}</th>)}
    </tr></thead>
    <tbody>
      {!rows.length && <tr role="row"><td role="cell" colSpan={columns.length}>{emptyMessage}</td></tr>}
      {rows.map(row => <tr key={row[rowKey]} role="row">
        {columns.map(column => <td key={column.key} role="cell" className={column.nowrap ? "is-nowrap" : undefined}>
          <span className="ui-table-mobile-label" aria-hidden="true">{column.label}</span>
          <div className={`ui-table-value${column.code ? " ui-table-value--code" : ""}`}>
            {column.render ? column.render(row) : row[column.key]}
          </div>
        </td>)}
      </tr>)}
    </tbody>
  </table>;
}
