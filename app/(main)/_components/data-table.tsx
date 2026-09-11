"use client"

import { useTable, ColumnDef, RowData, Row  } from "@tanstack/react-table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fragment } from "react";


interface DataTableProps<TData extends RowData>{
    columns: ColumnDef<DataTableFeatures, TData>[]
    data: TData[]
    renderSubRow?: (row: Row<DataTableFeatures, TData>) => React.ReactNode;   // 펼친 행 아래 내용
}


export function DataTable<TData extends RowData>({columns, data, renderSubRow}: DataTableProps<TData>){

    const table = useTable({features, columns, data, getRowCanExpand: () => !!renderSubRow })

    return(
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
    )
}