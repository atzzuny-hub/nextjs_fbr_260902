import { Button } from "@/components/ui/button"
import { InboundItem } from "./types"
import { apiFetch } from "@/lib/api"
import Form from "next/form";

export default async function DtinPage({ searchParams }: {
    searchParams: Promise<{ search?: string }>;
}){

    const { search } = await searchParams;

    let data : InboundItem[] = []

    if(search){
        const param = new URLSearchParams({
            wmsLinkId: "-100",
            startDt: "1787788800",
            endDt: "1788479999",
            searchDt: "REQ_DT",
            pageNo: "0",
            pageSize: "300",
        });

        const res = await apiFetch(`/dtin?${param.toString()}`);
        if (!res.ok) return <div>조회 실패 ({res.status})</div>;

        data = await res.json();

    }     

    console.log(JSON.stringify(data, null, 2))

    return(
        <div>
            <Form action="/dtin">
                <input type="hidden" name="search" value="1" />
                <Button type="submit">SEARCH DATA</Button>
            </Form>
            <div>
                {data.map((v)=> (<div key={v.dataId}>{v.clntName}</div>))}
            </div>
        </div>
    )
}

