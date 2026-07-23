import { useFieldContext } from "./formContext";
import { FormBase, FormControlProps } from "./FormBase";
import { Checkbox } from "@/components/ui/checkbox";

export function FormCheckbox({
  required,
  ...props
}: FormControlProps & { required?: boolean }) {
  const field = useFieldContext<boolean>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props} controlFirst horizontal>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onBlur={field.handleBlur}
        onCheckedChange={(e) => field.handleChange(e === true)}
        aria-invalid={isInvalid}
        required={required}
      />
    </FormBase>
  );
}
