import type { Metadata, Viewport } from 'next'
import { Libre_Franklin, Zilla_Slab, Caveat, JetBrains_Mono } from 'next/font/google'
import { BaseTriadeFooter, BaseTriadeWatermark } from '@ciclo/ui'
import { SessionProvider } from './providers/session-provider'
import { SwRegister } from '../components/pwa/sw-register'
import { InstallBanner } from '../components/pwa/install-banner'
import './globals.css'

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const zillaSlab = Zilla_Slab({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '700'],
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400'],
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ciclodaseestacoes.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Ciclo das Estacoes | Base Triade',
    template: '%s | Ciclo das Estacoes',
  },
  description:
    'Programa de autocuidado ciclico voltado para terapeutas holisticos. Eventos sazonais, comunidade e jornada de transformacao.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ciclo',
  },
  icons: {
    apple: '/icons/apple-touch-icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#932E88',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${libreFranklin.variable} ${zillaSlab.variable} ${caveat.variable} ${jetbrainsMono.variable}`}
      data-season="primavera"
    >
      <body className="flex min-h-screen flex-col">
        <SessionProvider>
          <SwRegister />
          <BaseTriadeWatermark />
          <main className="relative z-10 flex-1">{children}</main>
          <BaseTriadeFooter className="relative z-10" />
          <InstallBanner />
        </SessionProvider>
      </body>
    </html>
  )
}
