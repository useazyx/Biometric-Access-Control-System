/**
 * FingerprintScan.tsx - A leitura da digital que acontece ao entrar no sistema
 * # Pra que serve?
 * - Dar ao login a cara do que o sistema faz: identificar alguém pela digital
 * - Ocupar o tempo que a autenticação leva de verdade, em vez de um spinner seco
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão
 *
 * ORÇAMENTO DE DESEMPENHO (a razão de cada escolha aqui):
 * - Só `transform` e `opacity` são animados. São as duas propriedades que o navegador
 *   resolve na GPU, sem recalcular layout nem repintar a cada quadro.
 * - Nada de `backdrop-filter`, `box-shadow` animado ou `filter: blur()`: são justamente
 *   os efeitos que fazem a página travar em máquina modesta.
 * - A digital é o ícone do lucide-react, que já é dependência do projeto.
 * - Quem pediu menos movimento no sistema operacional recebe a tela parada: o
 *   `prefers-reduced-motion` do index.css zera as animações, e o texto continua
 *   contando o que está acontecendo.
 */

import { Check, Fingerprint } from "lucide-react"
import { cn } from "@/lib/utils"

export type ScanState = "scanning" | "granted"

interface FingerprintScanProps {
  state: ScanState
  /** Aparece no "acesso liberado", pra confirmar quem entrou. */
  personName?: string | null
}

export function FingerprintScan({ state, personName }: FingerprintScanProps) {
  const granted = state === "granted"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background animate-fade-in"
      // A tela toda é um aviso de progresso: o leitor de tela anuncia a mudança
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="relative grid h-40 w-40 place-items-center">
          {/* Anel de fundo: dá o "aparelho" em volta do dedo, sem custo nenhum */}
          <span
            className={cn(
              "absolute inset-0 rounded-full border transition-colors duration-300",
              granted ? "border-authorized/40 bg-authorized/10" : "border-primary/25 bg-primary/5",
            )}
            aria-hidden
          />

          {/* A digital em si */}
          <Fingerprint
            className={cn(
              "relative h-24 w-24 transition-colors duration-300",
              granted ? "text-authorized" : "text-primary animate-scan-pulse",
            )}
            strokeWidth={1.1}
            aria-hidden
          />

          {/* A luz do leitor varrendo. Some assim que o acesso é liberado. */}
          {!granted && (
            <span
              className="pointer-events-none absolute inset-x-6 top-1/2 h-10 -translate-y-1/2 overflow-hidden"
              aria-hidden
            >
              <span
                className="block h-px w-full animate-scan-sweep bg-gradient-to-r from-transparent via-primary to-transparent"
                // Avisa o navegador pra promover a barra a uma camada própria
                style={{ willChange: "transform" }}
              />
            </span>
          )}

          {/* Selo de liberado, encaixado na borda do anel */}
          {granted && (
            <span className="absolute bottom-1 right-1 grid h-9 w-9 animate-pop-in place-items-center rounded-full bg-authorized text-authorized-foreground">
              <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
          )}
        </div>

        <p className="mt-7 text-[0.9375rem] font-medium">
          {granted ? "Acesso liberado" : "Verificando sua identidade..."}
        </p>

        <p className="mt-1 min-h-[1.25rem] text-[0.8125rem] text-muted-foreground">
          {granted && personName ? "Bem-vindo, " + personName.split(" ")[0] : "Só um instante"}
        </p>
      </div>
    </div>
  )
}
