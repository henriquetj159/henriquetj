import { Card, CardContent } from '@ciclo/ui'

export default function InscricoesPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-base-dark">
        Inscricoes
      </h1>
      <p className="mt-1 text-sm text-base-dark/60">
        Acompanhe inscricoes e status de participantes
      </p>

      <Card className="mt-6 border-base-gold/10">
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-base-dark/40">
            Gestao de inscricoes em breve &mdash; implementado na E3.1
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
