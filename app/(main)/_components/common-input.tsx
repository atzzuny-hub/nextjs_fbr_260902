import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";


export default function CommonInput({name, label, defaultValue, placeholder}:{name:string, label:string, defaultValue?:string, placeholder?:string}){
    return(
        <Field className="max-w-48">
            <FieldLabel htmlFor={name} className="text-xs text-muted-foreground">{label}</FieldLabel>
            <Input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} />
        </Field>
    )
}