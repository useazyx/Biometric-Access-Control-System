import type React from "react"

import { useState, useEffect } from "react"
import { Settings, Trash2, Edit, GraduationCap, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DialogDetails } from "@/components/ui/dialog-details"
import { normalizeSubject, normalizeSubjects } from "@/utils/subjectNormalizer"
import { api } from "@/services/api"
import type { Teacher, Employee, Person } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"
import { useUnitCode } from "@/contexts/AuthContext"

export default function TeachersList() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [managementSearchTerm, setManagementSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    subjects: "",
    can_teach_fatec: false,
    can_teach_etec: false,
    employee_id: "",
  })
  const { toast } = useToast()
  const { confirmar, ConfirmDialog } = useConfirm()

  // Unidade do usuário logado: é o filtro de toda listagem
  const unitCode = useUnitCode()

  useEffect(() => {
    // Enquanto o perfil não chegou a gente não sabe qual unidade consultar
    if (!unitCode) return
    loadData()
  }, [unitCode])


  const loadData = async () => {
    try {
      setLoading(true)


      const employeesRes = await api.get("/employees", {
        params: { unit_code: unitCode, page: "1", page_size: "1000" },
      })
      const employeesData = Array.isArray(employeesRes.data?.employees) ? employeesRes.data.employees : []
      setEmployees(employeesData)

      const teachersRes = await api.get("/teachers", {
        params: { unit_code: unitCode, page: "1", page_size: "1000" },
      })
      const teachersData = Array.isArray(teachersRes.data?.teachers) ? teachersRes.data.teachers : []
      // Ensure boolean values are properly set
      const normalizeBool = (v: any) => {
        if (typeof v === "boolean") return v
        if (typeof v === "number") return v === 1
        if (typeof v === "string") {
          const s = v.toLowerCase()
          return s === "true" || s === "1" || s === "sim"
        }
        return false
      }
      const processedTeachers = teachersData.map((t: any) => ({
        ...t,
        can_teach_fatec: normalizeBool(t.can_teach_fatec),
        can_teach_etec: normalizeBool(t.can_teach_etec),
      }))
      setTeachers(processedTeachers)

      // Fetch people who are teachers
      const peopleRes = await api.get("/people", {
        params: { unit_code: unitCode, type: "teacher", page: "1", page_size: "1000" },
      })
      const peopleData = Array.isArray(peopleRes.data?.people) ? peopleRes.data.people : []
      setPeople(peopleData)

    } catch (error: any) {
      console.error("Error loading teachers:", error)

      let errorMessage = "Erro ao carregar dados"
      if (error.response?.status === 400) {
        errorMessage = `Erro de validação: ${error.response?.data?.error || "unit_code inválido"}`
      } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Timeout - Verifique se o backend está rodando"
      } else {
        errorMessage = error.message
      }

      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!formData.employee_id) {
        toast({
          title: "Erro",
          description: "Selecione um funcionário",
          variant: "destructive",
        })
        return
      }

      const subjectsArray = normalizeSubjects(
        formData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      )

      if (editingTeacher) {
        await api.patch(`/teachers/${editingTeacher.id}`, {
          subjects: subjectsArray,
          can_teach_fatec: formData.can_teach_fatec,
          can_teach_etec: formData.can_teach_etec,
        })
        toast({ title: "Professor atualizado!" })
        setDialogOpen(false)
        resetForm()
        setEditingTeacher(null)
        loadData()
        return
      } else {
        await api.post("/teachers", {
          subjects: subjectsArray,
          can_teach_fatec: formData.can_teach_fatec,
          can_teach_etec: formData.can_teach_etec,
          employee_id: Number.parseInt(formData.employee_id),
        })
        toast({ title: "Professor criado!" })
      }

      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar professor",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      subjects: teacher.subjects.join(", "),
      can_teach_fatec: teacher.can_teach_fatec,
      can_teach_etec: teacher.can_teach_etec,
      employee_id: teacher.employee_id.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (teacher: Teacher) => {
    const confirmado = await confirmar({
      title: "Excluir este professor?",
      description:
        "Isso apaga a pessoa do sistema junto com as digitais e o histórico de acesso dela. Não tem como desfazer.",
      confirmLabel: "Excluir",
    })
    if (!confirmado) return

    try {
      // Buscar pessoa através do teacher -> employee -> person
      const teacherData = teachers.find((t) => t.id === teacher.id)
      if (!teacherData) {
        toast({ title: "Erro", description: "Professor não encontrado", variant: "destructive" })
        return
      }
      
      const employee = employees.find((e) => e.id === teacherData.employee_id)
      if (!employee) {
        toast({ title: "Erro", description: "Funcionário não encontrado", variant: "destructive" })
        return
      }
      
      // Buscar pessoa pelo person_id do employee
      const person = people.find((p) => p.id === (employee as any).person_id || employee.id)
      if (!person) {
        // Tentar buscar pelo CPF se disponível no employee
        const personByCpf = people.find((p) => (p as any).cpf === (employee as any).cpf)
        if (!personByCpf) {
          toast({ title: "Erro", description: "Pessoa não encontrada", variant: "destructive" })
          return
        }
        await api.delete("/people", { data: { cpf: personByCpf.cpf } })
      } else {
        await api.delete("/people", { data: { cpf: person.cpf } })
      }
      toast({ title: "Professor excluído!" })
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir professor",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      subjects: "",
      can_teach_fatec: false,
      can_teach_etec: false,
      employee_id: "",
    })
    setEditingTeacher(null)
  }

  const getEmployeeName = (employeeId: number) => {
    // First try to get from teachers data (which may have full_name)
    const teacher = teachers.find((t) => t.employee_id === employeeId)
    if (teacher && (teacher as any).full_name) {
      return (teacher as any).full_name
    }

    // Fall back to employees + people lookup
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return "Desconhecido"
    const person = people.find((p) => p.id === employee.person_id)
    return person?.full_name || "Desconhecido"
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      getEmployeeName(teacher.employee_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setDetailsOpen(true)
  }

  const getNormalizedSubjects = (subjects: string[]) => {
    return subjects.map(normalizeSubject)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Professores</h1>
          <p className="section-description">Gerencie professores cadastrados no sistema</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              resetForm()
              setEditingTeacher(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Settings className="mr-2 w-4 h-4" />
              Gerenciar Professores
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Editar Professor" : "Gerenciar Professores"}</DialogTitle>
              <DialogDescription>
                {editingTeacher ? "Atualize as informações do professor" : "Selecione um professor para editar ou excluir"}
              </DialogDescription>
            </DialogHeader>
            
            {editingTeacher ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subjects">Disciplinas * (separadas por vírgula)</Label>
                  <Input
                    id="subjects"
                    value={formData.subjects}
                    onChange={(e) => {
                      const normalized = normalizeSubject(e.target.value)
                      setFormData({ ...formData, subjects: normalized })
                    }}
                    placeholder="Ex: Matemática, Português, História"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    As disciplinas serão normalizadas automaticamente (ex: "matematica" → "Matematica")
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="can_teach_fatec"
                    checked={formData.can_teach_fatec}
                    onChange={(e) => setFormData({ ...formData, can_teach_fatec: e.target.checked })}
                  />
                  <Label htmlFor="can_teach_fatec">Pode ensinar na FATEC</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="can_teach_etec"
                    checked={formData.can_teach_etec}
                    onChange={(e) => setFormData({ ...formData, can_teach_etec: e.target.checked })}
                  />
                  <Label htmlFor="can_teach_etec">Pode ensinar na ETEC</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingTeacher(null)
                    resetForm()
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Atualizar
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar professores..."
                    value={managementSearchTerm}
                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredTeachers
                    .filter((t) =>
                      getEmployeeName(t.employee_id).toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                      t.subjects.some((s) => s.toLowerCase().includes(managementSearchTerm.toLowerCase()))
                    )
                    .length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhum professor encontrado</p>
                  ) : (
                    filteredTeachers
                      .filter((t) =>
                        getEmployeeName(t.employee_id).toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                        t.subjects.some((s) => s.toLowerCase().includes(managementSearchTerm.toLowerCase()))
                      )
                      .map((teacher) => (
                      <Card key={teacher.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{getEmployeeName(teacher.employee_id)}</h4>
                            <p className="text-sm text-muted-foreground">
                              Disciplinas: {getNormalizedSubjects(teacher.subjects).join(", ")}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {teacher.can_teach_fatec && <Badge className="bg-blue-500">FATEC</Badge>}
                              {teacher.can_teach_etec && <Badge className="bg-green-500">ETEC</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Edit className="mr-2 w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(teacher)}
                            >
                              <Trash2 className="mr-2 w-4 h-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
          <CardDescription>Busque professores por nome ou disciplina</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome ou disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </Card>
        ) : filteredTeachers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum professor encontrado</p>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="glass-card shadow-card transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{getEmployeeName(teacher.employee_id)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Disciplinas: {getNormalizedSubjects(teacher.subjects).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {teacher.can_teach_fatec && <Badge className="badge-soft-blue">FATEC</Badge>}
                      {teacher.can_teach_etec && <Badge className="badge-soft-green">ETEC</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(teacher)}>
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedTeacher && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes do Professor - ${getEmployeeName(selectedTeacher.employee_id)}`}
          description="Informações completas do professor"
          details={[
            { label: "Nome", value: getEmployeeName(selectedTeacher.employee_id) },
            {
              label: "Disciplinas",
              value: getNormalizedSubjects(selectedTeacher.subjects).join(", ") || "Não informado",
            },
            {
              label: "Pode lecionar em FATEC",
              value: selectedTeacher.can_teach_fatec === true ? "Sim" : "Não",
            },
            {
              label: "Pode lecionar em ETEC",
              value: selectedTeacher.can_teach_etec === true ? "Sim" : "Não",
            },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />

    </div>

  )
}
