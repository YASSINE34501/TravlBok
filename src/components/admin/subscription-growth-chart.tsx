type TrendPoint = { month: string; netNew: number };

const WIDTH = 640;
const HEIGHT = 160;
const PADDING = 28;

/**
 * Single-series net-new-subscriptions trend, last 6 months. One series needs
 * no legend (the title names it); thin 2px line with rounded caps, a
 * recessive gridline/baseline, and a direct label on the last point per the
 * dataviz method. Colors reuse this app's existing shadcn/Tailwind theme
 * tokens (currentColor via text-primary/text-muted-foreground/text-border)
 * rather than a separate hardcoded palette, so it already tracks the app's
 * light/dark theme.
 */
export function SubscriptionGrowthChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.netNew);
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const zeroY = HEIGHT / 2;
  const usableHalfHeight = HEIGHT / 2 - PADDING / 2;

  const stepX = (WIDTH - PADDING * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => ({
    x: PADDING + i * stepX,
    y: zeroY - (d.netNew / maxAbs) * usableHalfHeight,
    ...d,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full text-primary"
      role="img"
      aria-label="Net new subscriptions, last 6 months"
    >
      <line
        x1={PADDING}
        y1={zeroY}
        x2={WIDTH - PADDING}
        y2={zeroY}
        className="stroke-border"
        strokeWidth={1}
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={p.month} cx={p.x} cy={p.y} r={3} fill="currentColor">
          <title>
            {p.month}: {p.netNew >= 0 ? "+" : ""}
            {p.netNew} net new
          </title>
        </circle>
      ))}
      {points.map((p) => (
        <text
          key={`label-${p.month}`}
          x={p.x}
          y={HEIGHT - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          {p.month.slice(5)}
        </text>
      ))}
      <text
        x={last.x}
        y={last.y - 8}
        textAnchor="end"
        className="fill-primary text-xs font-medium"
        fontSize={11}
      >
        {last.netNew >= 0 ? "+" : ""}
        {last.netNew}
      </text>
    </svg>
  );
}
