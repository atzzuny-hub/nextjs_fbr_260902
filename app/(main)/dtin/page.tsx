import { Button } from "@/components/ui/button"
import { InboundItem } from "./types"
import { apiFetch } from "@/lib/api"
import PageShell from "../_components/page-shell";
import WmsLinkIdSelect from "../_components/wmslinkid-select";
import SearchPanel from "../_components/search-panel";
import DatePicker from "../_components/date-picker";
import { getDefaultDateRange, toEpochSec } from "@/lib/date-range";
import CommonSelect from "../_components/common-select";
import CommonInput from "../_components/common-input";

const SEARCH_DT_OPTIONS = [
    {value: 'REQ_DT', label: '입고접수일' },
    {value: 'WRHS_DT', label: '창고도착일' },
    {value: 'CMPL_DT', label: '입고완료일' }
]

const ORDER_STATUS_OPTIONS = [
    { value: 'ALL', label: '전체' },
    {value: 'PLAN', label: '예정' },
    {value: 'STANDBY', label: '대기' },
    {value: 'WORK', label: '작업중' },
    {value: 'COMPLETED', label: '입고' },
    {value: 'CANCELED', label: '취소' },
    {value: 'UNKNOW', label: '알수없음' }
]

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
                        action='/dtin' 
                        detailOpen={!!(sp.search || sp.status)} 
                        detail={
                            <>
                                <CommonInput name="search" label="검색어" placeholder="검색어" defaultValue={sp.search} />
                                <CommonSelect 
                                    name="status" 
                                    defaultValue={sp.status ? sp.status : "ALL"} 
                                    data={ORDER_STATUS_OPTIONS} 
                                    label={"ORDER STATUS"}
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
                            {data.map((v) => <div key={v.idx}>{v.ganNo} — {v.status}</div>)}
                        </div>
                )}
            </PageShell>
        </div>
    )
}

