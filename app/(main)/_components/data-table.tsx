"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useTable, ColumnDef, RowData, Row  } from "@tanstack/react-table";
import { features, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fragment, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
    const [virtual, setVirtual] = useState(true);    // 기본은 켬 — 성능이 기본값

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
        }   
    });

    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 48,          // 행 하나의 예상 높이
        getItemKey: (i) => rows[i].id,
        overscan: 8,
        enabled: virtual,  // ← 꺼지면 계산을 멈춘다
        initialOffset: () => scrollRef.current?.scrollTop ?? 0,
    });

    return(
        <div className="flex min-h-0 flex-1 flex-col space-y-2">
            {/* 1. 상단 토글 컨트롤러 */}
            <div className="flex shrink-0 items-center justify-between pb-2">
                <span className="text-sm text-muted-foreground">
                    {virtual ? "보이는 행만 그림 — 빠름" : `${rows.length}행 전부 그림 — Ctrl+F 가능`}
                </span>
                <Button variant="outline" size="sm" onClick={() => setVirtual((v) => !v)}>
                    {virtual ? "전체 렌더로 (Ctrl+F)" : "가상 스크롤로"}
                </Button>
            </div>
            <Table 
                style={{ 
                    width: virtual ? "100%" : "100%", 
                    minWidth: virtual ? table.getTotalSize() : undefined 
                }}
                containerRef={scrollRef}
                containerClassName="min-h-0 flex-1 overflow-auto"
            >    
                {/* 헤더: virtual 모드 여부에 따라 flex / default 분기 */}              
                <TableHeader className="sticky top-0 z-10 bg-background">
                    {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                        key={headerGroup.id}
                        style={virtual ? { display: "flex", width: "100%", minWidth: table.getTotalSize() } : undefined}
                    >
                        {headerGroup.headers.map((header) => (
                        <TableHead
                            key={header.id}
                            style={virtual ? { 
                                display: "flex", 
                                width: header.column.getSize(),
                                flex: `${header.column.getSize()} 1 0px`, 
                                minWidth: header.column.getSize(),        
                            } : undefined}
                        >
                            {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                        </TableHead>
                        ))}
                    </TableRow>
                    ))}
                </TableHeader>
                    
                
                {/* 본문: virtual 모드와 일반 전체 렌더링 모드 분기 */}
                {virtual ? (
                /* ================= [모드 A] 가상화 렌더링 ================= */
                <TableBody
                    style={{
                        display: "grid",
                        height: virtualizer.getTotalSize(),
                        position: "relative",
                        width: "100%",
                        minWidth: table.getTotalSize(),
                    }}
                >
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
                                width: "100%",
                                minWidth: table.getTotalSize(),
                            }}
                        >
                            {row.getAllCells().map((cell) => (
                            <TableCell
                                key={cell.id}
                                style={{ 
                                    display: "flex",
                                    width: cell.column.getSize(),
                                    flex: `${cell.column.getSize()} 1 0px`, // 기본 size를 비율(flex-grow)로 사용하여 꽉 채움
                                    minWidth: cell.column.getSize(),        // 설정한 size 이하로는 안 줄어듦
                                }}
                            >
                                <table.FlexRender cell={cell} />
                            </TableCell>
                            ))}
                            {row.getIsExpanded() && renderSubRow && (
                            <TableCell style={{ width: "100%" }}>{renderSubRow(row)}</TableCell>
                            )}
                        </TableRow>
                        );
                    })
                    ) : (
                    <EmptyRow colSpan={columns.length} />
                    )}
                </TableBody>
                ) : (
                /* ================= [모드 B] 전체 DOM 렌더링 (Ctrl+F 지원) ================= */
                <TableBody>
                    {rows.length ? (
                    rows.map((row) => (
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
                            <TableCell colSpan={row.getAllCells().length}>
                                {renderSubRow(row)}
                            </TableCell>
                            </TableRow>
                        )}
                        </Fragment>
                    ))
                    ) : (
                    <EmptyRow colSpan={columns.length} />
                    )}
                </TableBody>
                )}

                {/* <TableBody style={{ display: "grid", height: virtualizer.getTotalSize(), position: "relative" }}>
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
                </TableBody> */}
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

// 공통 조회 결과 없음 표기 컴포넌트
function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        조회 결과가 없습니다
      </TableCell>
    </TableRow>
  );
}