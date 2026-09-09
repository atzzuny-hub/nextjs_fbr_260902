'use client'

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";


export default function DatePicker({name, label, defaultValue}:{name:string, label:string, defaultValue:string}){

    const [value, setValue] = useState(defaultValue ?? '')
    const [open, setOpen] = useState(false);

    const parsed = new Date(value);
    const valid = !isNaN(parsed.getTime());   // 타이핑 중 불완전한 값 방어

    
    return(
        <Field className="max-w-48">
            <FieldLabel className="text-xs text-muted-foreground">{label}</FieldLabel>
            <div className="relative">
                <Input
                    id={name}
                    name={name}
                    value={value}
                    placeholder="YYYY-MM-DD"
                    onChange={(e)=>setValue(e.target.value)}
                    className="pr-9"
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button 
                            variant='ghost'
                            type="button"
                            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                        >
                            <CalendarIcon className="size-4"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Calendar
                            mode="single"
                            selected={valid ? parsed : undefined}
                            onSelect={(d)=>{
                                if(d) setValue(format(d, 'yyyy-MM-dd'))
                                setOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </Field>
    )
}