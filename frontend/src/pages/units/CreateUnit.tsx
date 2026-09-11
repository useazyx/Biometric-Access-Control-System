/**
 * CreateUnit.tsx - Cadastro de uma Etec ou Fatec
 * # Pra que serve?
 * - Criar a unidade onde as pessoas vão ser cadastradas
 * - Validar o código antes de enviar, porque o formato é rígido (ETE001, FAT001)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-29): Primeira versão
 * - v2.0.0 (2026-09-10): Reescrita. O código passou a ser conferido na tela e a sugerir
 *                        o prefixo conforme o tipo escolhido.
 */

import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApiForm } from "@/hooks/useApiForm"
import { maskPhone } from "@/lib/format"
import { UNIT_TYPES, type UnitType } from "@/types/api"
import { PageHeader, Panel } from "@/components/data/Primitives"
import { FormActions, FormField, FormGrid, TextField } from "@/components/form/FormField"
import { FormAlert } from "@/components/form/FormAlert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** O mesmo formato que o backend exige: ETE ou FAT seguido de três dígitos. */
const UNIT_CODE_PATTERN = /^(FAT|ETE)\d{3}$/

export default function CreateUnit() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useApiForm({
    name: "",
    unit_type: "Etec" as UnitType,
    unit_code: "",
    address: "",
    phone: "",
    is_extension: false,
  })

  /** Trocar o tipo troca o prefixo do código, que é o erro mais comum aqui. */
  function handleTypeChange(value: string) {
    const unitType = value as UnitType
    form.setValue("unit_type", unitType)

    const prefix = unitType === "Fatec" ? "FAT" : "ETE"
    const digits = form.values.unit_code.replace(/\D/g, "")
    if (digits) form.setValue("unit_code", prefix + digits.slice(0, 3))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Confere na tela antes de gastar requisição num erro previsível
    if (!UNIT_CODE_PATTERN.test(form.values.unit_code)) {
      form.setFieldErrors({ unit_code: "Formato inválido (ex: ETE001 ou FAT001)" })
      return
    }

    const ok = await form.submit(async (values) => {
      await api.post("/units", {
        name: values.name.trim(),
        unit_type: values.unit_type,
        unit_code: values.unit_code,
        is_extension: values.is_extension,
        ...(values.address.trim() ? { address: values.address.trim() } : {}),
        ...(values.phone.trim() ? { phone: values.phone } : {}),
      })
    })

    if (ok) {
      toast.success("Unidade cadastrada", { description: form.values.name })
      queryClient.invalidateQueries({ queryKey: ["units"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/units")
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastrar unidade"
        description="Uma Etec ou Fatec, sede ou extensão."
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
              label="Nome da unidade"
              required
              value={form.values.name}
              onChange={(value) => form.setValue("name", value)}
              error={form.errors.name}
              maxLength={50}
              placeholder="ETEC Dr. Geraldo José Rodrigues Alckmin"
            />

            <FormGrid>
              <FormField label="Tipo" required error={form.errors.unit_type}>
                {({ id }) => (
                  <Select value={form.values.unit_type} onValueChange={handleTypeChange}>
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

              <TextField
                label="Código"
                required
                value={form.values.unit_code}
                onChange={(value) => form.setValue("unit_code", value.toUpperCase().slice(0, 6))}
                error={form.errors.unit_code}
                placeholder={form.values.unit_type === "Fatec" ? "FAT001" : "ETE001"}
                hint="Seis caracteres: ETE ou FAT e três dígitos."
                maxLength={6}
              />
            </FormGrid>

            <FormField label="Endereço" error={form.errors.address}>
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  value={form.values.address}
                  onChange={(event) => form.setValue("address", event.target.value)}
                  rows={2}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  placeholder="Rua, número, bairro e cidade"
                />
              )}
            </FormField>

            <FormGrid>
              <TextField
                label="Telefone"
                value={form.values.phone}
                onChange={(value) => form.setValue("phone", maskPhone(value))}
                error={form.errors.phone}
                placeholder="(12) 3333-4444"
              />

              <div className="flex items-end pb-1.5">
                <div className="flex items-center gap-2.5">
                  <Switch
                    id="unit-extension"
                    checked={form.values.is_extension}
                    onCheckedChange={(checked) => form.setValue("is_extension", checked)}
                  />
                  <Label htmlFor="unit-extension" className="cursor-pointer">
                    É uma extensão
                  </Label>
                </div>
              </div>
            </FormGrid>
          </div>

          <FormActions>
            <Button type="button" variant="ghost" asChild>
              <Link to="/units">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={form.submitting}>
              {form.submitting ? "Cadastrando..." : "Cadastrar unidade"}
            </Button>
          </FormActions>
        </Panel>
      </form>
    </>
  )
}
