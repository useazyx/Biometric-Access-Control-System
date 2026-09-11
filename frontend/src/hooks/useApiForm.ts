/**
 * useApiForm.ts - Liga um formulário à API e devolve os erros no campo certo
 * # Pra que serve?
 * - Transformar o "details" do Zod que o backend manda em erro por campo
 * - Evitar que cada tela de cadastro reimplemente envio, erro e estado de carregando
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão, junto com o painel novo
 *
 * O detalhe que importa: a API responde 400 com
 *   { error, message, details: [{ path: "cpf", message: "CPF inválido" }] }
 * e é esse `path` que deixa a mensagem aparecer embaixo do campo, em vez de
 * virar um aviso solto que a pessoa não sabe a que campo se refere.
 */

import { useCallback, useState } from "react"
import type { AxiosError } from "axios"
import { apiErrorMessage } from "@/lib/api"

type FieldErrors = Record<string, string>

interface ApiErrorBody {
  message?: string
  error?: string
  details?: { path: string; message: string }[]
}

export function useApiForm<TValues extends Record<string, unknown>>(initialValues: TValues) {
  const [values, setValues] = useState<TValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  /** Muda um campo e apaga o erro dele: a pessoa já está corrigindo. */
  const setValue = useCallback(<K extends keyof TValues>(field: K, value: TValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field as string]) return current

      const next = { ...current }
      delete next[field as string]
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setFormError(null)
  }, [initialValues])

  /** Distribui o que o backend reclamou entre os campos. */
  const applyServerErrors = useCallback((error: unknown) => {
    const details = (error as AxiosError<ApiErrorBody>)?.response?.data?.details

    if (details?.length) {
      const fieldErrors: FieldErrors = {}
      details.forEach((detail) => {
        // O path do Zod pode vir aninhado ("body.cpf"): o último pedaço é o campo
        const field = detail.path.split(".").pop() ?? detail.path
        fieldErrors[field] = detail.message
      })

      setErrors(fieldErrors)
      setFormError(null)
      return
    }

    // Sem lista de campos, o erro é da operação inteira
    setErrors({})
    setFormError(apiErrorMessage(error, "Não consegui salvar."))
  }, [])

  /** Envolve o envio: cuida de carregando, de limpar erro e de traduzir a falha. */
  const submit = useCallback(
    async (action: (values: TValues) => Promise<void>) => {
      setSubmitting(true)
      setErrors({})
      setFormError(null)

      try {
        await action(values)
        return true
      } catch (error) {
        applyServerErrors(error)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [values, applyServerErrors],
  )

  /** Valida no cliente antes de gastar uma requisição. */
  const setFieldErrors = useCallback((fieldErrors: FieldErrors) => {
    setErrors(fieldErrors)
  }, [])

  return {
    values,
    setValue,
    errors,
    formError,
    submitting,
    submit,
    reset,
    setFieldErrors,
  }
}
