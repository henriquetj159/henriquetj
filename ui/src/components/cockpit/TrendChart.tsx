type TrendChartProps = {
  bars: number[];
};

export function TrendChart({ bars }: TrendChartProps) {
  return (
    <div className="bars" aria-label="Trend chart">
      {bars.map((height, index) => (
        <div
          key={`bar-${index + 1}`}
          className="bar"
          style={{ height: `${height}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
