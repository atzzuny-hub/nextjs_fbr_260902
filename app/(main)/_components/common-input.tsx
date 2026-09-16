import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";


export default function CommonInput({name, label, defaultValue, placeholder, value, onChange}:
    {
        name: string, 
        label: string, 
        defaultValue?: string, 
        placeholder?: string,
        value?: string,
        onChange?: React.ChangeEventHandler<HTMLInputElement>,
    }){
    return(
        <Field className="max-w-48">
            <FieldLabel htmlFor={name} className="text-xs text-muted-foreground">{label}</FieldLabel>
            <Input id={name} name={name} placeholder={placeholder}
                {...(value !== undefined ? { value, onChange } : { defaultValue })}
            />
        </Field>
    )
}