'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsDown, ChevronsUp } from "lucide-react";

import Form from "next/form";


interface SearchPanelProps{
    action:string,
    children: React.ReactNode,
    detail?:React.ReactNode,
    detailOpen?: boolean, 
}

export default function SearchPanel({action, children, detail, detailOpen}:SearchPanelProps){

    const [isOpen, setIsOpen] = React.useState(detailOpen ?? false)
    
    return(
        <Form action={action} className=" rounded-lg border p-4 mt-2" >
            <div className="flex items-center gap-2">
                <div className="flex gap-2">
                    {children}
                </div>
                
                <div className="flex">
                    <Button variant='link'>초기화</Button>
                    <Button type="submit">조회</Button>
                </div>
            </div>

            {detail && (
                <div className="flex justify-end">
                    <Collapsible
                        open={isOpen}
                        onOpenChange={setIsOpen}
                        className="flex flex-col gap-2"
                    >
                        <div className="flex items-center px-4 justify-end">
                            <h4 className="text-sm font-semibold">Detailed Search</h4>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    {isOpen ? <ChevronsUp /> : <ChevronsDown />}
                                    <span className="sr-only">Toggle details</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent className="flex gap-2">
                            {detail}                        
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            )}
        </Form>
    )
}