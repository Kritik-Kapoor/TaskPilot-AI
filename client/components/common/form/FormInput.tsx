import { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { FormBase, FormControlProps } from "./FormBase";
import { useFieldContext } from "./hooks";

type FormInputProps = FormControlProps &
  Pick<ComponentProps<typeof Input>, "type" | "autoComplete" | "className">;

export function FormInput({
  placeholder,
  type,
  autoComplete,
  className,
  ...props
}: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        autoComplete={autoComplete}
        className={className}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
      />
    </FormBase>
  );
}
