import { Button } from "@/components/ui/button"
import { InboundItem } from "./types"
import { apiFetch } from "@/lib/api"
import PageShell from "../_components/page-shell";
import WmsLinkIdSelect from "../_components/wmslinkid-select";
import SearchPanel from "../_components/search-panel";
import DatePicker from "../_components/date-picker";
import { formatDateTime, getDefaultDateRange, toEpochSec } from "@/lib/date-range";
import CommonSelect from "../_components/common-select";
import CommonInput from "../_components/common-input";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEARCH_DT_OPTIONS = [
    {value: 'REQ_DT', label: '입고접수일' },
    {value: 'WRHS_DT', label: '창고도착일' },
    {value: 'CMPL_DT', label: '입고완료일' }
]

const ORDER_STATUS_OPTIONS = [
    // options 확장 — value/label/badge가 한 줄에 (상태 지식의 단일 출처)
    { value: "ALL",       label: "전체",     badge: "" },
    { value: "PLAN",      label: "예정",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { value: "STANDBY",   label: "대기",     badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
    { value: "WORK",      label: "작업중",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { value: "COMPLETED", label: "입고",     badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
    { value: "CANCELED",  label: "취소",     badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
    { value: "UNKNOW",    label: "알수없음", badge: "bg-muted text-muted-foreground" },
];


export default async function DtinPage({ searchParams }: {
    searchParams: Promise<{ wmsLinkId?: string, startDt?:string, endDt?:string, searchDt:string, search?:string, status?:string }>;
}){

    const  sp  = await searchParams;

    const { todayStr, weekAgoStr } = getDefaultDateRange();  

    const startDate = sp.startDt && !isNaN(new Date(sp.startDt).getTime()) ? sp.startDt : weekAgoStr
    const endDate = sp.endDt && !isNaN(new Date(sp.endDt).getTime()) ? sp.endDt : todayStr
    
    

    let error: number | null = null;
    let data: InboundItem[] = [];

    if(sp.wmsLinkId){
        const param = new URLSearchParams({
            wmsLinkId: sp.wmsLinkId,
            startDt: String(toEpochSec(startDate)),          // → "1788..."
            endDt: String(toEpochSec(endDate) + 86399),      // → 그날 23:59:59까지 포함
            searchDt: sp.searchDt,
            pageNo: "0",
            pageSize: "300",
        });

        if (sp.search) param.set("search", sp.search);
        if (sp.status && sp.status !== "ALL") param.set("status", sp.status);

        const res = await apiFetch(`/dtin?${param.toString()}`);

        if (!res.ok) {
            error = res.status;
        } else {
            data = await res.json();
        }


    }     

    console.log(Object.keys(data[0]))

    const flag = (cc: string) =>
    /^[A-Z]{2}$/.test(cc)
        ? cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        : "";   // 모르는 형식이면 국기 생략, 코드만

    const statusOf = (s:string) => ORDER_STATUS_OPTIONS.find((o) => o.value === s) ?? {label:s, badge: "bg-muted text-muted-foreground"}
    

    return(
        <div>
            <PageShell
                title={"입고현황"}
                btnAct={
                    <div className="flex gap-2">
                        <Button variant='outline'>버튼1</Button>
                        <Button variant='outline'>버튼2</Button>
                    </div>
                }
                search={
                    <SearchPanel 
                        key={JSON.stringify(sp)}
                        action='/dtin' 
                        detailOpen={!!(sp.search || sp.status)} 
                        detail={
                            <>
                                <CommonInput name="search" label="검색어" placeholder="검색어" defaultValue={sp.search} />
                                <CommonSelect 
                                    name="status" 
                                    defaultValue={sp.status ? sp.status : "ALL"} 
                                    data={ORDER_STATUS_OPTIONS} 
                                    label={"입고상태"}
                                />
                            </>
                        }
                    >
                        <WmsLinkIdSelect defaultValue={sp.wmsLinkId}/>
                        <DatePicker label='시작일' name='startDt' defaultValue={startDate}/>
                        <DatePicker label='종료일' name='endDt' defaultValue={endDate}/>
                        <CommonSelect 
                            name="searchDt" 
                            defaultValue={sp.searchDt ? sp.searchDt : "REQ_DT"} 
                            placeholder={"기준일자 선택"}
                            data={SEARCH_DT_OPTIONS} 
                            label={"기준일자"}
                        />
                        
                    </SearchPanel>
                }
            >
                {error ? (
                        <div>조회 실패 ({error})</div>
                    ) : (
                        <div>
                            조회 결과 {data.length}건
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>주문번호</TableHead>
                                        <TableHead>접수번호</TableHead>
                                        <TableHead>입고상태</TableHead>
                                        <TableHead >국가</TableHead>
                                        <TableHead>입고접수일</TableHead>
                                        <TableHead>창고도착일</TableHead>
                                        <TableHead>WMS Link</TableHead>
                                        <TableHead>입고완료일</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((inbound) => (
                                        <TableRow key={inbound.idx}>
                                            <TableCell className="font-medium">{inbound.ganNo}</TableCell>
                                            <TableCell>{inbound.dataId}</TableCell>
                                            <TableCell><Badge variant='ghost' className={cn("border-transparent", statusOf(inbound.status).badge)}>{statusOf(inbound.status).label}</Badge></TableCell>
                                            <TableCell>{flag(inbound.cntyCd)} {inbound.cntyCd}</TableCell>

                                            <TableCell>{formatDateTime(inbound.reqDt)}</TableCell>
                                            <TableCell>{formatDateTime(inbound.arvDt)}</TableCell>
                                            <TableCell>{inbound.wmsLinkName}</TableCell>
                                            <TableCell>{formatDateTime(inbound.dataUpdDt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                )}
            </PageShell>
        </div>
    )
}

