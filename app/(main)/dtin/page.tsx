'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { InboundItem } from "./types"
import { useApiFetch } from "../_hooks/use-api-fetch"

export default function DtinPage(){

    const apiFetch = useApiFetch();
    const [data, setData] = useState<InboundItem[]>([]) 

    const handleClickData = async() => {   

        const param = new URLSearchParams({
            wmsLinkId : '-100', // URLSearchParams는 값이 전부 문자열이어야 함
            startDt : '1787788800',
            endDt : '1788479999',
            searchDt : 'REQ_DT',
            pageNo : '0',
            pageSize : '300'
        })

       const res = await apiFetch(`/dtin?${param.toString()}`);
        if (!res?.ok) {
            console.log('요청실패', res?.status);
            return;
        }
        setData(await res.json());
    }
    return(
        <div>
            <Button onClick={handleClickData}>SEARCH DATA</Button>
            <div>
                {data.map((v)=> (<div key={v.dataId}>{v.clntName}</div>))}
            </div>
        </div>
    )
}

