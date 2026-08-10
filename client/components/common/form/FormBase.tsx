import { ReactNode, useEffect, useId } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldGroupContext } from "@/components/ui/field-group-context";
import { useFieldContext } from "./formContext";

export type FormControlProps = {
  label: string;
  description?: string;
  placeholder?: string;
  optional?: boolean;
  hideLabel?: boolean;
  controlClassName?: string;
};

type FormBaseProps = FormControlProps & {
  children: ReactNode;
  horizontal?: boolean;
  controlFirst?: boolean;
};

const bracketSegmentPattern = /^(\([^)]*\)|\[[^\]]*\]|\{[^}]*\})$/;

const renderLabelWithDescriptiveTextInBrackets = (label: string) =>
  label
    .split(/(\([^)]*\)|\[[^\]]*\]|\{[^}]*\})/g)
    .filter((part) => part.length > 0)
    .map((part, index) =>
      bracketSegmentPattern.test(part) ? (
        <span key={index} className="font-normal text-muted-foreground">
          {part}
        </span>
      ) : (
        part
      ),
    );

export function FormBase({
  children,
  label,
  description,
  controlFirst,
  horizontal,
  optional = false,
  hideLabel = false,
}: FormBaseProps) {
  const field = useFieldContext();
  const group = useFieldGroupContext();
  const fieldId = useId();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  useEffect(() => {
    if (!group) return;
    return group.register(fieldId);
  }, [group, fieldId]);

  useEffect(() => {
    if (!group) return;
    group.update(fieldId, { isInvalid, errors: field.state.meta.errors });
  }, [group, fieldId, isInvalid, field.state.meta.errors]);

  const errorElem =
    isInvalid && !group ? (
      <FieldError errors={field.state.meta.errors} />
    ) : null;

  if (hideLabel) {
    return (
      <>
        {children}
        {errorElem}
      </>
    );
  }

  const labelElement = (
    <>
      <FieldLabel htmlFor={field.name}>
        {renderLabelWithDescriptiveTextInBrackets(label)}
        {optional && <span className="text-muted-foreground"> (optional)</span>}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
    </>
  );

  return (
    <Field
      data-invalid={isInvalid}
      orientation={horizontal ? "horizontal" : undefined}
    >
      {controlFirst ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            {errorElem}
          </FieldContent>
        </>
      ) : (
        <>
          <FieldContent>{labelElement}</FieldContent>
          {children}
          {errorElem}
        </>
      )}
    </Field>
  );
}
