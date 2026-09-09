'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsDown, ChevronsUp } from "lucide-react";

import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface SearchPanelProps{
    action:string,
    children: React.ReactNode,
    detail?:React.ReactNode,
    detailOpen?: boolean, 
}

export default function SearchPanel({action, children, detail, detailOpen}:SearchPanelProps){

    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(detailOpen ?? false);
    const [resetCount, setResetCount] = React.useState(0);   // ← 리셋 카운터

    // URL에서 생략할 값: 빈 입력, "전체" 기본값
    const DROP_VALUES = ["", "ALL"];

    const handleSubmit=(e: React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();                              // 기본 제출(전부 싣기)을 가로채고
        const fd = new FormData(e.currentTarget);        // 폼의 모든 name/value 수집
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
            const val = String(v).trim();
            if (!DROP_VALUES.includes(val)) params.set(k, val);   // 의미 있는 값만
        }
        router.push(`${action}?${params.toString()}`);   // 정리된 URL로 이동

    }

    const handleClickReset = () => {
        setResetCount((c) => c + 1);   // ① 필드들 강제 리마운트 (URL과 무관하게)
        setIsOpen(false);              // ② 상세검색 접기
    };
    
    return(
        <Form action={action} onSubmit={handleSubmit} className=" rounded-lg border py-4 px-2 mt-2" >
            <div className="flex items-center gap-2">
                <div key={resetCount} className="flex gap-2">
                    {children}
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                    <Button type="button" variant="link" asChild>
                        <Link href={action} onClick={handleClickReset}>초기화</Link>
                    </Button>
                    <Button variant='outline' type="submit">조회</Button>
                </div>
            </div>

            {detail && (
                <div className="flex justify-end">
                    <Collapsible
                        open={isOpen}
                        onOpenChange={setIsOpen}
                        className="flex flex-col"
                    >
                        <div className="ml-auto flex items-center mb-2">
                            {/* <h4 className="text-sm font-semibold">Detailed Search</h4> */}
                            <CollapsibleTrigger asChild>
                                <Button variant="link" >
                                    Detailed Search
                                    {isOpen ? <ChevronsUp /> : <ChevronsDown />}
                                    <span className="sr-only">Toggle details</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent 
                            forceMount 
                            className="data-[state=closed]:hidden flex gap-2"
                        >
                            <div key={resetCount} className="flex gap-2">
                                {detail}
                            </div>                     
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            )}
        </Form>
    )
}