import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";


type IWmsLinkIdOption={
    idx:number,
    name:string
}


export default async function WmsLinkIdSelect({defaultValue}:{defaultValue?:string}){

    const res = await apiFetch('/wmslk/al')
    const data:IWmsLinkIdOption[] = res.ok ? await res.json() : []

    return(
        <Field className="max-w-48">
            <FieldLabel htmlFor="wmsLinkId" className="text-xs text-muted-foreground">WMS LINK ID</FieldLabel>
            <Select name="wmsLinkId" defaultValue={defaultValue ?? "-100"}>
                <SelectTrigger id="wmsLinkId" className="w-full">
                    <SelectValue placeholder="WMS LINK 선택" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="-100">전체</SelectItem>
                    {data.map((option) => (
                        <SelectItem key={option.idx} value={String(option.idx)}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )
}