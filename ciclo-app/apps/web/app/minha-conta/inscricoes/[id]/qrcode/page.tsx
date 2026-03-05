/**
 * Full-Screen QR Code Page
 * Story E3.4 — AC-4: Large QR display for scanning at event entrance
 *
 * Accessible from /minha-conta/inscricoes/[id]/qrcode
 * Shows large QR code optimized for scanning by facilitators.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@ciclo/database'
import { auth } from '@ciclo/auth'
import { QRDisplay } from '../../../../../components/qrcode/qr-display'

export const metadata: Metadata = {
  title: 'QR Code - Ingresso Digital',
  description: 'Apresente este QR Code na entrada do evento',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QRCodePage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/minha-conta/inscricoes')
  }

  const { id } = await params

  const registration = await prisma.registration.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      qrCode: true,
      event: {
        select: {
          name: true,
          startDate: true,
        },
      },
    },
  })

  if (!registration) {
    notFound()
  }

  // Only the owner can view their QR code on this page
  if (registration.userId !== session.user.id) {
    redirect('/minha-conta/inscricoes')
  }

  if (registration.status !== 'CONFIRMED') {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <h1 className="text-xl font-bold text-foreground mb-4">
          QR Code Indisponivel
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          O QR Code so esta disponivel para inscricoes confirmadas.
          Status atual: {registration.status}
        </p>
        <Link
          href="/minha-conta/inscricoes"
          className="text-sm font-medium text-seasonal-primary hover:text-seasonal-primary/80"
        >
          Voltar para inscricoes
        </Link>
      </div>
    )
  }

  if (!registration.qrCode) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <h1 className="text-xl font-bold text-foreground mb-4">
          QR Code em Geracao
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Seu QR Code esta sendo gerado. Tente novamente em alguns instantes.
        </p>
        <Link
          href="/minha-conta/inscricoes"
          className="text-sm font-medium text-seasonal-primary hover:text-seasonal-primary/80"
        >
          Voltar para inscricoes
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/minha-conta/inscricoes" className="hover:text-foreground">
          Minhas Inscricoes
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">QR Code</span>
      </nav>

      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-foreground">
          {registration.event.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(registration.event.startDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <QRDisplay
        signedPayload={registration.qrCode}
        size={280}
        showCard={true}
      />

      <div className="mt-8 text-center">
        <Link
          href={`/minha-conta/inscricoes/${registration.id}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Voltar para detalhes da inscricao
        </Link>
      </div>
    </div>
  )
}
