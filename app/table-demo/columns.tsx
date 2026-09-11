"use client"

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";   // Table은 lucide가 아니라 ui/table!
import { cn } from "@/lib/utils";
import type { OrderItem } from "./types";
import { STATUS_OPTIONS } from "./options";
import type { DataTableFeatures } from "./_components/data-table-features";

// ── 셀 가공 함수 3종 (T-1 page.tsx에서 이사) ──
const statusOf = (s: string) =>
    STATUS_OPTIONS.find((o) => o.value === s)
    ?? { label: s, badge: "bg-muted text-muted-foreground" };   // 모르는 코드는 원문 그대로 회색

const flag = (cc: string) =>
    /^[A-Z]{2}$/.test(cc)
        ? cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        : "";   // 모르는 형식이면 국기 생략, 코드만

function formatDateTime(sec: number | null | undefined) {
    if (!sec) return "-";
    const d = new Date(sec * 1000);   // 초 단위 → ×1000
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── 컬럼 정의: T-1의 <TableHead> + <TableCell> 한 쌍이 항목 하나 ──
export const columns: ColumnDef<DataTableFeatures, OrderItem>[] = [
    // T-3: 데이터 없는 토글 컬럼 — accessorKey 대신 id. 핸들러는 getRowCanExpand가 true일 때만 동작
    { id: "expander", header: "",
        cell: ({ row }) => (
            <Button variant="ghost" size="icon-sm" onClick={row.getToggleExpandedHandler()} aria-label="상세 펼치기">
                {row.getIsExpanded() ? <Minus /> : <Plus />}
            </Button>
        ),
    },
    { accessorKey: "orderNo", header: "주문번호",
        cell: ({ row }) => <span className="font-medium">{row.original.orderNo}</span>,
    },
    { accessorKey: "productName", header: "상품명" },   // 가공 없음 → cell 생략, 값 그대로
    { accessorKey: "status", header: "상태",
        cell: ({ row }) => {
            const s = statusOf(row.original.status);
            return <Badge className={cn("border-transparent", s.badge)}>{s.label}</Badge>;
        },
    },
    { accessorKey: "countryCode", header: "국가",
        cell: ({ row }) => <>{flag(row.original.countryCode)} {row.original.countryCode}</>,
    },
    { accessorKey: "reqDt", header: "접수일",
        cell: ({ row }) => formatDateTime(row.original.reqDt),
    },
    { accessorKey: "arvDt", header: "도착일",
        cell: ({ row }) => formatDateTime(row.original.arvDt),
    },
];

// ── T-3: 펼친 행 아래에 그릴 내용 — 함수라서 서버(page.tsx)가 아닌 이 "use client" 모듈에서 export ──
export const renderSubRow = (row: Row<DataTableFeatures, OrderItem>) => {
    const items = row.original.items;
    if (items.length === 0) return <p className="py-2 text-sm text-muted-foreground">상품 정보 없음</p>;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>SKU</TableHead><TableHead>상품명</TableHead><TableHead>수량</TableHead><TableHead>단위</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((p) => (
                    <TableRow key={p.sku}>
                        <TableCell>{p.sku}</TableCell><TableCell>{p.productName}</TableCell>
                        <TableCell>{p.qty}</TableCell><TableCell>{p.unit}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
