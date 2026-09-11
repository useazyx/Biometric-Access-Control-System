import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { normalizeSubject } from "@/utils/subjectNormalizer"
import type { Role } from "@/types"

export default function CreateEmployee() {
  const [searchParams] = useSearchParams()
  const cpf = searchParams.get("cpf") || ""
  const nextStep = searchParams.get("next") // "teacher" se for professor
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState({
    registration_number: "",
    admission_date: "",
    role_id: "",
    active: true,
  })
  const [teacherData, setTeacherData] = useState({
    subjects: [] as string[],
    can_teach_fatec: false,
    can_teach_etec: false,
  })
  const [currentSubject, setCurrentSubject] = useState("")

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const response = await api.get("/roles")
      const rolesData = Array.isArray(response.data) ? response.data : response.data.roles || []
      setRoles(rolesData)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cargos",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSubject = () => {
    if (currentSubject.trim()) {
      const normalized = normalizeSubject(currentSubject.trim())
      if (!teacherData.subjects.includes(normalized)) {
        setTeacherData((prev) => ({
          ...prev,
          subjects: [...prev.subjects, normalized],
        }))
        setCurrentSubject("")
      }
    }
  }

  const handleRemoveSubject = (subject: string) => {
    setTeacherData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!cpf) {
        throw new Error("CPF não encontrado")
      }

      // Primeiro cria o funcionário
      const employeeData = {
        cpf: cpf.replace(/\D/g, ""),
        registration_number: formData.registration_number,
        role_id: Number.parseInt(formData.role_id),
        admission_date: formData.admission_date || undefined,
        active: formData.active,
      }

      const employeeResponse = await api.post("/employees", employeeData)

      if (employeeResponse.data) {
        toast({
          title: "Funcionário cadastrado com sucesso!",
          description: nextStep === "teacher" ? "Agora vamos cadastrar como professor..." : "Funcionário registrado no sistema.",
        })

        // Se for professor, cria o registro de professor também
        if (nextStep === "teacher") {
          if (teacherData.subjects.length === 0) {
            throw new Error("Adicione pelo menos uma matéria")
          }

          const teacherResponse = await api.post("/teachers", {
            cpf: cpf.replace(/\D/g, ""),
            subjects: teacherData.subjects,
            can_teach_fatec: teacherData.can_teach_fatec,
            can_teach_etec: teacherData.can_teach_etec,
          })

          if (teacherResponse.data) {
            toast({
              title: "Professor cadastrado com sucesso!",
              description: "O professor foi registrado no sistema.",
            })
            navigate("/teachers")
          }
        } else {
          navigate("/employees")
        }
      }
    } catch (error: any) {
      console.error("Error creating employee:", error)
      toast({
        title: "Erro ao cadastrar funcionário",
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
          <h1 className="text-3xl font-bold">
            {nextStep === "teacher" ? "Cadastrar Professor - Etapa 2" : "Cadastrar Funcionário - Etapa 2"}
          </h1>
          <p className="text-muted-foreground">
            {nextStep === "teacher" ? "Complete os dados do funcionário e professor" : "Complete os dados específicos do funcionário"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Dados do Funcionário</CardTitle>
            <CardDescription>Preencha as informações profissionais</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" value={cpf} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Número de Registro *</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => handleChange("registration_number", e.target.value)}
                required
                placeholder="Ex: 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_id">Cargo *</Label>
              <Select value={formData.role_id} onValueChange={(v) => handleChange("role_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admission_date">Data de Admissão</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => handleChange("admission_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status *</Label>
              <Select
                value={formData.active ? "active" : "inactive"}
                onValueChange={(v) => handleChange("active", v === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {nextStep === "teacher" && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Dados do Professor</CardTitle>
              <CardDescription>Informações específicas para ensino</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjects">Matérias *</Label>
                <div className="flex gap-2">
                  <Input
                    id="subjects"
                    value={currentSubject}
                    onChange={(e) => setCurrentSubject(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddSubject()
                      }
                    }}
                    placeholder="Digite uma matéria e pressione Enter"
                  />
                  <Button type="button" onClick={handleAddSubject} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {teacherData.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {teacherData.subjects.map((subject) => (
                      <div key={subject} className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <span className="text-sm">{subject}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubject(subject)}
                          className="h-4 w-4 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Pode lecionar em:</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_teach_fatec"
                      checked={teacherData.can_teach_fatec}
                      onCheckedChange={(checked) =>
                        setTeacherData((prev) => ({ ...prev, can_teach_fatec: checked === true }))
                      }
                    />
                    <Label htmlFor="can_teach_fatec" className="cursor-pointer">
                      FATEC
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_teach_etec"
                      checked={teacherData.can_teach_etec}
                      onCheckedChange={(checked) =>
                        setTeacherData((prev) => ({ ...prev, can_teach_etec: checked === true }))
                      }
                    />
                    <Label htmlFor="can_teach_etec" className="cursor-pointer">
                      ETEC
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

