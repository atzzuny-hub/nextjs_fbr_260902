import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export interface IOption{
    value: string | number,
    label: string 
}

export default function CommonSelect({
    name, 
    label, 
    defaultValue, 
    placeholder, 
    data
}:{
    label:string, 
    name:string, 
    defaultValue?:string, 
    placeholder?:string,
    data:IOption[]
}){
        
    return(
        <Field className="max-w-48">
            <FieldLabel htmlFor={name} className="text-xs text-muted-foreground">{label}</FieldLabel>
            <Select name={name} defaultValue={defaultValue ?? String(data[0]?.value ?? '')}>
                <SelectTrigger id={name} className="w-full">
                    <SelectValue placeholder={placeholder}/>
                </SelectTrigger>
                <SelectContent>
                    {data.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )   
}