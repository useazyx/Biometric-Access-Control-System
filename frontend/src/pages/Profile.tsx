/**
 * Profile.tsx - A conta de quem está usando o sistema
 * # Pra que serve?
 * - Mostrar os dados da própria pessoa e a unidade que ela administra
 * - Trocar a senha, que é a única coisa que ela pode mudar sozinha
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-09-05): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita. A troca de senha agora confere a confirmação e as
 *                        regras de força ANTES de mandar pra API.
 */

import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useApiForm } from "@/hooks/useApiForm"
import { formatCpf, formatDate, initials, orDash } from "@/lib/format"
import { labelOf, PERSON_TYPE_LABELS } from "@/lib/labels"
import type { Me } from "@/types/api"
import { Field, PageHeader, Panel, StatusBadge } from "@/components/data/Primitives"
import { InlineLoading } from "@/components/data/DataTable"
import { FormActions, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"

/** As mesmas regras que o backend aplica; conferir aqui evita uma ida à toa. */
const PASSWORD_RULES: { test: (value: string) => boolean; message: string }[] = [
  { test: (value) => value.length >= 8, message: "Pelo menos 8 caracteres" },
  { test: (value) => /[A-Z]/.test(value), message: "Uma letra maiúscula" },
  { test: (value) => /[a-z]/.test(value), message: "Uma letra minúscula" },
  { test: (value) => /[0-9]/.test(value), message: "Um número" },
  { test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: "Um caractere especial" },
]

export default function Profile() {
  const { user } = useAuth()

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<Me>("/me")
      return data
    },
  })

  return (
    <>
      <PageHeader title="Minha conta" description="Seus dados e a unidade que você administra." />

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Panel title="Dados cadastrais">
          {me.isLoading ? (
            <InlineLoading />
          ) : me.isError ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              Não consegui carregar seus dados.
            </p>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                  {initials(me.data?.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{me.data?.full_name}</p>
                  <p className="truncate text-[0.8125rem] text-muted-foreground">
                    {me.data?.email}
                  </p>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Perfil">
                  <StatusBadge tone="primary">
                    {labelOf(PERSON_TYPE_LABELS, me.data?.type)}
                  </StatusBadge>
                </Field>

                <Field label="CPF">
                  <span className="identifier">{formatCpf(me.data?.cpf)}</span>
                </Field>

                <Field label="Telefone">{orDash(me.data?.phone)}</Field>

                <Field label="Nascimento">{formatDate(me.data?.birth_date)}</Field>

                {me.data?.employee && (
                  <Field label="Matrícula">
                    <span className="identifier">{me.data.employee.registration_number}</span>
                  </Field>
                )}

                {me.data?.student && (
                  <Field label="RM">
                    <span className="identifier">{me.data.student.rm}</span>
                  </Field>
                )}
              </dl>
            </>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Unidade">
            {user?.unit_code ? (
              <dl className="space-y-4">
                <Field label="Nome">{user.unit_name ?? "—"}</Field>
                <Field label="Código">
                  <span className="identifier">{user.unit_code}</span>
                </Field>
              </dl>
            ) : (
              <p className="text-[0.8125rem] text-muted-foreground">
                Sua conta não está vinculada a uma unidade, por isso as listagens aparecem
                vazias. Peça pra coordenação vincular seu cadastro a uma unidade.
              </p>
            )}
          </Panel>

          <ChangePasswordPanel />
        </div>
      </div>
    </>
  )
}

function ChangePasswordPanel() {
  const form = useApiForm({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Confere na tela o que dá pra conferir, pra não gastar requisição num erro óbvio
    if (form.values.new_password !== form.values.new_password_confirm) {
      form.setFieldErrors({ new_password_confirm: "As senhas não batem" })
      return
    }

    const failed = PASSWORD_RULES.find((rule) => !rule.test(form.values.new_password))
    if (failed) {
      form.setFieldErrors({ new_password: "Falta: " + failed.message.toLowerCase() })
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/change-password", {
        current_password: values.current_password,
        new_password: values.new_password,
        new_password_confirm: values.new_password_confirm,
      })
    })

    if (ok) {
      toast.success("Senha alterada")
      form.reset()
    }
  }

  return (
    <Panel title="Trocar a senha" description="Use uma senha que você não use em outro lugar.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormAlert message={form.formError} />

        <TextField
          label="Senha atual"
          required
          type="password"
          value={form.values.current_password}
          onChange={(value) => form.setValue("current_password", value)}
          error={form.errors.current_password}
        />

        <TextField
          label="Senha nova"
          required
          type="password"
          value={form.values.new_password}
          onChange={(value) => form.setValue("new_password", value)}
          error={form.errors.new_password}
        />

        <TextField
          label="Repita a senha nova"
          required
          type="password"
          value={form.values.new_password_confirm}
          onChange={(value) => form.setValue("new_password_confirm", value)}
          error={form.errors.new_password_confirm}
        />

        <ul className="space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const passed = form.values.new_password ? rule.test(form.values.new_password) : false

            return (
              <li
                key={rule.message}
                className={
                  "flex items-center gap-1.5 text-[0.75rem] " +
                  (passed ? "text-authorized" : "text-muted-foreground")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 shrink-0 rounded-full " +
                    (passed ? "bg-authorized" : "bg-muted-foreground/40")
                  }
                  aria-hidden
                />
                {rule.message}
              </li>
            )
          })}
        </ul>

        <FormActions>
          <Button type="submit" disabled={form.submitting}>
            {form.submitting ? "Salvando..." : "Trocar a senha"}
          </Button>
        </FormActions>
      </form>
    </Panel>
  )
}
