/**
 * NotFound.tsx - A tela de endereço que não existe
 * # Pra que serve?
 * - Dizer o que aconteceu sem deixar a pessoa presa numa tela em branco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-10): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita pro painel novo
 */

import { Link, useLocation, useNavigate } from "react-router-dom"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="h-6 w-6" aria-hidden />
        </span>

        <h2 className="mt-4 text-lg font-semibold">Essa tela não existe</h2>
        <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
          O endereço <span className="identifier">{location.pathname}</span> não corresponde a
          nenhuma tela do sistema.
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button asChild>
            <Link to="/dashboard">Ir pro painel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
