import type React from "react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateVisitor() {
  const [searchParams] = useSearchParams()
  const cpf = searchParams.get("cpf") || ""
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    visit_reason: "",
    responsible_employee_cpf: "",
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

      if (!formData.responsible_employee_cpf || !formData.responsible_employee_cpf.trim()) {
        toast({
          title: "Erro",
          description: "CPF do funcionário responsável é obrigatório",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const visitorData = {
        cpf: cpf.replace(/\D/g, ""),
        company: formData.company || undefined,
        visit_reason: formData.visit_reason || undefined,
        responsible_employee_cpf: formData.responsible_employee_cpf.replace(/\D/g, ""),
      }

      const response = await api.post("/visitors", visitorData)

      if (response.data) {
        toast({
          title: "Visitante cadastrado com sucesso!",
          description: "O visitante foi registrado no sistema.",
        })
        navigate("/visitors")
      }
    } catch (error: any) {
      console.error("Error creating visitor:", error)
      toast({
        title: "Erro ao cadastrar visitante",
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
          <h1 className="text-3xl font-bold">Cadastrar Visitante - Etapa 2</h1>
          <p className="text-muted-foreground">Complete os dados específicos do visitante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Dados do Visitante</CardTitle>
            <CardDescription>Preencha as informações da visita</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" value={cpf} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Nome da empresa (se aplicável)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_reason">Motivo da Visita</Label>
              <Textarea
                id="visit_reason"
                value={formData.visit_reason}
                onChange={(e) => handleChange("visit_reason", e.target.value)}
                placeholder="Descreva o motivo da visita..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_employee_cpf">CPF do Funcionário Responsável *</Label>
              <Input
                id="responsible_employee_cpf"
                value={formData.responsible_employee_cpf}
                onChange={(e) => handleChange("responsible_employee_cpf", e.target.value)}
                placeholder="000.000.000-00"
                required
              />
              <p className="text-xs text-muted-foreground">
                CPF do funcionário que será responsável por este visitante (obrigatório)
              </p>
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

