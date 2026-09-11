/**
 * CreateVisitor.tsx - A segunda etapa do cadastro de um visitante
 * # Pra que serve?
 * - Registrar a que a pessoa veio e quem na casa responde por ela
 * - Exigir o responsável, que é o que torna a visita rastreável
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-26): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita com erro por campo
 */

import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf } from "@/lib/format"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function CreateVisitor() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useApiForm({
    cpf: "",
    company: "",
    visit_reason: "",
    responsible_employee_cpf: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const ok = await form.submit(async (values) => {
      await api.post("/visitors", {
        cpf: values.cpf,
        responsible_employee_cpf: values.responsible_employee_cpf,
        ...(values.company.trim() ? { company: values.company.trim() } : {}),
        ...(values.visit_reason.trim() ? { visit_reason: values.visit_reason.trim() } : {}),
      })
    })

    if (ok) {
      toast.success("Visitante cadastrado")
      queryClient.invalidateQueries({ queryKey: ["visitors"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/visitors")
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastrar visitante"
        description="Segunda etapa: o motivo da visita e o funcionário responsável."
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Panel>
          <FormAlert message={form.formError} />

          <div className="space-y-4">
            <FormGrid>
              <TextField
                label="CPF do visitante"
                required
                value={form.values.cpf}
                onChange={(value) => form.setValue("cpf", maskCpf(value))}
                error={form.errors.cpf}
                placeholder="000.000.000-00"
                hint="A pessoa já precisa estar cadastrada como visitante."
              />

              <TextField
                label="CPF do funcionário responsável"
                required
                value={form.values.responsible_employee_cpf}
                onChange={(value) => form.setValue("responsible_employee_cpf", maskCpf(value))}
                error={form.errors.responsible_employee_cpf}
                placeholder="000.000.000-00"
                hint="Quem na unidade responde por essa visita."
              />
            </FormGrid>

            <TextField
              label="Empresa"
              value={form.values.company}
              onChange={(value) => form.setValue("company", value)}
              error={form.errors.company}
              maxLength={100}
              placeholder="De onde a pessoa vem, se for o caso"
            />

            <FormField
              label="Motivo da visita"
              error={form.errors.visit_reason}
              hint="Entre 5 e 200 caracteres."
            >
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  value={form.values.visit_reason}
                  onChange={(event) => form.setValue("visit_reason", event.target.value)}
                  maxLength={200}
                  rows={3}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  placeholder="Reunião com a coordenação sobre o estágio"
                />
              )}
            </FormField>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/people/create">Cadastrar a pessoa antes</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar visitante"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
