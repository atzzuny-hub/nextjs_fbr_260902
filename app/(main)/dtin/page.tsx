import { Button } from "@/components/ui/button"
import { InboundItem } from "./types"
import { apiFetch } from "@/lib/api"
import PageShell from "../_components/page-shell";
import WmsLinkIdSelect from "../_components/wmslinkid-select";
import SearchPanel from "../_components/search-panel";
import DatePicker from "../_components/date-picker";
import { getDefaultDateRange, toEpochSec } from "@/lib/date-range";

export default async function DtinPage({ searchParams }: {
    searchParams: Promise<{ wmsLinkId?: string, startDt?:string, endDt?:string }>;
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
            searchDt: "REQ_DT",
            pageNo: "0",
            pageSize: "300",
        });

        const res = await apiFetch(`/dtin?${param.toString()}`);

        if (!res.ok) {
            error = res.status;
        } else {
            data = await res.json();
        }


    }     


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
                    <SearchPanel action='/dtin' >
                        <WmsLinkIdSelect defaultValue={sp.wmsLinkId}/>
                        <DatePicker label='시작일' name='startDt' defaultValue={startDate}/>
                        <DatePicker label='종료일' name='endDt' defaultValue={endDate}/>
                    </SearchPanel>
                }
            >
                {error ? (
                        <div>조회 실패 ({error})</div>
                    ) : (
                        <div>
                            조회 결과 {data.length}건
                            {data.map((v) => <div key={v.idx}>{v.ganNo} — {v.status}</div>)}
                        </div>
                )}
            </PageShell>
        </div>
    )
}

