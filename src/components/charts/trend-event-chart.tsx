"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/cn";

type TrendEventChartDatum = {
  timestamp: string;
  label?: string;
  [key: string]: number | string | undefined;
};

type NumericSeriesKey<T extends TrendEventChartDatum> = Extract<
  {
    [K in keyof T]: T[K] extends number | undefined ? K : never;
  }[keyof T],
  string
>;

export type TrendEventChartSeries<T extends TrendEventChartDatum> = {
  key: NumericSeriesKey<T>;
  label: string;
  color: string;
  unit?: string;
  strokeWidth?: number;
  valueFormatter?: (value: number) => string;
};

export type TrendEventChartEvent = {
  id: string;
  timestamp: string;
  color: string;
  title: string;
  subtitle?: string;
  meta?: string;
  rows?: readonly {
    label: string;
    value: string;
  }[];
  note?: string;
  details?: readonly string[];
};

type TrendEventChartProps<T extends TrendEventChartDatum> = {
  data: readonly T[];
  series: readonly TrendEventChartSeries<T>[];
  events?: readonly TrendEventChartEvent[];
  compact?: boolean;
  className?: string;
  emptyState?: React.ReactNode;
  formatTimestamp?: (timestamp: string) => string;
  formatXAxisLabel?: (timestamp: string, index: number) => string;
};

type ChartPoint = {
  x: number;
  y: number;
};

const defaultTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const defaultXAxisFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] ?? next;

    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;
    const controlTwoY = next.y - (following.y - current.y) / 6;

    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }

  return path;
}

