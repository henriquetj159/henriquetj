export type MetricTone = "up" | "down";

export type Metric = {
  name: string;
  value: string;
  delta: string;
  tone: MetricTone;
};

export type GaugeLevel = "safe" | "warn";

export type SourceState = "ok" | "delayed" | "unavailable";

export type SourceHealth = {
  label: string;
  state: SourceState;
};
