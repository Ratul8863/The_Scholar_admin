"use client";

import { useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";

export type RowRecord = { id: string } & Record<string, unknown>;

export function DataTable({
  rows,
  columns,
  selectable = false,
  onSelection,
  freezeFirst = false,
}: {
  rows: RowRecord[];
  columns: LegacyColumnDef<RowRecord>[];
  selectable?: boolean;
  onSelection?: (ids: string[]) => void;
  freezeFirst?: boolean;
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnSizing, setColumnSizing] = useState({});
  const data = useMemo(() => rows, [rows]);
  const table = useLegacyTable({
    data,
    columns,
    state: { rowSelection, columnVisibility, columnSizing },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: selectable,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const selected = Object.keys(rowSelection);
  return (
    <div>
      <div className="chip-row mb-3">
        {table.getAllLeafColumns().map((column) => (
          <label key={column.id} className="filter-chip compact cursor-pointer gap-2">
            <input type="checkbox" className="accent-primary" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
            {String(column.columnDef.header ?? column.id)}
          </label>
        ))}
      </div>
      {selectable && selected.length ? (
        <button type="button" className="danger-pill mb-3" onClick={() => onSelection?.(selected)}>Archive selected ({selected.length})</button>
      ) : null}
      <div className="data-sheet table-scroll">
        <table className="data-table min-w-[760px]">
          <thead className="sticky top-0">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header, index) => (
                  <th key={header.id} className={index === 0 && freezeFirst ? "sticky left-0 z-10 bg-canvas" : undefined} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    <button aria-label={`Resize ${String(header.column.columnDef.header ?? header.column.id)}`} className="ml-2 inline-block h-4 w-1 cursor-col-resize bg-line align-middle" onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group">
                {row.getVisibleCells().map((cell, index) => (
                  <td key={cell.id} className={index === 0 && freezeFirst ? "sticky left-0 max-w-[280px] truncate bg-white transition-colors duration-[180ms] group-hover:bg-row-hover" : "max-w-[280px] truncate"} title={String(cell.getValue() ?? "")}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
