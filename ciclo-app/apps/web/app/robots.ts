import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ciclodasestacoes.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/*', '/api/*', '/minha-conta/*', '/inscricao/*'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
