"use client";

import * as React from "react";

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

type HoverState = {
  activeIndex: number;
  mode: "series" | "event";
} | null;

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
  const [hoverState, setHoverState] = React.useState<HoverState>(null);

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

  const activeIndex =
    hoverState && data[hoverState.activeIndex] ? hoverState.activeIndex : null;
  const activeDatum = activeIndex === null ? null : data[activeIndex];
  const activeX = activeIndex === null ? null : xPositions[activeIndex];
  const activeEvents =
    activeIndex === null ? [] : markerGroups.get(activeIndex) ?? [];
  const tickIndexes = React.useMemo(
    () => buildTickIndexes(data.length, compact ? 4 : 6),
    [compact, data.length]
  );

  const handleMove = React.useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      if (data.length === 0) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX =
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * dimensions.width;
      const ratio = clamp((relativeX - plotLeft) / plotWidth, 0, 1);
      const index = Math.round(ratio * Math.max(data.length - 1, 0));

      setHoverState({
        activeIndex: index,
        mode: "series",
      });
    },
    [data.length, dimensions.width, plotLeft, plotWidth]
  );

  const handleLeave = React.useCallback(() => {
    setHoverState(null);
  }, []);

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
  const tooltipLeft =
    activeX === null
      ? 0
      : clamp(
          activeX + 18,
          10,
          Math.max(dimensions.width - tooltipWidth - 10, 10)
        );

  return (
    <div ref={ref} className={cn("relative w-full select-none", className)}>
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
          stroke="currentColor"
          opacity={0.16}
        />
        <line
          x1={plotLeft}
          x2={plotRight}
          y1={eventCenterY}
          y2={eventCenterY}
          stroke="currentColor"
          strokeDasharray="4 8"
          opacity={0.14}
        />

        {pointsBySeries.map((item) => (
          <path
            key={`${item.key}-area`}
            d={item.areaPath}
            fill={`url(#${gradientId}-${item.key})`}
          />
        ))}

        {pointsBySeries.map((item) => (
          <path
            key={`${item.key}-line`}
            d={item.linePath}
            fill="none"
            stroke={item.color}
            strokeWidth={item.strokeWidth ?? (compact ? 2.3 : 3)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {activeX !== null ? (
          <>
            <line
              x1={activeX}
              x2={activeX}
              y1={trendTop}
              y2={trendBottom}
              stroke="currentColor"
              opacity={0.16}
            />
            <line
              x1={activeX}
              x2={activeX}
              y1={dividerY}
              y2={eventCenterY}
              stroke="currentColor"
              opacity={0.16}
            />
          </>
        ) : null}

        {activeDatum && activeIndex !== null
          ? pointsBySeries.map((item) => {
              const value = activeDatum[item.key];

              if (typeof value !== "number") {
                return null;
              }

              return (
                <g key={`${item.key}-active`}>
                  <circle
                    cx={xPositions[activeIndex]}
                    cy={yForValue(value)}
                    r={compact ? 5.5 : 6.6}
                    fill={item.color}
                    opacity={0.18}
                  />
                  <circle
                    cx={xPositions[activeIndex]}
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
            const isActive =
              hoverState?.mode === "event" && activeIndex === index;

            return (
              <g key={event.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={compact ? 9 : 11}
                  fill="transparent"
                  pointerEvents="all"
                  onPointerEnter={() =>
                    setHoverState({ activeIndex: index, mode: "event" })
                  }
                />
                <circle
                  cx={x}
                  cy={y}
                  r={compact ? 4.4 : 5.2}
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
            fill="currentColor"
            opacity={0.52}
            fontSize={compact ? 11 : 12}
            textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
          >
            {formatXAxisLabel(data[index].timestamp, index)}
          </text>
        ))}

        <rect
          x={plotLeft}
          y={trendTop}
          width={plotWidth}
          height={eventCenterY - trendTop + 20}
          fill="transparent"
          pointerEvents="all"
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        />
      </svg>

      {activeDatum && activeX !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10"
          style={{ left: tooltipLeft, width: tooltipWidth }}
        >
          {hoverState?.mode === "event" && activeEvents.length > 0 ? (
            <div className="mote-glass-panel-soft rounded-[28px] border border-border/55 bg-card/78 p-4 text-sm text-popover-foreground shadow-surface backdrop-blur-2xl">
              <p className="mb-3 font-heading text-lg leading-none text-foreground">
                {formatTimestamp(activeDatum.timestamp)}
              </p>
              <div className="space-y-3">
                {activeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-border/35 bg-background/18 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-foreground">{event.title}</p>
                        {event.subtitle ? (
                          <p className="text-muted-foreground">{event.subtitle}</p>
                        ) : null}
                        {event.meta ? (
                          <p className="text-caption text-muted-foreground">
                            {event.meta}
                          </p>
                        ) : null}
                        {event.details?.length ? (
                          <div className="space-y-1 pt-1 text-caption text-muted-foreground">
                            {event.details.map((detail) => (
                              <p key={`${event.id}-${detail}`}>{detail}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mote-glass-panel-soft rounded-[30px] border border-border/55 bg-card/76 p-4 text-sm text-popover-foreground shadow-surface backdrop-blur-2xl">
              <p className="mb-3 font-heading text-[clamp(1.25rem,2vw,1.9rem)] leading-none text-foreground">
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
          )}
        </div>
      ) : null}
    </div>
  );
}
