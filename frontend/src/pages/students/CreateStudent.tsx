import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import type { PeriodEnum, StudentStatusEnum } from "@/types"

export default function CreateStudent() {
  const [searchParams] = useSearchParams()
  const cpf = searchParams.get("cpf") || ""
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rm: "",
    period: "morning" as PeriodEnum,
    course: "",
    class: "",
    responsible: "",
    status: "active" as StudentStatusEnum,
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!cpf) {
        throw new Error("CPF não encontrado")
      }

      const studentData = {
        cpf: cpf.replace(/\D/g, ""),
        rm: formData.rm,
        period: formData.period,
        course: formData.course || undefined,
        class: formData.class || undefined,
        responsible: formData.responsible || undefined,
        status: formData.status,
      }

      const response = await api.post("/students", studentData)

      if (response.data) {
        toast({
          title: "Aluno cadastrado com sucesso!",
          description: "O estudante foi registrado no sistema.",
        })
        navigate("/students")
      }
    } catch (error: any) {
      console.error("Error creating student:", error)
      toast({
        title: "Erro ao cadastrar aluno",
        description: error.response?.data?.error || error.response?.data?.message || error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/people")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Cadastrar Aluno - Etapa 2</h1>
          <p className="text-muted-foreground">Complete os dados específicos do estudante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Dados do Aluno</CardTitle>
            <CardDescription>Preencha as informações acadêmicas do estudante</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" value={cpf} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rm">RM (Registro de Matrícula) *</Label>
              <Input
                id="rm"
                value={formData.rm}
                onChange={(e) => handleChange("rm", e.target.value)}
                required
                placeholder="Ex: 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Select value={formData.period} onValueChange={(v) => handleChange("period", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noite</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) => handleChange("course", e.target.value)}
                placeholder="Ex: Informática"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Turma</Label>
              <Input
                id="class"
                value={formData.class}
                onChange={(e) => handleChange("class", e.target.value)}
                placeholder="Ex: 1º A"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleChange("responsible", e.target.value)}
                placeholder="Nome do responsável (se menor de idade)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="transferred">Transferido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/people")}>
            Cancelar
          </Button>
          <Button type="submit" className="gradient-primary" disabled={loading}>
            {loading ? "Salvando..." : "Finalizar Cadastro"}
          </Button>
        </div>
      </form>
    </div>
  )
}

