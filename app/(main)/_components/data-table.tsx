"use client"

import { useTable, ColumnDef, RowData  } from "@tanstack/react-table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface DataTableProps<TData extends RowData>{
    columns: ColumnDef<DataTableFeatures, TData>[]
    data: TData[]
}


export function DataTable<TData extends RowData>({columns, data}: DataTableProps<TData>){

    const table = useTable({features, columns, data})
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
                <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                    </TableCell>
                    ))}
                </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}