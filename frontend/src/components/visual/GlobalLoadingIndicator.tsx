/**
 * GlobalLoadingIndicator.tsx - A barrinha de progresso no topo da tela
 * # Pra que serve?
 * - Mostrar que tem requisição rolando, sem travar o que a pessoa está fazendo
 * - Contar quantas requisições estão abertas, pra só sumir quando a última terminar
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-15): Mostrava uma digital em tela cheia a cada requisição
 * - v2.0.0 (2026-09-09): Virou barra de progresso no topo. A digital em tela cheia
 *                        bloqueava a interface inteira em toda chamada de API, e como
 *                        ela tinha um tempo fixo pra desaparecer, também não refletia
 *                        o que realmente estava acontecendo.
 */

import { useEffect, useState } from "react"
import { LOADING_START, LOADING_STOP } from "@/services/api"

export default function GlobalLoadingIndicator() {
  // Quantas requisições estão abertas neste momento
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const onStart = () => setPending((count) => count + 1)
    // Nunca deixa passar de zero, senão a barra fica presa na tela
    const onStop = () => setPending((count) => Math.max(0, count - 1))

    document.addEventListener(LOADING_START, onStart)
    document.addEventListener(LOADING_STOP, onStop)

    return () => {
      document.removeEventListener(LOADING_START, onStart)
      document.removeEventListener(LOADING_STOP, onStop)
    }
  }, [])

  const loading = pending > 0

  return (
    <div
      // aria-hidden porque quem usa leitor de tela recebe o aviso pelo toast,
      // não por uma barra decorativa
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div
        // A barra vai até 80% enquanto carrega e completa quando termina: o truque de
        // sempre, porque não dá pra saber a porcentagem real de uma chamada HTTP
        style={{ transitionDuration: loading ? "1200ms" : "200ms" }}
        className={`h-full bg-primary transition-all ease-out ${
          loading ? "w-4/5 opacity-100" : "w-full opacity-0"
        }`}
      />
    </div>
  )
}
