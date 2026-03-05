/**
 * Offline fallback page (AC-7)
 *
 * Displayed by the Service Worker when user tries to access
 * uncached pages without internet connection.
 */
export const metadata = {
  title: 'Sem Conexao',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 text-6xl" aria-hidden="true">
        &#x1F331;
      </div>

      <h1 className="font-playfair mb-4 text-3xl font-bold text-[#2d1810]">
        Sem conexao
      </h1>

      <p className="mb-6 max-w-md text-lg text-[#5c4a3a]">
        Voce esta sem internet no momento. Nao se preocupe — seu QR Code de
        entrada e o cronograma do evento podem estar disponiveis offline.
      </p>

      <div className="mb-8 rounded-xl border border-[#d4c5a9] bg-[#FDF8F0] p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[#2d1810]">
          O que voce pode fazer offline:
        </h2>
        <ul className="space-y-2 text-left text-[#5c4a3a]">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-[#8B7355]" aria-hidden="true">&#x2714;</span>
            <span>Acessar seu QR Code de entrada (se ja visualizou antes)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-[#8B7355]" aria-hidden="true">&#x2714;</span>
            <span>Ver o cronograma do evento (se ja carregou antes)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-[#8B7355]" aria-hidden="true">&#x2714;</span>
            <span>Navegar por paginas que ja visitou</span>
          </li>
        </ul>
      </div>

      <a
        href="/minha-conta/inscricoes"
        className="inline-flex items-center gap-2 rounded-lg bg-[#8B7355] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6d5a43]"
      >
        Ver meu QR Code
      </a>

      <p className="mt-6 text-sm text-[#8a7a6a]">
        Quando a conexao for restabelecida, a pagina sera atualizada automaticamente.
      </p>
    </div>
  )
}
