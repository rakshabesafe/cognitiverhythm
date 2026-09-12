interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ percent, size = 56, strokeWidth = 5 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={radius} stroke="var(--border)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={clamped >= 100 ? "var(--success)" : "var(--accent)"}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dy="0.32em"
        textAnchor="middle"
        fill="var(--foreground)"
        style={{ fontSize: size * 0.24 }}
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
