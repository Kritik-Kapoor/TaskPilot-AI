import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./formContext";
import { FormInput } from "./FormInput";
import { FormInputGroup } from "./FormInputGroup";
import { FormSelect } from "./FormSelect";
import { FormTextarea } from "./FormTextarea";
import { FormCheckbox } from "./FormCheckbox";

const { useAppForm } = createFormHook({
  fieldComponents: {
    Input: FormInput,
    InputGroup: FormInputGroup,
    Textarea: FormTextarea,
    Select: FormSelect,
    Checkbox: FormCheckbox,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm };
export { useFieldContext, useFormContext } from "./formContext";
