"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GroupProps } from "@/types/utility";

type DropdownHeader = {
  title: string;
  subtitle?: string;
};

interface DropdownProps {
  trigger: React.ReactNode;
  title?: React.ReactNode;
  header?: DropdownHeader;
  groups: Array<GroupProps>;
  align?: "center" | "end" | "start";
  openOnHover?: boolean;
}

const alignClasses = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

const menuItemClassName =
  "relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-input/50 focus-visible:bg-input/50";

const DropdownHeaderSection = ({
  header,
  variant,
}: {
  header: DropdownHeader;
  variant: "menu" | "hover";
}) => (
  <>
    <div className="px-3 py-2.5">
      <p className="text-sm font-semibold leading-none">{header.title}</p>
      {header.subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{header.subtitle}</p>
      )}
    </div>
    {variant === "menu" ? (
      <DropdownMenuSeparator />
    ) : (
      <div className="-mx-1 my-1 h-px bg-border" />
    )}
  </>
);

type DropdownMenuBodyProps = {
  title?: React.ReactNode;
  header?: DropdownHeader;
  groups: GroupProps[];
  variant: "menu" | "hover";
};

const DropdownMenuBody = ({
  title,
  header,
  groups,
  variant,
}: DropdownMenuBodyProps) => (
  <>
    {header && <DropdownHeaderSection header={header} variant={variant} />}
    {title && !header && (
      <>
        <div className="p-2 text-sm font-semibold">{title}</div>
        {variant === "menu" ? (
          <DropdownMenuSeparator />
        ) : (
          <div className="-mx-1 my-1 h-px bg-border" />
        )}
      </>
    )}
    {groups.map((group, groupIndex) => (
      <React.Fragment key={groupIndex}>
        {group.label &&
          (variant === "menu" ? (
            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          ) : (
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {group.label}
            </div>
          ))}
        {variant === "menu" ? (
          <DropdownMenuGroup>
            {group.actions.map((action, actionIndex) => (
              <DropdownMenuItem
                key={actionIndex}
                onClick={action.onClick}
                className="flex cursor-pointer items-center gap-2"
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : (
          <div role="group">
            {group.actions.map((action, actionIndex) => (
              <button
                key={actionIndex}
                type="button"
                onClick={action.onClick}
                className={menuItemClassName}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
        {groupIndex < groups.length - 1 &&
          (variant === "menu" ? (
            <DropdownMenuSeparator />
          ) : (
            <div className="-mx-1 my-1 h-px bg-border" />
          ))}
      </React.Fragment>
    ))}
  </>
);

const Dropdown = ({
  trigger,
  title,
  header,
  groups,
  align = "center",
  openOnHover = false,
}: DropdownProps) => {
  if (openOnHover) {
    return (
      <div className="group relative">
        {trigger}
        <div
          className={cn(
            "absolute top-full z-50 pt-1",
            alignClasses[align],
            "pointer-events-none opacity-0 transition-opacity duration-150",
            "group-hover:pointer-events-auto group-hover:opacity-100",
            "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          )}
        >
          <div className="min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <DropdownMenuBody
              title={title}
              header={header}
              groups={groups}
              variant="hover"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" align={align}>
        <DropdownMenuBody
          title={title}
          header={header}
          groups={groups}
          variant="menu"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Dropdown;
