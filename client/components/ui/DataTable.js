"use client";

import React from "react";

const resolveClassName = (value, row, index) =>
  typeof value === "function" ? value(row, index) : value;

export default function DataTable({
  columns = [],
  data = [],
  rowKey,
  emptyMessage = "No data available.",
  emptyClassName = "",
  wrapperClassName = "",
  tableClassName = "",
  headerRowClassName = "",
  bodyClassName = "",
  rowClassName = "",
  cellClassName = "",
}) {
  if (!data.length) {
    return (
      <div
        className={[
          "rounded-2xl border border-dashed border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]",
          emptyClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {emptyMessage}
      </div>
    );
  }

  const getRowKey = (row, index) => {
    if (rowKey) return rowKey(row, index);
    if (row && typeof row === "object" && "id" in row) {
      return row.id;
    }
    return index;
  };

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white",
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="overflow-x-auto">
        <table className={["min-w-full text-sm", tableClassName].join(" ")}>
          <thead className="bg-[#FAFAFA]">
            <tr className={headerRowClassName}>
              {columns.map((column, index) => (
                <th
                  key={column.key ?? index}
                  scope="col"
                  className={[
                    "px-4 py-3 text-left text-xs font-semibold text-[#4B4B4B]",
                    column.headerClassName,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {column.header ?? column.key ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={bodyClassName}>
            {data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={[
                  "border-t border-[#EDEDED]",
                  resolveClassName(rowClassName, row, rowIndex),
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {columns.map((column, columnIndex) => {
                  const content = column.cell
                    ? column.cell(row, rowIndex)
                    : column.key
                      ? row?.[column.key]
                      : null;
                  return (
                    <td
                      key={column.key ?? columnIndex}
                      className={[
                        "px-4 py-4 align-top text-sm text-[#0F0F0F]",
                        cellClassName,
                        resolveClassName(column.className, row, rowIndex),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {content ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
