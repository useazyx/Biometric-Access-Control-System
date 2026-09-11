/**
 * CreateTeacher.tsx - A terceira etapa: transformar um funcionário em professor
 * # Pra que serve?
 * - Registrar as matérias que a pessoa leciona e onde ela pode lecionar
 * - Deixar explícito que professor é um FUNCIONÁRIO com matérias, não um perfil solto
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2026-09-10): Primeira versão. Antes não existia tela pra isso: dava pra
 *                        listar professor, mas não pra cadastrar um pelo sistema.
 */

import { useState, type KeyboardEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf } from "@/lib/format"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function CreateTeacher() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [subjectDraft, setSubjectDraft] = useState("")

  const form = useApiForm({
    cpf: "",
    subjects: [] as string[],
    can_teach_etec: true,
    can_teach_fatec: false,
  })

  /** Não repete matéria e não aceita entrada vazia. */
  function addSubject() {
    const subject = subjectDraft.trim()
    if (!subject) return

    if (form.values.subjects.some((item) => item.toLowerCase() === subject.toLowerCase())) {
      setSubjectDraft("")
      return
    }

    form.setValue("subjects", [...form.values.subjects, subject])
    setSubjectDraft("")
  }

  function removeSubject(subject: string) {
    form.setValue(
      "subjects",
      form.values.subjects.filter((item) => item !== subject),
    )
  }

  function handleSubjectKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter aqui adiciona a matéria; sem isto ele enviaria o formulário inteiro
    if (event.key === "Enter") {
      event.preventDefault()
      addSubject()
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.values.subjects.length) {
      form.setFieldErrors({ subjects: "Adiciona pelo menos uma matéria" })
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/teachers", {
        cpf: values.cpf,
        subjects: values.subjects,
        can_teach_etec: values.can_teach_etec,
        can_teach_fatec: values.can_teach_fatec,
      })
    })

    if (ok) {
      toast.success("Professor cadastrado")
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      navigate("/teachers")
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastrar professor"
        description="Professor é um funcionário com matérias: ele já precisa ter matrícula."
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
              label="CPF do funcionário"
              required
              value={form.values.cpf}
              onChange={(value) => form.setValue("cpf", maskCpf(value))}
              error={form.errors.cpf}
              placeholder="000.000.000-00"
              hint="A pessoa precisa já estar cadastrada como funcionário."
            />

            <FormField
              label="Matérias"
              required
              error={form.errors.subjects}
              hint="Digite uma e aperte Enter. Pelo menos uma é obrigatória."
            >
              {({ id, describedBy, invalid }) => (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id={id}
                      value={subjectDraft}
                      onChange={(event) => setSubjectDraft(event.target.value)}
                      onKeyDown={handleSubjectKeyDown}
                      placeholder="Matemática"
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                    />
                    <Button type="button" variant="outline" onClick={addSubject}>
                      <Plus className="mr-1 h-4 w-4" aria-hidden />
                      Adicionar
                    </Button>
                  </div>

                  {form.values.subjects.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {form.values.subjects.map((subject) => (
                        <li key={subject}>
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[0.8125rem]">
                            {subject}
                            <button
                              type="button"
                              onClick={() => removeSubject(subject)}
                              aria-label={"Remover " + subject}
                              className="grid h-4 w-4 place-items-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </FormField>

            <fieldset className="space-y-2.5">
              <legend className="text-sm font-medium">Pode lecionar em</legend>

              <div className="flex items-center gap-2.5">
                <Switch
                  id="teach-etec"
                  checked={form.values.can_teach_etec}
                  onCheckedChange={(checked) => form.setValue("can_teach_etec", checked)}
                />
                <Label htmlFor="teach-etec" className="cursor-pointer font-normal">
                  Etec
                </Label>
              </div>

              <div className="flex items-center gap-2.5">
                <Switch
                  id="teach-fatec"
                  checked={form.values.can_teach_fatec}
                  onCheckedChange={(checked) => form.setValue("can_teach_fatec", checked)}
                />
                <Label htmlFor="teach-fatec" className="cursor-pointer font-normal">
                  Fatec
                </Label>
              </div>
            </fieldset>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/employees/create">Cadastrar o funcionário antes</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar professor"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
