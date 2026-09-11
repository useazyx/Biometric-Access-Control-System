/**
 * PageFallback.tsx - O esqueleto que aparece enquanto a tela está sendo carregada
 * # Pra que serve?
 * - Dar um retorno visual no intervalo entre clicar no menu e a tela chegar
 * - Ocupar mais ou menos o espaço da tela real, pra o layout não dar um salto
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Criado junto com o carregamento por demanda das rotas
 */

import { Skeleton } from "@/components/ui/skeleton"

export function PageFallback() {
  return (
    // aria-busy avisa o leitor de tela que tem conteúdo chegando
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando a tela...</span>

      {/* Título e descrição */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Bloco principal, do tamanho aproximado de uma listagem */}
      <div className="space-y-3 rounded-xl border border-border p-6">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
