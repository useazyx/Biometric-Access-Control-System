import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/services/api"
import type { PersonTypeEnum, UnitTypeEnum, Unit, Role } from "../../types"
import { useToast } from "@/hooks/use-toast"

export default function CreatePerson() {
  const [personType, setPersonType] = useState<PersonTypeEnum>("student")
  const [units, setUnits] = useState<Unit[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState({
    // Person - ETAPA 1 (dados básicos apenas)
    full_name: "",
    birth_date: "",
    cpf: "",
    email: "",
    phone: "",
    main_unit_type: "Fatec" as UnitTypeEnum,
    registration_unit_id: "",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const unitsRes = await api.get("/units")
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data.units || [])

      // Fetch roles from backend instead of hardcoded
      const rolesRes = await api.get("/roles")
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.roles || []
      setRoles(rolesData)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      })
      // Fallback to empty arrays if fetch fails
      setRoles([])
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedUnit = units.find((u) => u.id === Number.parseInt(formData.registration_unit_id))
      if (!selectedUnit) {
        throw new Error("Unidade não encontrada")
      }

      const personData: any = {
        full_name: formData.full_name,
        birth_date: formData.birth_date || undefined,
        cpf: formData.cpf,
        email: formData.email,
        phone: formData.phone || "",
        type: personType,
        main_unit_type: formData.main_unit_type,
        unit_code: selectedUnit.unit_code,
      }

      const response = await api.post("/people", personData)

      if (!response.data || !response.data.id) {
        throw new Error("Resposta inválida do servidor")
      }

      toast({
        title: "Etapa 1 Concluída!",
        description: `Pessoa cadastrada com sucesso. Redirecionando para completar o cadastro de ${
          personType === "teacher"
            ? "professor"
            : personType === "student"
              ? "estudante"
              : personType === "visitor"
                ? "visitante"
                : "funcionário"
        }.`,
      })

      if (personType === "employee" || personType === "coordinator" || personType === "inspector") {
        navigate(`/employees/create?cpf=${formData.cpf}`)
      } else if (personType === "teacher") {
        navigate(`/employees/create?cpf=${formData.cpf}&next=teacher`)
      } else if (personType === "student") {
        navigate(`/students/create?cpf=${formData.cpf}`)
      } else if (personType === "visitor") {
        navigate(`/visitors/create?cpf=${formData.cpf}`)
      } else {
        navigate("/people")
      }
    } catch (error: any) {
      console.error("Error creating person:", error)
      toast({
        title: "Erro ao criar pessoa",
        description: error.response?.data?.message || error.response?.data?.error || error.message,
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
          <h1 className="text-3xl font-bold">Nova Pessoa - Etapa 1</h1>
          <p className="text-muted-foreground">Cadastre os dados básicos da pessoa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas - ETAPA 1 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Preencha os dados pessoais e de contato (Etapa 1 de 2)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="personType">Tipo de Pessoa *</Label>
              <Select value={personType} onValueChange={(v) => setPersonType(v as PersonTypeEnum)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="visitor">Visitante</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="inspector">Inspetor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" value={formData.cpf} onChange={(e) => handleChange("cpf", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_unit_type">Tipo de Unidade Principal *</Label>
              <Select value={formData.main_unit_type} onValueChange={(v) => handleChange("main_unit_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fatec">FATEC</SelectItem>
                  <SelectItem value="Etec">ETEC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_unit_id">Unidade de Registro *</Label>
              <Select
                value={formData.registration_unit_id}
                onValueChange={(v) => handleChange("registration_unit_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} - {u.unit_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Próximo passo:</strong> Após salvar, você será redirecionado para preencher os dados específicos de{" "}
            {personType === "teacher"
              ? "professor (Etapa 2a: Funcionário, Etapa 2b: Professor)"
              : personType === "student"
                ? "estudante"
                : personType === "visitor"
                  ? "visitante"
                  : "funcionário"}
            .
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/people")}>
            Cancelar
          </Button>
          <Button type="submit" className="gradient-primary" disabled={loading}>
            {loading ? "Salvando..." : "Continuar para Etapa 2"}
          </Button>
        </div>
      </form>
    </div>
  )
}
