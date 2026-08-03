import { TicketEditor } from "@/components/common/TicketEditor";
import type { JSONContent } from "@tiptap/core";
import { FormBase, FormControlProps } from "./FormBase";
import { useFieldContext } from "./formContext";

export function FormTicketEditor({
  placeholder,
  ...props
}: FormControlProps) {
  const field = useFieldContext<JSONContent>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <TicketEditor
        id={field.name}
        value={field.state.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        aria-invalid={isInvalid}
      />
    </FormBase>
  );
}
