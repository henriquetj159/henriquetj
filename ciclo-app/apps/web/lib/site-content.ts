import { prisma } from '@ciclo/database'

/**
 * Fetch a SiteContent value by key.
 * Returns the JSON value or null if not found.
 */
export async function getSiteContent(key: string): Promise<unknown> {
  const content = await prisma.siteContent.findUnique({
    where: { key },
  })
  return content?.value ?? null
}

/**
 * Fetch multiple SiteContent values by keys.
 * Returns a Map<key, value>.
 */
export async function getSiteContents(keys: string[]): Promise<Map<string, unknown>> {
  const contents = await prisma.siteContent.findMany({
    where: { key: { in: keys } },
  })
  const map = new Map<string, unknown>()
  for (const c of contents) {
    map.set(c.key, c.value)
  }
  return map
}
