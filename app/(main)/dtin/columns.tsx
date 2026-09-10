"use client"

import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table"
import { InboundItem } from "./types"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/date-range";
import { ORDER_STATUS_OPTIONS } from "./options";
import { DataTableFeatures } from "../_components/data-table-features";


const statusOf = (s:string) => ORDER_STATUS_OPTIONS.find((o) => o.value === s) ?? {label:s, badge: "bg-muted text-muted-foreground"}
    
const flag = (cc: string) =>
    /^[A-Z]{2}$/.test(cc)
        ? cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        : "";   // 모르는 형식이면 국기 생략, 코드만


export const columns: ColumnDef<DataTableFeatures, InboundItem>[] = [
    { accessorKey: "ganNo", header: "주문번호" },  
    { accessorKey: "dataId", header: "접수번호" },  
    { accessorKey: "status", header: "입고상태", 
        cell: ({row}) => {
            const s = row.original.status;  
            return <Badge variant='ghost' className={cn("border-transparent", statusOf(s).badge)}>{statusOf(s).label}</Badge>
        }
    },  
    { accessorKey: "cntyCd", header: "국가",
        cell:({row}) => {
            const s = row.original.cntyCd;
            return <>{flag(s)} {s}</>
        }
     },  
    { accessorKey: "reqDt", header: "입고접수일",
        cell:({row})=>formatDateTime(row.original.reqDt)
     },  
    { accessorKey: "arvDt", header: "창고도착일",
        cell: ({ row }) => formatDateTime(row.original.arvDt) 
    },
    { accessorKey: "wmsLinkName", header: "WMS Link" },
    { accessorKey: "dataUpdDt", header: "입고완료일",
        cell: ({ row }) => formatDateTime(row.original.dataUpdDt) 
     }
]