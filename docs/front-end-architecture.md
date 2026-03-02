# Painel 747 Frontend Architecture Document

## Template and Framework Selection

### Decision
- Frontend starter template: Next.js App Router starter (TypeScript)
- Existing frontend codebase: N/A (greenfield)
- Constraint: architecture must remain synchronized with `docs/architecture.md` and `docs/prd.md`

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-01 | 0.1 | Initial frontend architecture aligned to PRD Hard MVP | Frontend Architect |

## Frontend Tech Stack

### Technology Stack Table
| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | Next.js | 16.0.0 | Web app shell and routing | Consistent with main architecture |
| UI Library | React | 19.0.0 | Component model | Mature ecosystem |
| State Management | Zustand | 5.0.8 | Local/global UI and session context state | Lightweight and explicit |
| Routing | Next.js App Router | 16.0.0 | Route segments and layouts | Native framework routing |
| Build Tool | Turbopack | 16.0.0 | Fast local build/dev | Native Next.js support |
| Styling | Tailwind CSS + CSS Variables | 4.0.0 | Utility speed + strict tokenized theme | Fast delivery with visual consistency |
| Testing | Jest + RTL + Playwright | Jest 30.2.0 / Playwright 1.54.2 | Unit/integration/e2e | Balanced coverage for MVP |
| Component Library | Custom cockpit DS + shadcn primitives | latest compatible | UI primitives + product identity | Custom visual language with proven base |
| Form Handling | React Hook Form + Zod | 7.56.4 / 3.24.0 | Integration/auth forms | Type-safe validation |
| Animation | Framer Motion | 12.4.10 | Meaningful transitions and gauges | Smooth, controlled motion |
| Dev Tools | ESLint + Prettier + Storybook | 9.38.0 / 3.5.3 / 8.6.14 | Quality and component docs | Faster team iteration |

## Project Structure

```text
ui/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (cockpit)/
      layout.tsx
      dashboard/page.tsx
      deep-dive/page.tsx
      alerts/page.tsx
      settings/page.tsx
    api/
    globals.css
    theme.css
  src/
    components/
      cockpit/
        metric-card/
        gauge-dial/
        trend-sparkline/
        digital-panel/
        alert-strip/
        source-status-pill/
      charts/
        line-chart/
        bar-chart/
        funnel-chart/
      layout/
        top-nav/
        side-rail/
        filter-bar/
      states/
        empty-state/
        loading-state/
        error-state/
    features/
      auth/
      products/
      dashboard/
      deep-dive/
      alerts/
      integrations/
    services/
      api-client.ts
      auth-service.ts
      dashboard-service.ts
      integrations-service.ts
    store/
      auth-store.ts
      product-context-store.ts
      filter-store.ts
      ui-mode-store.ts
    lib/
      formatters/
      metrics/
      a11y/
      utils/
    types/
      api.ts
      dashboard.ts
      metrics.ts
  tests/
    unit/
    integration/
    e2e/
```

## Component Standards

### Component Template
```typescript
import { memo } from 'react';

type MetricCardProps = {
  label: string;
  value: string;
  deltaPct?: number;
  state: 'ok' | 'delayed' | 'unavailable';
  freshness: string;
  onOpenDetail?: () => void;
};

export const MetricCard = memo(function MetricCard({
  label,
  value,
  deltaPct,
  state,
  freshness,
  onOpenDetail,
}: MetricCardProps) {
  return (
    <section className="cockpit-card" aria-label={`Metric ${label}`}>
      <header className="cockpit-card__header">
        <h3>{label}</h3>
        <span data-state={state} className="status-pill">{state}</span>
      </header>
      <p className="cockpit-card__value">{value}</p>
      <p className="cockpit-card__delta">{deltaPct ?? 0}%</p>
      <footer className="cockpit-card__footer">
        <span>{freshness}</span>
        {onOpenDetail ? <button onClick={onOpenDetail}>Details</button> : null}
      </footer>
    </section>
  );
});
```

### Naming Conventions
- Components: `PascalCase` (`MetricCard.tsx`)
- Hooks: `useCamelCase` (`useActiveProduct.ts`)
- Store files: `kebab-store.ts` (`filter-store.ts`)
- Feature folders: `kebab-case`
- CSS classes: `cockpit-block__element--modifier`
- Chart components prefixed by domain: `RevenueLineChart`, `FunnelDropoffChart`

## State Management

### Store Structure
```text
src/store/
  auth-store.ts
  product-context-store.ts
  filter-store.ts
  dashboard-store.ts
  alerts-store.ts
  ui-mode-store.ts
```

### State Management Template
```typescript
import { create } from 'zustand';

type FilterState = {
  period: 'day' | 'week' | 'month' | 'custom';
  productId: string | null;
  setPeriod: (period: FilterState['period']) => void;
  setProductId: (productId: string) => void;
  reset: () => void;
};

const initialState = {
  period: 'week' as const,
  productId: null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setPeriod: (period) => set({ period }),
  setProductId: (productId) => set({ productId }),
  reset: () => set(initialState),
}));
```

## API Integration

### Service Template
```typescript
import { apiClient } from './api-client';

export type Top6Metric = {
  key: string;
  label: string;
  value: number;
  deltaPct: number;
  state: 'ok' | 'delayed' | 'unavailable';
  freshnessAt: string;
};

export async function fetchTop6(productId: string, period: string): Promise<Top6Metric[]> {
  const { data } = await apiClient.get('/dashboard/top6', {
    params: { productId, period },
  });

  return data.metrics;
}
```

