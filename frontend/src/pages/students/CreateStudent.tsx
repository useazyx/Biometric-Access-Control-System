/**
 * CreateStudent.tsx - A segunda etapa do cadastro de um aluno
 * # Pra que serve?
 * - Pendurar o perfil de aluno (RM, período, curso) numa pessoa que já existe
 * - Deixar claro que a pessoa precisa estar cadastrada antes
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-21): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita com erro por campo e atalho pra primeira etapa
 */

import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf } from "@/lib/format"
import { PERIOD_LABELS, STUDENT_STATUS_LABELS } from "@/lib/labels"
import { PERIODS, STUDENT_STATUSES, type Period, type StudentStatus } from "@/types/api"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CreateStudent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useApiForm({
    cpf: "",
    rm: "",
    period: "morning" as Period,
    course: "",
    class: "",
    responsible: "",
    status: "active" as StudentStatus,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const ok = await form.submit(async (values) => {
      await api.post("/students", {
        cpf: values.cpf,
        rm: values.rm.trim(),
        period: values.period,
        status: values.status,
        // Campos opcionais só vão quando têm conteúdo: string vazia é rejeitada
        ...(values.course.trim() ? { course: values.course.trim() } : {}),
        ...(values.class.trim() ? { class: values.class.trim() } : {}),
        ...(values.responsible.trim() ? { responsible: values.responsible.trim() } : {}),
      })
    })

    if (ok) {
      toast.success("Aluno cadastrado", { description: "RM " + form.values.rm })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/students")
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastrar aluno"
        description="Segunda etapa: vincula o RM e a turma a uma pessoa já cadastrada."
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
            <TextField
              label="CPF da pessoa"
              required
              value={form.values.cpf}
              onChange={(value) => form.setValue("cpf", maskCpf(value))}
              error={form.errors.cpf}
              placeholder="000.000.000-00"
              hint="A pessoa já precisa estar cadastrada na etapa anterior."
            />

            <FormGrid>
              <TextField
                label="RM"
                required
                value={form.values.rm}
                // A API só aceita dígitos no RM: barrar aqui evita um 400 previsível
                onChange={(value) => form.setValue("rm", value.replace(/\D/g, ""))}
                error={form.errors.rm}
                placeholder="23130"
                hint="Só números. O registro de matrícula é único no sistema."
              />

              <FormField label="Período" required error={form.errors.period}>
                {({ id }) => (
                  <Select
                    value={form.values.period}
                    onValueChange={(value) => form.setValue("period", value as Period)}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((period) => (
                        <SelectItem key={period} value={period}>
                          {PERIOD_LABELS[period]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </FormGrid>

            <FormGrid>
              <TextField
                label="Curso"
                value={form.values.course}
                onChange={(value) => form.setValue("course", value)}
                error={form.errors.course}
                placeholder="Desenvolvimento de Sistemas"
              />

              <TextField
                label="Turma"
                value={form.values.class}
                onChange={(value) => form.setValue("class", value)}
                error={form.errors.class}
                placeholder="3 DS"
              />
            </FormGrid>

            <FormGrid>
              <TextField
                label="Responsável"
                value={form.values.responsible}
                onChange={(value) => form.setValue("responsible", value)}
                error={form.errors.responsible}
                maxLength={100}
                hint="Quem responde pelo aluno, quando ele é menor de idade."
              />

              <FormField label="Situação" error={form.errors.status}>
                {({ id }) => (
                  <Select
                    value={form.values.status}
                    onValueChange={(value) => form.setValue("status", value as StudentStatus)}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STUDENT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </FormGrid>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/people/create">Cadastrar a pessoa antes</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar aluno"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
