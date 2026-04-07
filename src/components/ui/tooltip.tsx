"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  delay?: number;
  triggerMode?: "hover" | "click";
  showArrow?: boolean;
  offset?: { x?: number; y?: number };
}

export function Tooltip({
  children,
  content,
  side = "right",
  align = "center",
  className,
  delay = 200,
  triggerMode = "hover",
  showArrow = false,
  offset = { x: 0, y: 0 },
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const [arrowOffset, setArrowOffset] = React.useState(0);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    const gap = 12;

    // Initial position based on side
    if (side === "right") {
      top = triggerRect.top + scrollY + triggerRect.height / 2 - contentRect.height / 2;
      left = triggerRect.right + scrollX + gap;
    } else if (side === "left") {
      top = triggerRect.top + scrollY + triggerRect.height / 2 - contentRect.height / 2;
      left = triggerRect.left + scrollX - contentRect.width - gap;
    } else if (side === "top") {
      top = triggerRect.top + scrollY - contentRect.height - gap;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - contentRect.width / 2;
    } else if (side === "bottom") {
      top = triggerRect.bottom + scrollY + gap;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - contentRect.width / 2;
    }

    // Apply manual offset
    top += offset.y || 0;
    left += offset.x || 0;

    // Viewport collision detection and correction
    const padding = 8;
    let shiftX = 0;
    let shiftY = 0;

    // Correct Horizontal
    if (left < scrollX + padding) {
      shiftX = (scrollX + padding) - left;
    } else if (left + contentRect.width > scrollX + viewportWidth - padding) {
      shiftX = (scrollX + viewportWidth - padding) - (left + contentRect.width);
    }

    // Correct Vertical
    if (top < scrollY + padding) {
      shiftY = (scrollY + padding) - top;
    } else if (top + contentRect.height > scrollY + viewportHeight - padding) {
      shiftY = (scrollY + viewportHeight - padding) - (top + contentRect.height);
    }

    left += shiftX;
    top += shiftY;

    // Calculate arrow offset to point to trigger center
    let currentArrowOffset = 0;
    if (side === "left" || side === "right") {
      // Arrow moves vertically
      const triggerCenterY = triggerRect.top + triggerRect.height / 2;
      const contentCenterY = (top - scrollY) + contentRect.height / 2;
      currentArrowOffset = triggerCenterY - contentCenterY;
      
      // Limit arrow offset so it doesn't go outside the content radius
      const maxOffset = contentRect.height / 2 - 12;
      currentArrowOffset = Math.max(-maxOffset, Math.min(maxOffset, currentArrowOffset));
    } else {
      // Arrow moves horizontally
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const contentCenterX = (left - scrollX) + contentRect.width / 2;
      currentArrowOffset = triggerCenterX - contentCenterX;

      const maxOffset = contentRect.width / 2 - 12;
      currentArrowOffset = Math.max(-maxOffset, Math.min(maxOffset, currentArrowOffset));
    }

    setCoords({ top, left });
    setArrowOffset(currentArrowOffset);
  }, [side, offset.x, offset.y]);

  // Re-run position on mount or when content changes
  React.useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition, content]);

  const onMouseEnter = () => {
    if (triggerMode !== "hover") return;
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const onMouseLeave = () => {
    if (triggerMode !== "hover") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  const onClick = () => {
    if (triggerMode !== "click") return;
    setOpen((prev) => !prev);
  };

  React.useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        triggerMode === "click" &&
        !triggerRef.current?.contains(event.target as Node) &&
        !contentRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("pointerdown", handleOutsideClick);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, triggerMode, updatePosition]);

  const arrowStyles = React.useMemo(() => {
    if (!showArrow) return null;

    const common = "absolute size-2 rotate-45 border border-border/60 bg-popover z-[1]";
    
    if (side === "right") {
      return {
        className: cn(common, "left-0 -translate-x-[5px] border-r-0 border-t-0"),
        style: { top: `calc(50% + ${arrowOffset}px)`, marginTop: "-4px" }
      };
    }
    if (side === "left") {
      return {
        className: cn(common, "right-0 translate-x-[5px] border-l-0 border-b-0"),
        style: { top: `calc(50% + ${arrowOffset}px)`, marginTop: "-4px" }
      };
    }
    if (side === "top") {
      return {
        className: cn(common, "bottom-0 translate-y-[5px] border-l-0 border-t-0"),
        style: { left: `calc(50% + ${arrowOffset}px)`, marginLeft: "-4px" }
      };
    }
    if (side === "bottom") {
      return {
        className: cn(common, "top-0 -translate-y-[5px] border-r-0 border-b-0"),
        style: { left: `calc(50% + ${arrowOffset}px)`, marginLeft: "-4px" }
      };
    }
    return null;
  }, [showArrow, side, arrowOffset]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="inline-block"
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={contentRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 100,
              visibility: coords.top === 0 ? "hidden" : "visible", // Hide until first calculation
            }}
            className={cn(
              "mote-floating-panel min-w-32 overflow-visible rounded-[0.75rem] border border-border/60 bg-popover/92 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200",
              className
            )}
          >
            {showArrow && arrowStyles && (
              <div className={arrowStyles.className} style={arrowStyles.style} />
            )}
            <div className="relative z-[2]">
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function TooltipItemList({
  items,
  renderItem,
  title,
}: {
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {title && (
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="min-w-0">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export function TooltipItem({
  children,
  active,
  onClick,
  icon,
  showCheckmark = true,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  showCheckmark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-[6px] px-3 py-2.5 text-sm transition-colors duration-200",
        active
          ? "bg-primary/12 text-primary font-medium"
          : "text-foreground/80 hover:text-primary"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </div>
      {active && showCheckmark && <CheckIcon className="size-4 text-primary shrink-0 ml-2" />}
    </button>
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
