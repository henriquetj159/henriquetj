import type { GaugeLevel, Metric, SourceHealth, SourceState } from "@/components/cockpit/types";

export type DashboardAlert = {
  id: string;
  metric: string;
  severity: "critical" | "warning" | "info";
  message: string;
  createdAt: string;
};

export type DeepDiveHighlight = {
  label: string;
  value: string;
};

export type DashboardData = {
  metrics: Metric[];
  trendBars: number[];
  gauges: Array<{ label: string; level: GaugeLevel }>;
  sources: SourceHealth[];
  alerts: DashboardAlert[];
  deepDiveHighlights: DeepDiveHighlight[];
};

const FALLBACK_DATA: DashboardData = {
  metrics: [
    { name: "CTR", value: "3.94%", delta: "+0.42%", tone: "up" },
    { name: "CPC", value: "R$ 1.28", delta: "-0.18%", tone: "up" },
    { name: "CPA", value: "R$ 52.44", delta: "+8.20%", tone: "down" },
    { name: "ROAS", value: "2.84", delta: "-0.26", tone: "down" },
    { name: "IC", value: "412", delta: "+34", tone: "up" },
    { name: "Conv Checkout", value: "18.7%", delta: "-1.4%", tone: "down" },
  ],
  trendBars: [48, 72, 61, 84, 58, 68, 76, 93, 62, 79, 70, 88],
  gauges: [
    { label: "ROAS Pressure", level: "warn" },
    { label: "CPA Stability", level: "safe" },
  ],
  sources: [
    { label: "Meta Ads Sync", state: "ok" },
    { label: "Google Ads Sync", state: "delayed" },
    { label: "GA4 Sync", state: "unavailable" },
  ],
  alerts: [
    {
      id: "a1",
      metric: "ROAS",
      severity: "critical",
      message: "ROAS caiu 22.1% nas ultimas 24h",
      createdAt: "ha 5 min",
    },
    {
      id: "a2",
      metric: "CPA",
      severity: "warning",
      message: "CPA acima da meta em 8.2%",
      createdAt: "ha 12 min",
    },
  ],
  deepDiveHighlights: [
    { label: "Queda de Conversao no Checkout", value: "-1.4%" },
    { label: "Canal com maior custo", value: "Meta Ads" },
    { label: "Pagina com maior rejeicao", value: "/oferta/premium-x" },
  ],
};

type ApiMetric = {
  label: string;
  value: number | string;
  deltaPct?: number;
  state?: SourceState;
};

type ApiTop6Response = {
  metrics?: ApiMetric[];
};

type ApiAlert = {
  id?: string | number;
  metric?: string;
  severity?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
};

type ApiAlertsResponse = {
  alerts?: ApiAlert[];
  data?: ApiAlert[];
};

type ApiDeepDiveResponse = {
  trendBars?: number[];
  highlights?: Array<{ label?: string; value?: string | number }>;
  gauges?: Array<{ label?: string; level?: string }>;
  sources?: Array<{ label?: string; state?: SourceState | string }>;
};

function formatMetric(metric: ApiMetric): Metric {
  const deltaPct = metric.deltaPct ?? 0;
  const delta = `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%`;

  return {
    name: metric.label,
    value: typeof metric.value === "number" ? metric.value.toLocaleString("pt-BR") : metric.value,
    delta,
    tone: deltaPct >= 0 ? "up" : "down",
  };
}

function normalizeSeverity(value: string | undefined): DashboardAlert["severity"] {
  if (value === "critical" || value === "warning" || value === "info") {
    return value;
  }
  return "info";
}

function normalizeAlert(alert: ApiAlert, index: number): DashboardAlert {
  const severity = normalizeSeverity(alert.severity);
  const createdAt = alert.createdAt ?? alert.created_at ?? "agora";

  return {
    id: String(alert.id ?? `alert-${index + 1}`),
    metric: alert.metric ?? "Metric",
    severity,
    message: alert.message ?? "Alerta de variacao detectado",
    createdAt,
  };
}

function normalizeGaugeLevel(level: string | undefined): GaugeLevel {
  return level === "warn" ? "warn" : "safe";
}

function normalizeSourceState(state: string | undefined): SourceState {
  if (state === "ok" || state === "delayed" || state === "unavailable") {
    return state;
  }
  return "unavailable";
}

async function fetchJson<T>(url: URL): Promise<T | null> {
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getDashboardData(productId: string, period: string): Promise<DashboardData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return FALLBACK_DATA;
  }

  const top6Url = new URL("/api/v1/dashboard/top6", baseUrl);
  top6Url.searchParams.set("productId", productId);
  top6Url.searchParams.set("period", period);

  const alertsUrl = new URL("/api/v1/alerts/history", baseUrl);
  alertsUrl.searchParams.set("productId", productId);
  alertsUrl.searchParams.set("period", period);

  const deepDiveUrl = new URL("/api/v1/metrics/deep-dive", baseUrl);
  deepDiveUrl.searchParams.set("productId", productId);
  deepDiveUrl.searchParams.set("period", period);

  const [top6Payload, alertsPayload, deepDivePayload] = await Promise.all([
    fetchJson<ApiTop6Response>(top6Url),
    fetchJson<ApiAlertsResponse>(alertsUrl),
    fetchJson<ApiDeepDiveResponse>(deepDiveUrl),
  ]);

  const metrics =
    top6Payload?.metrics && top6Payload.metrics.length > 0
      ? top6Payload.metrics.slice(0, 6).map(formatMetric)
      : FALLBACK_DATA.metrics;

  const rawAlerts = alertsPayload?.alerts ?? alertsPayload?.data ?? [];
  const alerts = rawAlerts.length > 0 ? rawAlerts.slice(0, 4).map(normalizeAlert) : FALLBACK_DATA.alerts;

  const trendBars =
    deepDivePayload?.trendBars && deepDivePayload.trendBars.length > 0
      ? deepDivePayload.trendBars.slice(0, 12)
      : FALLBACK_DATA.trendBars;

  const deepDiveHighlights =
    deepDivePayload?.highlights && deepDivePayload.highlights.length > 0
      ? deepDivePayload.highlights.slice(0, 3).map((item) => ({
          label: item.label ?? "Insight",
          value: typeof item.value === "number" ? item.value.toLocaleString("pt-BR") : (item.value ?? "N/A"),
        }))
      : FALLBACK_DATA.deepDiveHighlights;

  const gauges =
    deepDivePayload?.gauges && deepDivePayload.gauges.length > 0
      ? deepDivePayload.gauges.slice(0, 2).map((item) => ({
          label: item.label ?? "Pressure",
          level: normalizeGaugeLevel(item.level),
        }))
      : FALLBACK_DATA.gauges;

  const sources =
    deepDivePayload?.sources && deepDivePayload.sources.length > 0
      ? deepDivePayload.sources.slice(0, 3).map((item) => ({
          label: item.label ?? "Source",
          state: normalizeSourceState(item.state),
        }))
      : FALLBACK_DATA.sources;

  return {
    metrics,
    alerts,
    trendBars,
    deepDiveHighlights,
    gauges,
    sources,
  };
}
