import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { prisma } from '@ciclo/database'
import { EventCard, SacredDivider, Triskle } from '@ciclo/ui'
import { getSiteContents } from '../lib/site-content'
import { LeadCaptureForm } from '../components/lead-capture-form'

export const revalidate = 300

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ciclodaseestacoes.com.br'

export const metadata: Metadata = {
  title: 'Ciclo das Estacoes — Jornadas de Autoconhecimento | Base Triade',
  description:
    'Programa de autocuidado ciclico com Medicina Tradicional Chinesa, Ayurveda e Yoga. Eventos sazonais presenciais em Barra Velha, SC.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Ciclo das Estacoes — Jornadas de Autoconhecimento',
    description:
      'Programa de autocuidado ciclico com MTC, Ayurveda e Yoga. Eventos sazonais em Barra Velha, SC.',
    type: 'website',
    url: BASE_URL,
    images: [{ url: `${BASE_URL}/og-default.svg`, width: 1200, height: 630, alt: 'Ciclo das Estacoes' }],
  },
}

const DEFAULT_VALUES = [
  { icon: '\uD83C\uDF3F', title: 'Reconexao Natural', text: 'Praticas ancestrais em harmonia com os ciclos da natureza' },
  { icon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', title: 'Comunidade', text: 'Encontros presenciais com terapeutas e buscadores' },
  { icon: '\uD83D\uDD2E', title: 'Autoconhecimento', text: 'Jornada GET137 de 137 dias entre estacoes' },
  { icon: '\u2728', title: 'Transformacao', text: 'Medicina Tradicional Chinesa + Ayurveda + Yoga' },
] as const

const ELEMENT_MAP: Record<string, string> = {
  Wood: 'Madeira', Fire: 'Fogo', Earth: 'Terra', Metal: 'Metal', Water: 'Agua',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function getEventStatus(event: { isSoldOut: boolean; startDate: Date }): 'disponivel' | 'esgotado' | 'em-breve' {
  if (event.isSoldOut) return 'esgotado'
  const diffDays = (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays > 30) return 'em-breve'
  return 'disponivel'
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? 'text-base-gold' : 'text-base-cream'} aria-hidden="true">{'\u2605'}</span>
  ))
}

