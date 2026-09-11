/**
 * CreateEmployee.tsx - A segunda etapa do cadastro de um funcionário
 * # Pra que serve?
 * - Vincular matrícula e cargo a uma pessoa já cadastrada
 * - Avisar que certos cargos dão login no sistema web, e que a senha vai por e-mail
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-23): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita. Os cargos agora vêm do GET /roles em vez de
 *                        estarem escritos na mão dentro da tela.
 */

import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf } from "@/lib/format"
import type { Role } from "@/types/api"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CreateEmployee() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get<{ roles: Role[] }>("/roles")
      // Do cargo mais poderoso pro menos, que é como a coordenação pensa a hierarquia
      return (data.roles ?? []).sort((a, b) => b.permission_level - a.permission_level)
    },
  })

  const form = useApiForm({
    cpf: "",
    registration_number: "",
    role_id: "",
    admission_date: "",
    active: true,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.values.role_id) {
      form.setFieldErrors({ role_id: "Escolhe um cargo" })
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/employees", {
        cpf: values.cpf,
        registration_number: values.registration_number.trim(),
        role_id: Number(values.role_id),
        active: values.active,
        ...(values.admission_date ? { admission_date: values.admission_date } : {}),
      })
    })

    if (ok) {
      toast.success("Funcionário cadastrado", {
        description: "Matrícula " + form.values.registration_number,
      })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/employees")
    }
  }

  const selectedRole = roles.data?.find((role) => String(role.id) === form.values.role_id)

  return (
    <>
      <PageHeader
        title="Cadastrar funcionário"
        description="Segunda etapa: vincula matrícula e cargo a uma pessoa já cadastrada."
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
                label="Matrícula"
                required
                value={form.values.registration_number}
                onChange={(value) => form.setValue("registration_number", value)}
                error={form.errors.registration_number}
                placeholder="ADM001"
              />

              <FormField
                label="Cargo"
                required
                error={form.errors.role_id}
                hint={selectedRole?.description ?? undefined}
              >
                {({ id }) => (
                  <Select
                    value={form.values.role_id}
                    onValueChange={(value) => form.setValue("role_id", value)}
                    disabled={roles.isLoading}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue
                        placeholder={roles.isLoading ? "Carregando cargos..." : "Escolhe o cargo"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.data?.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField label="Data de admissão" error={form.errors.admission_date}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="date"
                    value={form.values.admission_date}
                    onChange={(event) => form.setValue("admission_date", event.target.value)}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>

              <div className="flex items-end pb-1.5">
                <div className="flex items-center gap-2.5">
                  <Switch
                    id="employee-active"
                    checked={form.values.active}
                    onCheckedChange={(checked) => form.setValue("active", checked)}
                  />
                  <Label htmlFor="employee-active" className="cursor-pointer">
                    Funcionário ativo
                  </Label>
                </div>
              </div>
            </FormGrid>

            <p className="rounded-md border border-border bg-muted/40 p-2.5 text-[0.8125rem] text-muted-foreground">
              Coordenador, funcionário e inspetor têm login no sistema web. A senha
              temporária vai pro e-mail cadastrado na pessoa, e ela define a definitiva no
              primeiro acesso.
            </p>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/people/create">Cadastrar a pessoa antes</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar funcionário"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
