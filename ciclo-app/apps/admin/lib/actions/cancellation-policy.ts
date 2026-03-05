'use server'

import { prisma } from '@ciclo/database'
import { revalidatePath } from 'next/cache'
import { dbPolicyToDomain, domainPolicyToDb } from '@ciclo/utils'
import type { CancellationPolicy } from '@ciclo/utils'

// ============================================================
// Types
// ============================================================

export interface PolicyActionResult {
  success: boolean
  error?: string
}

// ============================================================
// Read
// ============================================================

/**
 * Retorna a politica de cancelamento para um evento especifico,
 * ou a politica global se nenhum eventId for fornecido.
 * Se nao houver politica, retorna null.
 */
export async function getCancellationPolicy(
  eventId?: string,
): Promise<CancellationPolicy | null> {
  try {
    // Se eventId fornecido, busca override do evento primeiro
    if (eventId) {
      const eventPolicy = await prisma.cancellationPolicy.findUnique({
        where: { eventId },
      })
      if (eventPolicy) {
        return dbPolicyToDomain(eventPolicy)
      }
    }

    // Busca politica global (eventId = null)
    const globalPolicy = await prisma.cancellationPolicy.findFirst({
      where: { eventId: null, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!globalPolicy) return null

    return dbPolicyToDomain(globalPolicy)
  } catch (error) {
    console.error('Failed to fetch cancellation policy:', error)
    return null
  }
}

/**
 * Retorna a politica do banco em formato raw (para formularios admin).
 */
export async function getRawCancellationPolicy(eventId?: string) {
  try {
    if (eventId) {
      const eventPolicy = await prisma.cancellationPolicy.findUnique({
        where: { eventId },
      })
      if (eventPolicy) return eventPolicy
    }

    const globalPolicy = await prisma.cancellationPolicy.findFirst({
      where: { eventId: null, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return globalPolicy
  } catch (error) {
    console.error('Failed to fetch raw cancellation policy:', error)
    return null
  }
}

/**
 * Verifica se um evento tem politica customizada.
 */
export async function hasEventPolicy(eventId: string): Promise<boolean> {
  try {
    const count = await prisma.cancellationPolicy.count({
      where: { eventId },
    })
    return count > 0
  } catch (error) {
    console.error('Failed to check event policy:', error)
    return false
  }
}

// ============================================================
// Write — Global
// ============================================================

/**
 * Atualiza (ou cria) a politica global de cancelamento.
 */
export async function updateGlobalPolicy(
  policy: CancellationPolicy,
): Promise<PolicyActionResult> {
  try {
    const dbFields = domainPolicyToDb(policy)

    const existing = await prisma.cancellationPolicy.findFirst({
      where: { eventId: null, isActive: true },
    })

    if (existing) {
      await prisma.cancellationPolicy.update({
        where: { id: existing.id },
        data: {
          ...dbFields,
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.cancellationPolicy.create({
        data: {
          eventId: null,
          ...dbFields,
          isActive: true,
        },
      })
    }

    revalidatePath('/admin/configuracoes/cancelamento')
    return { success: true }
  } catch (error) {
    console.error('Failed to update global policy:', error)
    return {
      success: false,
      error: `Falha ao atualizar politica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

// ============================================================
// Write — Event Override
// ============================================================

/**
 * Cria ou atualiza politica especifica de um evento.
 */
export async function updateEventPolicy(
  eventId: string,
  policy: CancellationPolicy,
): Promise<PolicyActionResult> {
  try {
    const dbFields = domainPolicyToDb(policy)

    await prisma.cancellationPolicy.upsert({
      where: { eventId },
      create: {
        eventId,
        ...dbFields,
        isActive: true,
      },
      update: {
        ...dbFields,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/admin/eventos/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update event policy:', error)
    return {
      success: false,
      error: `Falha ao atualizar politica do evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Remove politica customizada do evento (volta a usar a global).
 */
export async function removeEventPolicy(
  eventId: string,
): Promise<PolicyActionResult> {
  try {
    await prisma.cancellationPolicy.deleteMany({
      where: { eventId },
    })

    revalidatePath(`/admin/eventos/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to remove event policy:', error)
    return {
      success: false,
      error: `Falha ao remover politica do evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}
