/**
 * CreatePerson.tsx - A primeira etapa do cadastro: a pessoa
 * # Pra que serve?
 * - Cadastrar quem é a pessoa, uma vez só, independente do perfil que ela terá
 * - Explicar que falta a segunda etapa, que é onde o perfil é criado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-19): Primeira versão do cadastro
 * - v2.0.0 (2026-09-10): Reescrita. O erro do servidor agora aparece embaixo do campo
 *                        que ele reclamou, e a tela diz qual é o próximo passo.
 *
 * Por que em duas etapas: assim ninguém aparece duplicado quando é aluno e depois
 * vira funcionário — a pessoa é a mesma, o que muda é o perfil pendurado nela.
 */

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertCircle, ArrowLeft, Check } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf, maskPhone } from "@/lib/format"
import { PERSON_TYPE_LABELS } from "@/lib/labels"
import { PERSON_TYPES, UNIT_TYPES, type PersonType, type UnitType } from "@/types/api"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Pra onde mandar a pessoa depois de cadastrar, conforme o perfil escolhido. */
const NEXT_STEP: Partial<Record<PersonType, { label: string; to: string }>> = {
  student: { label: "Cadastrar os dados de aluno", to: "/students/create" },
  teacher: { label: "Cadastrar os dados de professor", to: "/teachers/create" },
  employee: { label: "Cadastrar os dados de funcionário", to: "/employees/create" },
  coordinator: { label: "Cadastrar os dados de funcionário", to: "/employees/create" },
  inspector: { label: "Cadastrar os dados de funcionário", to: "/employees/create" },
  visitor: { label: "Cadastrar os dados de visitante", to: "/visitors/create" },
}

export default function CreatePerson() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [created, setCreated] = useState<{ name: string; type: PersonType } | null>(null)

  const form = useApiForm({
    full_name: "",
    cpf: "",
    email: "",
    phone: "",
    birth_date: "",
    type: "student" as PersonType,
    main_unit_type: (user?.unit_code?.startsWith("FAT") ? "Fatec" : "Etec") as UnitType,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!user?.unit_code) {
      toast.error("Sua conta não está vinculada a uma unidade.")
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/people", {
        full_name: values.full_name.trim(),
        cpf: values.cpf,
        email: values.email.trim(),
        phone: values.phone,
        // A API só aceita a data quando ela existe: string vazia é erro de formato
        ...(values.birth_date ? { birth_date: values.birth_date } : {}),
        type: values.type,
        main_unit_type: values.main_unit_type,
        unit_code: user.unit_code,
      })
    })

    if (ok) {
      toast.success("Pessoa cadastrada", { description: form.values.full_name })
      queryClient.invalidateQueries({ queryKey: ["people"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setCreated({ name: form.values.full_name, type: form.values.type })
    }
  }

  // Cadastrou: em vez de sumir da tela, explica o que falta pra pessoa existir de fato
  if (created) {
    const next = NEXT_STEP[created.type]

    return (
      <>
        <PageHeader title="Pessoa cadastrada" />

        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-authorized/10 text-authorized">
              <Check className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{created.name} está no cadastro.</p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Falta a segunda etapa: sem ela a pessoa não aparece na listagem de{" "}
                {PERSON_TYPE_LABELS[created.type].toLowerCase()}s, porque o perfil ainda
                não existe.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {next && (
                  <Button asChild>
                    <Link to={next.to}>{next.label}</Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => { form.reset(); setCreated(null) }}>
                  Cadastrar outra pessoa
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/people">Ver a lista de pessoas</Link>
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Cadastrar pessoa"
        description="Primeira etapa: quem é a pessoa. Depois você vincula o perfil dela."
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Panel>
          {form.formError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-[0.8125rem] text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{form.formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <TextField
              label="Nome completo"
              required
              value={form.values.full_name}
              onChange={(value) => form.setValue("full_name", value)}
              error={form.errors.full_name}
              autoComplete="name"
              maxLength={100}
            />

            <FormGrid>
              <TextField
                label="CPF"
                required
                value={form.values.cpf}
                onChange={(value) => form.setValue("cpf", maskCpf(value))}
                error={form.errors.cpf}
                placeholder="000.000.000-00"
                hint="A API confere os dígitos verificadores."
              />

              <TextField
                label="Telefone"
                required
                value={form.values.phone}
                onChange={(value) => form.setValue("phone", maskPhone(value))}
                error={form.errors.phone}
                placeholder="(12) 99999-9999"
              />
            </FormGrid>

            <FormGrid>
              <TextField
                label="E-mail"
                required
                type="email"
                value={form.values.email}
                onChange={(value) => form.setValue("email", value)}
                error={form.errors.email}
                autoComplete="email"
                maxLength={100}
                hint="É por aqui que sai a senha temporária, quando o perfil tem login."
              />

              <FormField label="Data de nascimento" error={form.errors.birth_date}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="date"
                    value={form.values.birth_date}
                    onChange={(event) => form.setValue("birth_date", event.target.value)}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                )}
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField label="Perfil" required error={form.errors.type}>
                {({ id }) => (
                  <Select
                    value={form.values.type}
                    onValueChange={(value) => form.setValue("type", value as PersonType)}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSON_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {PERSON_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField
                label="Tipo de unidade"
                required
                error={form.errors.main_unit_type}
                hint="Se a pessoa é de Etec ou de Fatec."
              >
                {({ id }) => (
                  <Select
                    value={form.values.main_unit_type}
                    onValueChange={(value) => form.setValue("main_unit_type", value as UnitType)}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </FormGrid>

            <p className="rounded-md border border-border bg-muted/40 p-2.5 text-[0.8125rem] text-muted-foreground">
              A pessoa será cadastrada na unidade{" "}
              <span className="identifier text-foreground">{user?.unit_code ?? "—"}</span>
              {user?.unit_name ? " (" + user.unit_name + ")" : ""}, que é a sua.
            </p>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/people">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar pessoa"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