export default async function HomePage() {
  const [events, testimonials, siteContents] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, isDeleted: false, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 4,
      include: { ticketTypes: { orderBy: { regularPrice: 'asc' }, take: 1 } },
    }),
    prisma.testimonial.findMany({
      where: { isApproved: true, isFeatured: true },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    getSiteContents([
      'hero_tagline', 'value_1_title', 'value_1_text', 'value_2_title', 'value_2_text',
      'value_3_title', 'value_3_text', 'value_4_title', 'value_4_text', 'about_program',
    ]),
  ])

  const heroTagline = (siteContents.get('hero_tagline') as string | null) ?? 'Desperte a sabedoria dos ciclos e reconecte-se com sua natureza interior'
  const aboutProgram = (siteContents.get('about_program') as string | null) ?? 'O Ciclo das Estacoes e um programa da Base Triade que integra Medicina Tradicional Chinesa, Ayurveda e Yoga em jornadas sazonais de autoconhecimento.'

  const valueProps = DEFAULT_VALUES.map((def, i) => {
    const idx = i + 1
    return {
      icon: def.icon,
      title: (siteContents.get(`value_${idx}_title`) as string | null) ?? def.title,
      text: (siteContents.get(`value_${idx}_text`) as string | null) ?? def.text,
    }
  })

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Base Triade',
    url: BASE_URL,
    logo: `${BASE_URL}/og-default.svg`,
    sameAs: ['https://instagram.com/podprana', 'https://instagram.com/koch.milenar'],
    contactPoint: { '@type': 'ContactPoint', email: 'contato@basetriade.com', contactType: 'customer service', availableLanguage: 'Portuguese' },
  }

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* ===== HERO — Frequencia Violeta ===== */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        {/* Gradient de fundo — aurora violeta */}
        <div className="absolute inset-0 bg-gradient-aurora" />

        {/* Mandala decorativa girando */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="animate-mandala-slow opacity-[0.05]">
            <svg viewBox="0 0 100 100" className="h-[800px] w-[800px]" fill="none" stroke="#FAE8FF" strokeWidth="0.2">
              {[15, 25, 35, 45].map((r) => <circle key={r} cx="50" cy="50" r={r} />)}
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2
                return <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(a)} y2={50 + 45 * Math.sin(a)} />
              })}
            </svg>
          </div>
        </div>

        {/* Crown chakra glow */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-48" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(250,232,255,0.12) 0%, transparent 70%)' }} aria-hidden="true" />

        {/* Conteudo hero */}
        <div className="animate-in-ethereal relative z-10 mx-auto max-w-3xl">
          <Triskle size={48} color="#FAE8FF" className="mx-auto mb-6 opacity-60" />
          <h1 className="font-heading text-hero font-bold tracking-tight text-white">
            <span className="text-glow-violet">Ciclo das Estacoes</span>
          </h1>
          <p className="mt-3 font-accent text-xl text-violet-100/80 sm:text-2xl">
            Jornadas de autoconhecimento e reconexao com os ciclos da natureza
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base text-violet-200/60">
            {heroTagline}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#eventos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-violet-500 px-8 py-3.5 font-medium text-white shadow-glow-violet-sm transition-all hover:from-violet-800 hover:to-violet-600 hover:shadow-glow-violet"
            >
              Conhecer Eventos
            </a>
            <a
              href="#interesse"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 px-8 py-3.5 font-medium text-violet-100 backdrop-blur-sm transition-all hover:bg-violet-100/10"
            >
              Manifeste Interesse
            </a>
          </div>
        </div>

        {/* Fade inferior para season-bg */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--season-bg), transparent)' }} aria-hidden="true" />
      </section>

      {/* ===== PROXIMOS EVENTOS ===== */}
      <section id="eventos" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Proximos Eventos
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Jornadas sazonais para reconexao e transformacao
          </p>

          {events.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {events.map((event) => {
                  const lowestPrice = event.ticketTypes[0]?.earlyBirdPrice ?? event.ticketTypes[0]?.regularPrice
                  return (
                    <Link key={event.id} href={`/eventos/${event.slug}`}>
                      <EventCard
                        title={event.name}
                        date={formatDate(event.startDate)}
                        element={event.elementMTC ? ELEMENT_MAP[event.elementMTC] ?? event.elementMTC : undefined}
                        status={getEventStatus(event)}
                        priceFrom={lowestPrice ? lowestPrice / 100 : undefined}
                      />
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <Link href="/eventos" className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 underline-offset-4 hover:underline">
                  Ver Todos os Eventos
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-10 text-center text-muted-foreground">Novos eventos em breve!</p>
          )}
        </div>
      </section>

      <SacredDivider variant="sacred" />

      {/* ===== PROPOSTA DE VALOR ===== */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Por que participar?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col items-center rounded-xl p-6 text-center transition-all duration-300 glass-season hover:glow-violet-sm"
              >
                <span className="text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SacredDivider variant="mandala" />

      {/* ===== FORMULARIO DE INTERESSE ===== */}
      <section id="interesse" className="relative overflow-hidden px-4 py-16 sm:py-24">
        {/* Background sutil com mandala */}
        <div className="mandala-bg absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Manifeste seu Interesse
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Receba novidades sobre os proximos eventos e jornadas
          </p>
          <div className="mt-10">
            <Suspense fallback={<div className="mx-auto h-64 max-w-md animate-pulse rounded-xl glass-season" />}>
              <LeadCaptureForm />
            </Suspense>
          </div>
        </div>
      </section>

      <SacredDivider variant="wave" />

      {/* ===== DEPOIMENTOS ===== */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Depoimentos
          </h2>

          {testimonials.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-xl p-6 glass-season hover:glow-violet-sm transition-all duration-300"
                >
                  <div className="flex items-center gap-1" aria-label={`${testimonial.rating} de 5 estrelas`}>
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-medium text-violet-700">
                    {testimonial.user.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-muted-foreground">
              Depoimentos em breve — participe de um evento!
            </p>
          )}
        </div>
      </section>

      <SacredDivider variant="sacred" />

      {/* ===== SOBRE O PROGRAMA ===== */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div className="mandala-bg absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Triskle size={36} color="#932E88" className="mx-auto mb-4 opacity-40" />
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Sobre o Programa
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {aboutProgram}
          </p>
        </div>
      </section>

      {/* ===== FOOTER SECTION ===== */}
      <section className="relative overflow-hidden border-t border-violet-600/10 px-4 py-12">
        <div className="mandala-bg absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Facilitadoras
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://instagram.com/podprana" target="_blank" rel="noopener noreferrer" className="hover:text-violet-700 transition-colors">
                    Daniela Lopper — @podprana
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/koch.milenar" target="_blank" rel="noopener noreferrer" className="hover:text-violet-700 transition-colors">
                    Milena Koch — @koch.milenar
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Contato
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:contato@basetriade.com" className="hover:text-violet-700 transition-colors">
                    contato@basetriade.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Legal
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacidade" className="hover:text-violet-700 transition-colors">
                    Politica de Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
