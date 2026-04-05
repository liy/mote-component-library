"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/cn";

type SelectProps = Omit<React.ComponentProps<"select">, "onChange"> & {
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
};

type ParsedOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
};

function Select({
  className,
  children,
  onChange,
  onValueChange,
  placeholder = "Select",
  value,
  wrapperClassName,
  icon,
  ...props
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<MenuPosition | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const options = React.useMemo(() => parseOptions(children), [children]);
  const selectedValue = value != null ? String(value) : "";
  const selectedOption = options.find((option) => option.value === selectedValue);

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 12;
    const menuGap = 8;
    const spaceBelow = viewportHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    const width = Math.min(rect.width, viewportWidth - gutter * 2);
    const left = Math.min(Math.max(gutter, rect.left), viewportWidth - width - gutter);
    const top = openUpward ? rect.top - menuGap : rect.bottom + menuGap;
    const maxHeight = Math.max(
      140,
      Math.min(288, (openUpward ? spaceAbove : spaceBelow) - menuGap)
    );

    setMenuPosition({
      top,
      left,
      width,
      maxHeight,
      openUpward,
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    updateMenuPosition();

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const commitValue = React.useCallback(
    (nextValue: string) => {
      onValueChange?.(nextValue);

      if (onChange) {
        onChange({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
      }

      setOpen(false);
    },
    [onChange, onValueChange]
  );

  return (
    <div ref={containerRef} className={cn("relative", wrapperClassName)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-[0.75rem] border border-border/70 bg-input px-3.5 text-left text-sm text-foreground backdrop-blur-xl outline-none transition focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...buttonSafeProps(props)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="z-[100] overflow-hidden rounded-[0.75rem] bg-popover/95 p-1.5 shadow-[0_18px_50px_rgba(8,16,12,0.22)] backdrop-blur-2xl"
              style={{
                position: "fixed",
                left: menuPosition.left,
                width: menuPosition.width,
                top: menuPosition.openUpward ? "auto" : menuPosition.top,
                bottom: menuPosition.openUpward
                  ? window.innerHeight - menuPosition.top
                  : "auto",
              }}
            >
              <div
                role="listbox"
                className="overflow-y-auto"
                style={{ maxHeight: menuPosition.maxHeight }}
              >
                {options.map((option) => {
                  const active = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      onClick={() => commitValue(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[0.75rem] px-3 py-2.5 text-sm transition",
                        active
                          ? "bg-primary/12 text-foreground"
                          : "text-foreground/86 hover:bg-background/22",
                        option.disabled && "cursor-not-allowed opacity-40"
                      )}
                    >
                      <span>{option.label}</span>
                      {active ? <CheckIcon className="size-4 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  const parsed: ParsedOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === "option") {
      const optionProps = child.props as {
        value?: string | number;
        children?: React.ReactNode;
        disabled?: boolean;
      };
      parsed.push({
        value: String(optionProps.value ?? ""),
        label: readLabel(optionProps.children),
        disabled: optionProps.disabled,
      });
      return;
    }

    if (child.type === "optgroup") {
      const groupProps = child.props as { children?: React.ReactNode };
      React.Children.forEach(groupProps.children, (nestedChild) => {
        if (!React.isValidElement(nestedChild) || nestedChild.type !== "option") return;

        const nestedProps = nestedChild.props as {
          value?: string | number;
          children?: React.ReactNode;
          disabled?: boolean;
        };

        parsed.push({
          value: String(nestedProps.value ?? ""),
          label: readLabel(nestedProps.children),
          disabled: nestedProps.disabled,
        });
      });
    }
  });

  return parsed;
}

function readLabel(children: React.ReactNode) {
  const text = React.Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? child : ""))
    .join("");

  return text || "Option";
}

function buttonSafeProps(props: Record<string, unknown>) {
  const { multiple, size, ...rest } = props;
  return rest;
}

function ChevronDownIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export { Select };
