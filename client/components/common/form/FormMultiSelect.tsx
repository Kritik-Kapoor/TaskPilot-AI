import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FormBase, FormControlProps } from "./FormBase";
import { useFieldContext } from "./formContext";

type FormMultiSelectProps = FormControlProps & {
  options: SelectOption[];
  loading?: boolean;
  emptyMessage?: string;
  maxSelections?: number;
  displayValueType?: "label" | "count";
};

export function FormMultiSelect({
  options,
  placeholder = "Select items…",
  emptyMessage = "No items found.",
  loading = false,
  maxSelections,
  displayValueType = "label",
  ...props
}: FormMultiSelectProps) {
  const field = useFieldContext<string[]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => field.state.value.includes(option.value)),
    [field.state.value, options],
  );

  const setSelectedValues = (values: string[]) => {
    field.handleChange(values);
  };

  const toggleOption = (option: SelectOption) => {
    const isSelected = field.state.value.includes(option.value);

    if (isSelected) {
      setSelectedValues(
        field.state.value.filter((value) => value !== option.value),
      );
      return;
    }

    if (
      maxSelections !== undefined &&
      field.state.value.length >= maxSelections
    ) {
      return;
    }

    setSelectedValues([...field.state.value, option.value]);
  };

  const removeOption = (valueToRemove: string) => {
    setSelectedValues(
      field.state.value.filter((value) => value !== valueToRemove),
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) field.handleBlur();
  };

  const stopScrollPropagation = (event: React.WheelEvent) => {
    event.stopPropagation();
  };

  return (
    <FormBase {...props}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={isInvalid}
            id={field.name}
            className="h-auto min-h-9 w-full justify-between bg-input/20"
            disabled={loading}
            type="button"
          >
            {selectedOptions.length > 0 ? (
              displayValueType === "label" ? (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                      style={
                        typeof option.color === "string"
                          ? {
                              backgroundColor: option.color,
                              color: "#fff",
                              borderColor: "transparent",
                            }
                          : undefined
                      }
                    >
                      {option.label}
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeOption(option.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            removeOption(option.value);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {option.label}</span>
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <span>{selectedOptions.length} selected</span>
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {open ? (
              <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-1 bg-white"
          align="start"
          onWheel={stopScrollPropagation}
        >
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : options.length > 0 ? (
            <div
              className="max-h-60 overflow-y-auto overscroll-contain"
              onWheel={stopScrollPropagation}
            >
              <ul className="flex flex-col gap-0.5 p-0.5" role="listbox">
                {options.map((option) => {
                  const isActive = field.state.value.includes(option.value);
                  const isDisabled =
                    !isActive &&
                    maxSelections !== undefined &&
                    field.state.value.length >= maxSelections;

                  return (
                    <li key={option.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        disabled={isDisabled}
                        onClick={() => toggleOption(option)}
                        className={cn(
                          "flex w-full min-h-7 cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs/relaxed outline-hidden select-none",
                          "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "focus-visible:bg-muted",
                          isDisabled && "pointer-events-none opacity-50",
                        )}
                      >
                        {typeof option.color === "string" && (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span>{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </FormBase>
  );
}
