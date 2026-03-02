import type { Metric } from "./types";

type MetricCardProps = {
  metric: Metric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <section className="metric-card">
      <p className="metric-name">{metric.name}</p>
      <p className="metric-value">{metric.value}</p>
      <p className="metric-delta" data-tone={metric.tone}>
        {metric.delta} vs periodo anterior
      </p>
    </section>
  );
}
