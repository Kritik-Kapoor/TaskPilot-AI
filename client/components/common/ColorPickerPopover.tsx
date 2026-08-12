"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";

type ColorPickerPopoverProps = {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function ColorPickerPopover({
  color,
  onChange,
  disabled,
  size = "md",
}: ColorPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label="Pick color"
          className={cn(
            "rounded-full border-2 border-border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !disabled && "hover:scale-110 cursor-pointer",
            disabled && "cursor-default opacity-50",
            size === "sm" ? "h-4 w-4" : "h-6 w-6",
          )}
          style={{ background: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <HexColorPicker color={color} onChange={onChange} />
        <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
          {color.toUpperCase()}
        </p>
      </PopoverContent>
    </Popover>
  );
}
