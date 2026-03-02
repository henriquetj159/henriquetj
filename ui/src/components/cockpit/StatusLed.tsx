import type { SourceHealth } from "./types";

type StatusLedProps = {
  source: SourceHealth;
};

export function StatusLed({ source }: StatusLedProps) {
  return (
    <div className="status-item">
      <span>{source.label}</span>
      <span className="led" data-state={source.state} />
    </div>
  );
}
