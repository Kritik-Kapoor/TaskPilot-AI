import { useFieldContext } from "./formContext";
import { FormBase, FormControlProps } from "./FormBase";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FormSelect({
  children,
  placeholder,
  controlClassName,
  ...props
}: FormControlProps & { children: ReactNode }) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Select
        onValueChange={(e) => field.handleChange(e)}
        value={field.state.value}
      >
        <SelectTrigger
          aria-invalid={isInvalid}
          id={field.name}
          onBlur={field.handleBlur}
          className={cn(controlClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormBase>
  );
}
