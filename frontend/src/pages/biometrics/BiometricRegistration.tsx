/**
 * BiometricRegistration.tsx - O registro de uma digital
 * # Pra que serve?
 * - Vincular o template lido pelo sensor a uma pessoa e a um dedo
 * - Permitir testar o sistema inteiro SEM o sensor R307, gerando um template pela API
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-09-02): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita. O template gerado agora aparece na tela, com a
 *                        qualidade, em vez de ser preenchido invisivelmente.
 */

import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Fingerprint, Sparkles } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, apiErrorMessage } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useApiForm } from "@/hooks/useApiForm"
import { maskCpf } from "@/lib/format"
import { FINGER_LABELS } from "@/lib/labels"
import { FINGERS, type Finger } from "@/types/api"
import { PageHeader, Panel, StatusBadge } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BiometricRegistration() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useApiForm({
    cpf: "",
    finger: "index_right" as Finger,
    template: "",
    device: "R307",
    quality: null as number | null,
  })

  /** Sem o sensor em mãos, a API devolve um template válido pra testar o fluxo. */
  const generate = useMutation({
    mutationFn: async (finger: Finger) => {
      const { data } = await api.get<{ data: { template: string; quality: number } }>(
        "/biometrics/generate/" + finger,
      )
      return data.data
    },
    onSuccess: (generated) => {
      form.setValue("template", generated.template)
      form.setValue("quality", generated.quality)
      toast.success("Template gerado", { description: "Qualidade " + generated.quality + "%" })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui gerar o template."))
    },
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!user?.unit_code) {
      toast.error("Sua conta não está vinculada a uma unidade.")
      return
    }

    if (!form.values.template.trim()) {
      form.setFieldErrors({ template: "Falta o template: leia no sensor ou gere um pra teste" })
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/biometrics", {
        cpf: values.cpf,
        template: values.template.trim(),
        finger: values.finger,
        device: values.device.trim() || "R307",
        unit_code: user.unit_code,
        ...(values.quality !== null ? { quality: values.quality } : {}),
      })
    })

    if (ok) {
      toast.success("Digital registrada", { description: FINGER_LABELS[form.values.finger] })
      queryClient.invalidateQueries({ queryKey: ["biometrics"] })
      navigate("/biometrics")
    }
  }

  return (
    <>
      <PageHeader
        title="Registrar digital"
        description="Vincula uma digital a uma pessoa. Cada pessoa pode ter até dez, uma por dedo."
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
                label="CPF da pessoa"
                required
                value={form.values.cpf}
                onChange={(value) => form.setValue("cpf", maskCpf(value))}
                error={form.errors.cpf}
                placeholder="000.000.000-00"
              />

              <FormField label="Dedo" required error={form.errors.finger}>
                {({ id }) => (
                  <Select
                    value={form.values.finger}
                    onValueChange={(value) => form.setValue("finger", value as Finger)}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINGERS.map((finger) => (
                        <SelectItem key={finger} value={finger}>
                          {FINGER_LABELS[finger]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </FormGrid>

            <FormField
              label="Template biométrico"
              required
              error={form.errors.template}
              hint="Em base64. Vem do sensor R307; sem ele, gere um pra teste."
            >
              {({ id, describedBy, invalid }) => (
                <div className="space-y-2">
                  <Textarea
                    id={id}
                    value={form.values.template}
                    onChange={(event) => {
                      form.setValue("template", event.target.value)
                      // Template digitado à mão não tem a qualidade que a API mediu
                      form.setValue("quality", null)
                    }}
                    rows={4}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className="font-mono text-[0.75rem]"
                    placeholder="Cole aqui o template lido pelo sensor"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generate.mutate(form.values.finger)}
                      disabled={generate.isPending}
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {generate.isPending ? "Gerando..." : "Gerar template de teste"}
                    </Button>

                    {form.values.quality !== null && (
                      <StatusBadge tone="authorized">
                        Qualidade {form.values.quality}%
                      </StatusBadge>
                    )}
                  </div>
                </div>
              )}
            </FormField>

            <FormGrid>
              <TextField
                label="Sensor"
                value={form.values.device}
                onChange={(value) => form.setValue("device", value)}
                error={form.errors.device}
                hint="O modelo do leitor. O padrão do projeto é o R307."
              />
            </FormGrid>

            <p className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-[0.8125rem] text-muted-foreground">
              <Fingerprint className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                A digital fica vinculada à unidade{" "}
                <span className="identifier text-foreground">{user?.unit_code ?? "—"}</span>, que
                é a sua. O template de teste é aleatório e serve pra ver o sistema
                funcionando sem o hardware.
              </span>
            </p>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/biometrics">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Registrando..." : "Registrar digital"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
