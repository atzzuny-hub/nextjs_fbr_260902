"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useTable, ColumnDef, RowData, Row  } from "@tanstack/react-table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import CommonInput from "./common-input";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PAGE_SIZE_OPTIONS } from "./data-table-options";


interface DataTableProps<TData extends RowData>{
    columns: ColumnDef<DataTableFeatures, TData>[]
    data: TData[]
    renderSubRow?: (row: Row<DataTableFeatures, TData>) => React.ReactNode;   // 펼친 행 아래 내용
    pageIndex: number,
    pageSize: number    
    rowCount: number    
}


export function DataTable<TData extends RowData>({columns, data, pageIndex, pageSize, rowCount, renderSubRow}: DataTableProps<TData>){

    const router = useRouter();              
    const searchParams = useSearchParams();   

    const scrollRef = useRef<HTMLDivElement>(null)

    // 페이지 크기 변경 — setPageSize를 거치지 않고 URL만 바꾼다
    const changePageSize = (next: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("pageSize", String(next));
        params.delete("page");            // 1페이지로 되돌린다
        router.push(`?${params.toString()}`);
    };


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
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(next.pageIndex + 1));
            router.push(`?${params.toString()}`);
        },
        globalFilterFn: "includesString",        
    });

    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 48,          // 행 하나의 예상 높이
        getItemKey: (i) => rows[i].id,
        overscan: 8,
    });

    return(
        <div className="flex min-h-0 flex-1 flex-col"> 
            <div className="shrink-0">
                <CommonInput
                    name="globalFilter"
                    label="화면에서 찾기"
                    placeholder={`현재 ${data.length}건에서 찾기`}
                    value={table.state.globalFilter ?? ""}
                    onChange={(e) => table.setGlobalFilter(e.target.value)}
                />
            </div>
            <Table 
                containerRef={scrollRef}
                containerClassName="min-h-0 flex-1 overflow-auto"
            >    
                <TableHeader className="sticky top-0 z-10 bg-background">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} style={{ display: "flex", width: table.getTotalSize() }}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    style={{ display: "flex", width: header.column.getSize() }}
                                >
                                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody style={{ display: "grid", height: virtualizer.getTotalSize(), position: "relative" }}>
                    {rows.length ? (
                        virtualizer.getVirtualItems().map((vi) => {
                            const row = rows[vi.index];
                            return (
                                <TableRow
                                    key={row.id}
                                    data-index={vi.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                        position: "absolute",
                                        transform: `translateY(${vi.start}px)`,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        width: table.getTotalSize(),
                                    }}
                                >
                                    {row.getAllCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{ display: "flex", width: cell.column.getSize() }}
                                        >
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                    {row.getIsExpanded() && renderSubRow && (
                                        <TableCell style={{ width: "100%" }}>
                                            {renderSubRow(row)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                조회 결과가 없습니다
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="shrink-0">
                <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                >
                    {PAGE_SIZE_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
                <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
                <span>{pageIndex + 1} / {table.getPageCount()}</span>
                <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
        </div>
    )
}