import { redirect } from 'next/navigation'

/**
 * /minha-conta — redireciona para inscricoes por padrao
 */
export default function MinhaContaPage() {
  redirect('/minha-conta/inscricoes')
}
