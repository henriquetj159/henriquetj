import type { GaugeLevel } from "./types";

type GaugeDialProps = {
  label: string;
  level: GaugeLevel;
};

export function GaugeDial({ label, level }: GaugeDialProps) {
  return (
    <section className="gauge">
      <p className="cockpit-subtitle">{label}</p>
      <div className="dial">
        <div className="needle" data-level={level} />
      </div>
    </section>
  );
}
