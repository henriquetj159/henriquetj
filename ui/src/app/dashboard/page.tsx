import { GaugeDial } from "@/components/cockpit/GaugeDial";
import { MetricCard } from "@/components/cockpit/MetricCard";
import { StatusLed } from "@/components/cockpit/StatusLed";
import { TrendChart } from "@/components/cockpit/TrendChart";
import { getDashboardData } from "@/lib/dashboard-data";
import Link from "next/link";

type DashboardPageProps = {
  searchParams?: Promise<{
    productId?: string;
    period?: string;
  }>;
};

const PERIOD_OPTIONS = [
  { key: "1d", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

const PRODUCT_OPTIONS = [
  { key: "produto-premium-x", label: "Oferta Premium X" },
  { key: "oferta-black", label: "Oferta Black" },
  { key: "curso-pro", label: "Curso PRO" },
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const selectedProduct = params.productId ?? "produto-premium-x";
  const selectedPeriod = params.period ?? "7d";

  const dashboard = await getDashboardData(selectedProduct, selectedPeriod);
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("pt-BR");
  const productLabel = PRODUCT_OPTIONS.find((p) => p.key === selectedProduct)?.label ?? selectedProduct;

  return (
    <main className="cockpit-shell">
      <section className="cockpit-topbar">
        <div>
          <h1 className="cockpit-title">Painel 747 Flight Deck</h1>
          <p className="cockpit-subtitle">Produto ativo: {productLabel} | Modo: Real | Atualizado ha 2 min</p>
        </div>
        <div className="cockpit-chip-row">
          <span className="cockpit-chip">Periodo: {selectedPeriod}</span>
          <span className="cockpit-chip">Fonte principal: Meta Ads</span>
          <span className="cockpit-chip">Expansion Gate: Locked</span>
        </div>
        <div className="cockpit-controls">
          <div className="cockpit-control-group">
            <span className="cockpit-control-label">Produto</span>
            <div className="cockpit-control-options">
              {PRODUCT_OPTIONS.map((product) => (
                <Link
                  key={product.key}
                  href={`/dashboard?productId=${product.key}&period=${selectedPeriod}`}
                  className={`cockpit-control-btn ${product.key === selectedProduct ? "is-active" : ""}`}
                >
                  {product.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="cockpit-control-group">
            <span className="cockpit-control-label">Periodo</span>
            <div className="cockpit-control-options">
              {PERIOD_OPTIONS.map((period) => (
                <Link
                  key={period.key}
                  href={`/dashboard?productId=${selectedProduct}&period=${period.key}`}
                  className={`cockpit-control-btn ${period.key === selectedPeriod ? "is-active" : ""}`}
                >
                  {period.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cockpit-grid">
        <article className="panel top6-panel">
          <header className="panel-title">Core Instruments | Top 6 Metrics</header>
          <div className="top6-grid">
            {dashboard.metrics.map((metric) => (
              <MetricCard key={metric.name} metric={metric} />
            ))}
          </div>
        </article>

        <article className="panel lower-left">
          <header className="panel-title">Trend Radar | Receita e Conversao</header>
          <section className="chart-strip">
            <p className="cockpit-subtitle">Tendencia consolidada de performance (12 blocos)</p>
            <TrendChart bars={dashboard.trendBars} />
          </section>

          <section className="chart-strip">
            <p className="panel-title">Deep Dive Highlights</p>
            <div className="status-leds">
              {dashboard.deepDiveHighlights.map((highlight) => (
                <div className="status-item" key={highlight.label}>
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </article>

        <aside className="panel lower-right">
          <header className="panel-title">Digital Console</header>
          <div className="digital-readout">
            <p className="cockpit-subtitle">System Clock</p>
            <p className="digital-value">{time}</p>
            <p className="cockpit-subtitle">{date}</p>
          </div>

          <div className="gauge-wrap">
            {dashboard.gauges.map((gauge) => (
              <GaugeDial key={gauge.label} label={gauge.label} level={gauge.level} />
            ))}
          </div>

          <section className="status-leds">
            {dashboard.sources.map((source) => (
              <StatusLed key={source.label} source={source} />
            ))}
          </section>

          <section className="chart-strip">
            <p className="panel-title">Alert History</p>
            <div className="status-leds">
              {dashboard.alerts.map((alert) => (
                <div className="status-item" key={alert.id}>
                  <span>
                    {alert.metric} | {alert.message}
                  </span>
                  <span className="cockpit-subtitle">{alert.createdAt}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
