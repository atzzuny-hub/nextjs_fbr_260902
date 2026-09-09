import { Button } from "@/components/ui/button";
import Form from "next/form";


interface SearchPanelProps{
    action:string,
    children: React.ReactNode,
    detail?:React.ReactNode
}

export default function SearchPanel({action, children, detail}:SearchPanelProps){
    return(
        <Form action={action} className=" rounded-lg border p-4 " >
            <div>
                <div className="flex gap-2">
                    {children}
                </div>
                
                <div>
                    <Button>초기화</Button>
                    <Button type="submit">조회</Button>
                </div>
            </div>
            {detail && (
                <div>
                    {detail}
                </div>
            )}
        </Form>
    )
}