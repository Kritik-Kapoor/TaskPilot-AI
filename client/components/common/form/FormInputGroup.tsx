import { ComponentProps, ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FormBase, FormControlProps } from "./FormBase";
import { useFieldContext } from "./formContext";

type FormInputGroupProps = FormControlProps &
  Pick<
    ComponentProps<typeof InputGroupInput>,
    "type" | "autoComplete" | "className"
  > & {
    children?: ReactNode;
    groupClasses?: string;
  };

function FormInputGroupComponent({
  placeholder,
  type,
  autoComplete,
  className,
  children,
  groupClasses,
  ...props
}: FormInputGroupProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <InputGroup className={groupClasses}>
        <InputGroupInput
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
        {children}
      </InputGroup>
    </FormBase>
  );
}

export const FormInputGroup = Object.assign(FormInputGroupComponent, {
  Addon: InputGroupAddon,
  Button: InputGroupButton,
});