### API Client Configuration
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 8000,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token refresh strategy handled by auth service.
    }
    return Promise.reject(error);
  }
);
```

## Routing

### Route Configuration
```typescript
// app/(cockpit)/layout.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/src/features/auth/server-session';

export default async function CockpitLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <>{children}</>;
}

// Routes
// /login
// /register
// /dashboard
// /deep-dive
// /alerts
// /settings
```

## Styling Guidelines

### Styling Approach
- Tailwind for layout/spacing and quick composition
- CSS variables for strict token system and cockpit visual identity
- Component-level style modules only for complex visual widgets (gauges, radar grid, digital panels)
- Theme rule: visual richness is mandatory, but every decorative layer must preserve data readability

### Cockpit Visual Direction
- Core look: aircraft instrument panel + digital avionics display
- Surfaces: matte dark metal and carbon textures with subtle gradients
- Key widgets:
  - Circular gauges for CPA/ROAS tension zones
  - Digital segmented readouts for key values
  - Sparkline trend strips with glow states
  - Status LEDs for source health (`ok`, `delayed`, `unavailable`)
- Visual hierarchy:
  - Top row: Top 6 critical metrics
  - Middle: trend and anomaly panels
  - Lower: source status + alert history strip

### Motion and Interaction Rules
- Page entry: 220ms fade/slide stagger, not more than 8 animated elements at once
- Gauge needle animation: spring with hard cap at 300ms
- Alert pulse: only for `critical`, low-frequency glow to avoid fatigue
- Hover states must improve precision (show formula, source, freshness)

### Global Theme Variables
```css
:root {
  --font-display: "Rajdhani", "Orbitron", sans-serif;
  --font-body: "Inter", "Segoe UI", sans-serif;

  --color-bg-0: #070b12;
  --color-bg-1: #0d1420;
  --color-bg-2: #131d2d;
  --color-panel: #182337;
  --color-panel-soft: #1f2d45;

  --color-text-primary: #e9f1ff;
  --color-text-secondary: #9fb2d0;

  --color-accent-cyan: #39d0ff;
  --color-accent-amber: #ffba3a;
  --color-accent-green: #5bff9a;
  --color-accent-red: #ff5f6d;

  --state-ok: #4be28c;
  --state-delayed: #ffba3a;
  --state-unavailable: #ff5f6d;

  --shadow-panel: 0 12px 40px rgba(0, 0, 0, 0.45);
  --shadow-glow-cyan: 0 0 20px rgba(57, 208, 255, 0.35);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}

[data-theme="cockpit-light"] {
  --color-bg-0: #f4f7fc;
  --color-bg-1: #e9eef7;
  --color-bg-2: #dbe4f3;
  --color-panel: #ffffff;
  --color-panel-soft: #f1f5fb;
  --color-text-primary: #102038;
  --color-text-secondary: #3e5677;
}
```

## Testing Requirements

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricCard } from '@/src/components/cockpit/metric-card/MetricCard';

describe('MetricCard', () => {
  it('renders value and state', () => {
    render(
      <MetricCard
        label="ROAS"
        value="2.8"
        deltaPct={-18}
        state="delayed"
        freshness="updated 3m ago"
      />
    );

    expect(screen.getByText('ROAS')).toBeInTheDocument();
    expect(screen.getByText('2.8')).toBeInTheDocument();
    expect(screen.getByText('delayed')).toBeInTheDocument();
  });

  it('opens details', async () => {
    const onOpenDetail = vi.fn();
    const user = userEvent.setup();

    render(
      <MetricCard
        label="CPA"
        value="R$ 52"
        state="ok"
        freshness="updated now"
        onOpenDetail={onOpenDetail}
      />
    );

    await user.click(screen.getByRole('button', { name: /details/i }));
    expect(onOpenDetail).toHaveBeenCalled();
  });
});
```

### Testing Best Practices
1. Unit-test all Top 6 metric widgets and formatting utilities.
2. Integration-test filter propagation across cockpit sections.
3. E2E-test hard MVP path: login -> active product -> top6 -> critical alert visibility.
4. Include visual regression snapshots for gauge and digital panel components.
5. Validate accessibility for keyboard navigation and focus order in cockpit controls.

## Environment Configuration

Required variables:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_ENABLE_DEMO_MODE`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)
- `NEXT_PUBLIC_OTEL_EXPORTER_URL` (optional)

## Frontend Developer Standards

### Critical Coding Rules
- Never hardcode colors or spacing outside theme tokens.
- Every metric card must show `state` and `freshness` consistently.
- Any animation must have a reduced-motion fallback.
- Demo mode must always show explicit visual marker.
- Charts and gauges must include textual equivalent for accessibility.
- Keep Top 6 above the fold on desktop at 1440x900 and up.

### Quick Reference
- Dev: `npm run dev`
- Build: `npm run build`
- Unit tests: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Key imports:
  - `@/src/components/...`
  - `@/src/features/...`
  - `@/src/store/...`
- Naming:
  - Components: `PascalCase.tsx`
  - Hooks: `use-*.ts` or `use*.ts` (choose one convention and enforce)
  - Stores: `*-store.ts`

## Cockpit UI Guardrails
- Beauty is required, but readability is non-negotiable.
- No dense decorative overlays on critical numeric values.
- Critical metrics must remain legible at a glance in less than 3 seconds.
- Keep contrast WCAG AA minimum across all cockpit themes.
- Any new visual experiment must be validated with real dashboard data, not placeholders only.