function buildAreaPath(points: ChartPoint[], baselineY: number) {
  if (!points.length) {
    return "";
  }

  return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

function buildTickIndexes(length: number, desiredTickCount: number) {
  if (length <= desiredTickCount) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>([0, length - 1]);
  const segments = Math.max(1, desiredTickCount - 1);

  for (let step = 1; step < segments; step += 1) {
    indexes.add(Math.round((step * (length - 1)) / segments));
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

const tooltipGlassStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, color-mix(in oklab, var(--popover) 72%, transparent), color-mix(in oklab, var(--card) 68%, transparent))",
  backdropFilter: "blur(28px) saturate(145%)",
  WebkitBackdropFilter: "blur(28px) saturate(145%)",
  boxShadow: "var(--mote-surface-shadow), var(--mote-glass-highlight)",
};

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

export function TrendEventChart<T extends TrendEventChartDatum>({
  data,
  series,
  events = [],
  compact = false,
  className,
  emptyState,
  formatTimestamp = (timestamp) =>
    defaultTimestampFormatter.format(new Date(timestamp)),
  formatXAxisLabel = (timestamp) =>
    defaultXAxisFormatter.format(new Date(timestamp)),
}: TrendEventChartProps<T>) {
  const gradientId = React.useId().replaceAll(":", "");
  const { ref, width: measuredWidth } = useMeasuredWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [containerRect, setContainerRect] = React.useState<DOMRect | null>(null);
  const [trendHoverY, setTrendHoverY] = React.useState<number | null>(null);

  const dimensions = React.useMemo(
    () => ({
      width: Math.max(Math.round(measuredWidth), compact ? 480 : 720),
      marginTop: compact ? 12 : 18,
      marginRight: compact ? 14 : 22,
      marginBottom: compact ? 34 : 44,
      marginLeft: compact ? 14 : 22,
      trendHeight: compact ? 158 : 268,
      laneGap: compact ? 18 : 22,
      eventHeight: compact ? 46 : 72,
    }),
    [compact, measuredWidth]
  );

  const totalHeight =
    dimensions.marginTop +
    dimensions.trendHeight +
    dimensions.laneGap +
    dimensions.eventHeight +
    dimensions.marginBottom;
  const plotLeft = dimensions.marginLeft;
  const plotRight = dimensions.width - dimensions.marginRight;
  const plotWidth = Math.max(plotRight - plotLeft, 1);
  const trendTop = dimensions.marginTop;
  const trendBottom = trendTop + dimensions.trendHeight;
  const dividerY = trendBottom + Math.max(dimensions.laneGap * 0.35, 10);
  const eventTop = dividerY + Math.max(dimensions.laneGap * 0.65, 8);
  const eventCenterY = eventTop + dimensions.eventHeight / 2;
  const axisY = totalHeight - 12;

  const resolvedSeries = React.useMemo(
    () =>
      series.filter((item) =>
        data.some((point) => typeof point[item.key] === "number")
      ),
    [data, series]
  );

  const xPositions = React.useMemo(() => {
    if (data.length <= 1) {
      return [plotLeft + plotWidth / 2];
    }

    return data.map(
      (_, index) => plotLeft + (index / (data.length - 1)) * plotWidth
    );
  }, [data, plotLeft, plotWidth]);

  const valueDomain = React.useMemo(() => {
    const values = resolvedSeries.flatMap((item) =>
      data.flatMap((point) => {
        const rawValue = point[item.key];
        return typeof rawValue === "number" ? [rawValue] : [];
      })
    );

    if (!values.length) {
      return { min: 0, max: 1 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || Math.max(Math.abs(max) * 0.2, 1);
    const padding = range * 0.14;

    return {
      min: min - padding,
      max: max + padding,
    };
  }, [data, resolvedSeries]);

  const yForValue = React.useCallback(
    (value: number) => {
      const range = valueDomain.max - valueDomain.min || 1;
      const progress = (value - valueDomain.min) / range;
      return trendBottom - progress * dimensions.trendHeight;
    },
    [dimensions.trendHeight, trendBottom, valueDomain.max, valueDomain.min]
  );

  const pointsBySeries = React.useMemo(() => {
    return resolvedSeries.map((item) => {
      const points = data.flatMap((datum, index) => {
        const rawValue = datum[item.key];

        if (typeof rawValue !== "number") {
          return [];
        }

        return [
          {
            x: xPositions[index],
            y: yForValue(rawValue),
          },
        ];
      });

      return {
        ...item,
        points,
        linePath: buildSmoothPath(points),
        areaPath: buildAreaPath(points, trendBottom),
      };
    });
  }, [data, resolvedSeries, trendBottom, xPositions, yForValue]);

  const markerGroups = React.useMemo(() => {
    if (!data.length || !events.length) {
      return new Map<number, TrendEventChartEvent[]>();
    }

    const timeValues = data.map((point) => new Date(point.timestamp).getTime());

    return events.reduce((groups, event) => {
      const target = new Date(event.timestamp).getTime();

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      timeValues.forEach((timeValue, index) => {
        const distance = Math.abs(timeValue - target);

        if (distance < nearestDistance) {
          nearestIndex = index;
          nearestDistance = distance;
        }
      });

      const existing = groups.get(nearestIndex);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(nearestIndex, [event]);
      }

      return groups;
    }, new Map<number, TrendEventChartEvent[]>());
  }, [data, events]);

  const resolvedActiveIndex =
    activeIndex !== null && data[activeIndex] ? activeIndex : null;
  const activeDatum = resolvedActiveIndex === null ? null : data[resolvedActiveIndex];
  const activeX = resolvedActiveIndex === null ? null : xPositions[resolvedActiveIndex];
  const activeEvents =
    resolvedActiveIndex === null ? [] : markerGroups.get(resolvedActiveIndex) ?? [];
  const activeSeriesYPositions =
    activeDatum === null
      ? []
      : resolvedSeries.flatMap((item) => {
          const value = activeDatum[item.key];
          return typeof value === "number" ? [yForValue(value)] : [];
        });
  const tickIndexes = React.useMemo(
    () => buildTickIndexes(data.length, compact ? 4 : 6),
    [compact, data.length]
  );

  const handleMove = React.useCallback(
    (event: React.PointerEvent<SVGRectElement>, region: "trend" | "event") => {
      if (data.length === 0) {
        return;
      }

      if (ref.current) {
        setContainerRect(ref.current.getBoundingClientRect());
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX =
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * dimensions.width;
      const ratio = clamp((relativeX - plotLeft) / plotWidth, 0, 1);
      const index = Math.round(ratio * Math.max(data.length - 1, 0));

      setActiveIndex(index);
      if (region === "trend") {
        const relativeY =
          ((event.clientY - rect.top) / Math.max(rect.height, 1)) *
            dimensions.trendHeight +
          trendTop;
        setTrendHoverY(clamp(relativeY, trendTop, trendBottom));
      } else {
        setTrendHoverY(null);
      }
    },
    [
      data.length,
      dimensions.trendHeight,
      dimensions.width,
      plotLeft,
      plotWidth,
      ref,
      trendBottom,
      trendTop,
    ]
  );

  const handleLeave = React.useCallback(() => {
    setActiveIndex(null);
    setTrendHoverY(null);
  }, []);

  const handleMarkerEnter = React.useCallback((index: number) => {
    if (ref.current) {
      setContainerRect(ref.current.getBoundingClientRect());
    }

    setActiveIndex(index);
    setTrendHoverY(null);
  }, [ref]);

  const updateContainerRect = React.useCallback(() => {
    if (!ref.current) {
      return;
    }

    setContainerRect(ref.current.getBoundingClientRect());
  }, [ref]);

  React.useEffect(() => {
    updateContainerRect();
  }, [measuredWidth, updateContainerRect]);

  React.useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    updateContainerRect();

    const handleWindowUpdate = () => updateContainerRect();

    window.addEventListener("resize", handleWindowUpdate);
    window.addEventListener("scroll", handleWindowUpdate, true);

    return () => {
      window.removeEventListener("resize", handleWindowUpdate);
      window.removeEventListener("scroll", handleWindowUpdate, true);
    };
  }, [activeIndex, updateContainerRect]);

  if (!data.length || !resolvedSeries.length) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] items-center justify-center rounded-panel border border-dashed border-border/70 bg-secondary/30 px-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        {emptyState ?? "Choose at least one metric to render a trend."}
      </div>
    );
  }

  const tooltipWidth = compact ? 244 : 324;
  const eventTooltipWidth = compact ? 252 : 336;
  const tooltipLeft =
    activeX === null
      ? 0
      : clamp(
          activeX + 18,
          10,
          Math.max(dimensions.width - tooltipWidth - 10, 10)
        );
  const eventTooltipLeft =
    activeX === null
      ? 0
      : clamp(
          activeX - eventTooltipWidth / 2,
          10,
          Math.max(dimensions.width - eventTooltipWidth - 10, 10)
        );
  const trendTooltipAnchorY =
    trendHoverY ??
    (activeSeriesYPositions.length
      ? activeSeriesYPositions.reduce((sum, value) => sum + value, 0) /
        activeSeriesYPositions.length
      : trendTop + dimensions.trendHeight / 2);
  const trendTooltipTop = clamp(
    trendTooltipAnchorY - (compact ? 60 : 96),
    trendTop + (compact ? 4 : 6),
    trendBottom - (compact ? 86 : 152)
  );
  const eventTooltipTop = dividerY + (compact ? 10 : 12);
  const scaleX =
    containerRect && dimensions.width > 0
      ? containerRect.width / dimensions.width
      : 1;
  const scaleY =
    containerRect && totalHeight > 0 ? containerRect.height / totalHeight : 1;

  return (
    <div
      ref={ref}
      className={cn("relative w-full select-none", className)}
      onPointerLeave={handleLeave}
    >
      <svg
        viewBox={`0 0 ${dimensions.width} ${totalHeight}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Telemetry trend chart with synchronized event timeline"
      >
        <defs>
          {pointsBySeries.map((item) => (
            <linearGradient
              key={`${gradientId}-${item.key}`}
              id={`${gradientId}-${item.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="4%"
                stopColor={item.color}
                stopOpacity={compact ? 0.24 : 0.3}
              />
              <stop offset="100%" stopColor={item.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: 5 }, (_, index) => {
          const y = trendTop + (index / 4) * dimensions.trendHeight;
          return (
            <line
              key={`grid-${index}`}
              x1={plotLeft}
              x2={plotRight}
              y1={y}
              y2={y}
              pointerEvents="none"
              stroke="currentColor"
              strokeDasharray="4 8"
              opacity={0.14}
            />
          );
        })}

        <line
          x1={plotLeft}
          x2={plotRight}
          y1={dividerY}
          y2={dividerY}
          pointerEvents="none"
          stroke="currentColor"
          opacity={0.16}
        />
        <line
          x1={plotLeft}
          x2={plotRight}
          y1={eventCenterY}
          y2={eventCenterY}
          pointerEvents="none"
          stroke="currentColor"
          strokeDasharray="4 8"
          opacity={0.14}
        />

        {pointsBySeries.map((item) => (
          <path
            key={`${item.key}-area`}
            d={item.areaPath}
            pointerEvents="none"
            fill={`url(#${gradientId}-${item.key})`}
          />
        ))}

        {pointsBySeries.map((item) => (
          <path
            key={`${item.key}-line`}
            d={item.linePath}
            fill="none"
            pointerEvents="none"
            stroke={item.color}
            strokeWidth={item.strokeWidth ?? (compact ? 2.3 : 3)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <rect
          x={plotLeft}
          y={trendTop}
          width={plotWidth}
          height={trendBottom - trendTop}
          fill="transparent"
          pointerEvents="all"
          onPointerMove={(event) => handleMove(event, "trend")}
        />

        <rect
          x={plotLeft}
          y={dividerY}
          width={plotWidth}
          height={totalHeight - dividerY - 24}
          fill="transparent"
          pointerEvents="all"
          onPointerMove={(event) => handleMove(event, "event")}
        />

        {activeX !== null ? (
          <>
            <line
              x1={activeX}
              x2={activeX}
              y1={trendTop}
              y2={trendBottom}
              pointerEvents="none"
              stroke="currentColor"
              opacity={0.16}
            />
            <line
              x1={activeX}
              x2={activeX}
              y1={dividerY}
              y2={eventCenterY}
              pointerEvents="none"
              stroke="currentColor"
              opacity={0.16}
            />
          </>
        ) : null}

        {activeDatum && resolvedActiveIndex !== null
          ? pointsBySeries.map((item) => {
              const value = activeDatum[item.key];

              if (typeof value !== "number") {
                return null;
              }

              return (
                <g key={`${item.key}-active`} pointerEvents="none">
                  <circle
                    cx={xPositions[resolvedActiveIndex]}
                    cy={yForValue(value)}
                    r={compact ? 5.5 : 6.6}
                    fill={item.color}
                    opacity={0.18}
                  />
                  <circle
                    cx={xPositions[resolvedActiveIndex]}
                    cy={yForValue(value)}
                    r={compact ? 3.4 : 4.6}
                    fill={item.color}
                    stroke="var(--background)"
                    strokeWidth={2.5}
                  />
                </g>
              );
            })
          : null}

        {Array.from(markerGroups.entries()).map(([index, group]) => {
          const x = xPositions[index];
          const startOffset =
            -((group.length - 1) * (compact ? 12 : 16)) / 2;

          return group.map((event, markerIndex) => {
            const y = eventCenterY + startOffset + markerIndex * (compact ? 12 : 16);
            const isActive = resolvedActiveIndex === index;

            return (
              <g key={event.id} onPointerEnter={() => handleMarkerEnter(index)}>
                <circle
                  cx={x}
                  cy={y}
                  r={compact ? 9 : 11}
                  fill="transparent"
                  pointerEvents="all"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={compact ? 4.4 : 5.2}
                  pointerEvents="none"
                  fill={event.color}
                  stroke={isActive ? "var(--background)" : "none"}
                  strokeWidth={isActive ? 2.2 : 0}
                />
              </g>
            );
          });
        })}

        {tickIndexes.map((index) => (
          <text
            key={`tick-${data[index].timestamp}`}
            x={xPositions[index]}
            y={axisY}
            pointerEvents="none"
            fill="currentColor"
            opacity={0.52}
            fontSize={compact ? 11 : 12}
            textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
          >
            {formatXAxisLabel(data[index].timestamp, index)}
          </text>
        ))}
      </svg>

      {activeDatum &&
      activeX !== null &&
      containerRect &&
      typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                className="pointer-events-none fixed left-0 top-0 z-[70] transition-[transform,opacity,filter] duration-[340ms] ease-[cubic-bezier(0.16,0.84,0.24,1)] will-change-transform"
                style={{
                  width: tooltipWidth,
                  opacity: 1,
                  transform: `translate3d(${containerRect.left + tooltipLeft * scaleX}px, ${containerRect.top + trendTooltipTop * scaleY}px, 0)`,
                }}
              >
                <div
                  className="border border-border/55 p-4 text-sm text-popover-foreground"
                  style={{ ...tooltipGlassStyle, borderRadius: "var(--radius-panel)" }}
                >
                  <p className="mb-3 font-heading text-lg leading-none text-foreground">
                    {formatTimestamp(activeDatum.timestamp)}
                  </p>
                  <div className="space-y-2.5">
                    {resolvedSeries.map((item) => {
                      const value = activeDatum[item.key];

                      if (typeof value !== "number") {
                        return null;
                      }

                      const formattedValue = item.valueFormatter
                        ? item.valueFormatter(value)
                        : formatNumber(value);

                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="flex min-w-0 items-center gap-2.5 text-[15px] text-muted-foreground">
                            <span
                              className="size-3 shrink-0 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">
                              {item.label}
                              {item.unit ? ` (${item.unit})` : ""}
                            </span>
                          </span>
                          <span className="font-heading text-xl leading-none text-foreground">
                            {formattedValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none fixed left-0 top-0 z-[70] transition-[transform,opacity,filter] duration-[340ms] ease-[cubic-bezier(0.16,0.84,0.24,1)] will-change-transform"
                style={{
                  width: eventTooltipWidth,
                  opacity: activeEvents.length > 0 ? 1 : 0,
                  transform: `translate3d(${containerRect.left + eventTooltipLeft * scaleX}px, ${containerRect.top + eventTooltipTop * scaleY}px, 0)`,
                }}
              >
                <div
                  className="border border-border/55 p-4 text-sm text-popover-foreground"
                  style={{ ...tooltipGlassStyle, borderRadius: "var(--radius-panel)" }}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-heading text-lg leading-none text-foreground">
                      {formatTimestamp(activeDatum.timestamp)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {activeEvents.map((event) => (
                        <span
                          key={`${event.id}-header-dot`}
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                      ))}
                    </div>
                  </div>
                    <div className="space-y-3">
                      {activeEvents.map((event, index) => (
                        <div
                          key={event.id}
                          className="grid gap-3"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-[15px] text-muted-foreground">
                                {event.title}
                              </span>
                              <span className="text-right font-medium text-foreground">
                                {event.subtitle ?? event.meta ?? ""}
                              </span>
                            </div>
                            {(event.rows ?? []).map((row) => (
                              <div
                                key={`${event.id}-${row.label}-${row.value}`}
                                className="flex items-start justify-between gap-4"
                              >
                                <span className="text-[15px] text-muted-foreground">
                                  {row.label}
                                </span>
                                <span className="text-right font-medium text-foreground">
                                  {row.value}
                                </span>
                              </div>
                            ))}
                            {event.note ? (
                              <p className="pt-1 text-caption text-muted-foreground">
                                {event.note}
                              </p>
                            ) : event.details?.length ? (
                              <div className="space-y-1 pt-1 text-caption text-muted-foreground">
                                {event.details.map((detail) => (
                                  <p key={`${event.id}-${detail}`}>{detail}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          {index < activeEvents.length - 1 ? (
                            <div className="border-t border-border/25" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
