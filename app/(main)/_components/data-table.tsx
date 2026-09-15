"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useTable, ColumnDef, RowData, Row  } from "@tanstack/react-table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";


interface DataTableProps<TData extends RowData>{
    columns: ColumnDef<DataTableFeatures, TData>[]
    data: TData[]
    renderSubRow?: (row: Row<DataTableFeatures, TData>) => React.ReactNode;   // 펼친 행 아래 내용
    pageIndex: number,
    pageSize: number    
    rowCount: number    
}

const PAGE_SIZE_SELECT = [100, 200, 500, 1000]


export function DataTable<TData extends RowData>({columns, data, pageIndex, pageSize, rowCount, renderSubRow}: DataTableProps<TData>){

    const router = useRouter();              
    const searchParams = useSearchParams();   

    const table = useTable({
        features, columns, data, 
        getRowCanExpand: () => !!renderSubRow,
        manualPagination:true,
        rowCount,
        state: {pagination: {pageIndex, pageSize}},
        onPaginationChange: (updater) => {
            const next = typeof updater === "function"
                ? updater({ pageIndex, pageSize })
                : updater;
            const params = new URLSearchParams(searchParams);
            params.set("page", String(next.pageIndex + 1));
            params.set("pageSize", String(next.pageSize));   
            router.push(`?${params.toString()}`);
        },
});
    return(
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
            <div>
                <select
                    value={pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                >
                    {PAGE_SIZE_SELECT.map((v) => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
                <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
                <span>{pageIndex + 1} / {table.getPageCount()}</span>
                <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
        </>
    )
}