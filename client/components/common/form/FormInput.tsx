import { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { FormBase, FormControlProps } from "./FormBase";
import { useFieldContext } from "./formContext";

type FormInputProps = FormControlProps &
  Pick<
    ComponentProps<typeof Input>,
    | "type"
    | "autoComplete"
    | "className"
    | "min"
    | "max"
    | "step"
    | "inputMode"
    | "pattern"
    | "disabled"
  >;

export function FormInput({
  placeholder,
  type,
  autoComplete,
  className,
  min,
  max,
  step,
  inputMode,
  pattern,
  disabled,
  ...props
}: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    field.handleChange(inputMode === "numeric" ? raw.replace(/\D/g, "") : raw);
  };

  return (
    <FormBase {...props}>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        autoComplete={autoComplete}
        className={className}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode}
        pattern={pattern}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={handleChange}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormBase>
  );
}
