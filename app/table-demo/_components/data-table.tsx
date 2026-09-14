"use client"

import { Fragment } from "react";
import { useTable, type ColumnDef, type Row, type RowData } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData extends RowData> {
    columns: ColumnDef<DataTableFeatures, TData>[];
    data: TData[];
    renderSubRow?: (row: Row<DataTableFeatures, TData>) => React.ReactNode;   // 펼친 행 아래 내용
}

// 컬럼·데이터에 무관한 범용 껍데기 — 어떤 목록 페이지든 columns와 data만 넘기면 된다
export function DataTable<TData extends RowData>({ columns, data, renderSubRow }: DataTableProps<TData>) {
    const table = useTable({
        features, columns, data,
        getRowCanExpand: () => !!renderSubRow,   // 그릴 게 있을 때만 펼침 허용
        initialState: {pagination: {pageIndex: 0, pageSize:3}}
    });

    return (
        <>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        // 행 하나가 <tr> 1~2개가 되므로 key는 묶음(Fragment)에
                        <Fragment key={row.id}>
                            <TableRow>
                                {row.getAllCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        <table.FlexRender cell={cell} />
                                    </TableCell>
                                ))}
                            </TableRow>
                            {row.getIsExpanded() && renderSubRow && (
                                <TableRow>
                                    <TableCell colSpan={row.getAllCells().length}>{renderSubRow(row)}</TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end gap-2 py-4">
                <Button variant="outline" size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}>이전</Button>
                <span className="text-sm text-muted-foreground">
                    {table.state.pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <Button variant="outline" size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}>다음</Button>
            </div>
        </>
    );
}
