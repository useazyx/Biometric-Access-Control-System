/**
 * use-confirm.tsx - Pede confirmação antes de uma ação sem volta
 * # Pra que serve?
 * - Substituir o confirm() do navegador, que não segue o tema e não explica nada
 * - Deixar a pergunta com o nome de quem vai ser apagado e o aviso da cascata
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2026-09-09): Criado pra padronizar as seis telas que usavam confirm() nativo
 *
 * Como usar (a chamada fica parecida com a do confirm(), só que com await):
 *
 *   const { confirmar, ConfirmDialog } = useConfirm()
 *
 *   const apagar = async () => {
 *     const ok = await confirmar({ title: "Excluir João?", description: "Não tem volta." })
 *     if (!ok) return
 *     // ...apaga
 *   }
 *
 *   // e no JSX da tela, uma vez só:
 *   <ConfirmDialog />
 */

import { useCallback, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
  title: string
  description?: string
  /** Texto do botão que confirma (padrão: "Confirmar") */
  confirmLabel?: string
  /** Texto do botão que desiste (padrão: "Cancelar") */
  cancelLabel?: string
  /** Pinta o botão de confirmar de vermelho. Ligado por padrão, porque
   *  quase toda confirmação aqui é de exclusão. */
  destructive?: boolean
}

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: "Tem certeza?",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  destructive: true,
}

export function useConfirm() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>(DEFAULT_OPTIONS)

  // Guarda o resolve da Promise pra responder quando a pessoa clicar.
  // Fica em ref (e não em state) pra não virar motivo de re-render.
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const confirmar = useCallback((opts: ConfirmOptions) => {
    setOptions({ ...DEFAULT_OPTIONS, ...opts })
    setOpen(true)

    // A Promise só resolve quando o diálogo fechar, de um jeito ou de outro
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  // Responde a Promise e fecha. Serve pros dois botões e pro Esc/clique fora.
  const finish = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setOpen(false)
  }, [])

  const ConfirmDialog = useCallback(
    () => (
      <AlertDialog
        open={open}
        // Fechar pelo Esc ou clicando fora conta como desistir, não como confirmar
        onOpenChange={(isOpen) => {
          if (!isOpen) finish(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finish(false)}>{options.cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finish(true)}
              className={
                options.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {options.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [open, options, finish],
  )

  return { confirmar, ConfirmDialog }
}
