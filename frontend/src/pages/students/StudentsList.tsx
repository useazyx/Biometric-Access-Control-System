import type React from "react"

import { useState, useEffect } from "react"
import { Settings, Trash2, Edit, BookOpen, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { api } from "@/services/api"
import type { Student, Person, PeriodEnum, StudentStatusEnum } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"
import { useUnitCode } from "@/contexts/AuthContext"

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    rm: "",
    period: "morning" as PeriodEnum,
    course: "",
    class_name: "",
    responsible: "",
    status: "active" as StudentStatusEnum,
    person_id: "",
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

      // Busca alunos e pessoas em paralelo, que é mais rápido que uma depois da outra
      const [studentsRes, peopleRes] = await Promise.all([
        api.get("/students", {
          params: { unit_code: unitCode, page: "1", page_size: "1000" },
        }),
        api.get("/people", {
          params: { unit_code: unitCode, type: "student", page: "1", page_size: "1000" },
        }),
      ])

      const studentsData = studentsRes.data?.students || []
      const peopleData = Array.isArray(peopleRes.data?.people) ? peopleRes.data.people : []


      setStudents(
        studentsData.map((s: any) => ({
          id: s.id,
          rm: s.rm,
          period: s.period || "morning",
          course: s.course,
          class_name: s.class_name,
          responsible: s.responsible,
          status: s.status || "active",
          person_id: s.person_id,
          full_name: s.full_name || "Desconhecido",
          email: s.email,
        })),
      )

      setPeople(peopleData)
    } catch (error: any) {
      console.error("Error loading students:", error)

      let errorMessage = "Erro ao carregar dados"
      if (error.response?.status === 400) {
        errorMessage = `Erro de validação: ${error.response?.data?.error || "unit_code inválido"}`
      } else if (error.response?.status === 500) {
        errorMessage = `Erro no servidor: ${error.response?.data?.error || "Tente novamente"}`
      } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Timeout - Verifique se o backend está rodando em http://localhost:2077"
      } else if (error.message) {
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
      if (!formData.person_id) {
        toast({
          title: "Erro",
          description: "Selecione uma pessoa",
          variant: "destructive",
        })
        return
      }

      // Get person CPF from people list
      const selectedPerson = people.find((p) => p.id.toString() === formData.person_id)
      if (!selectedPerson) {
        toast({
          title: "Erro",
          description: "Pessoa não encontrada",
          variant: "destructive",
        })
        return
      }

      if (editingStudent) {
        // Backend espera rm no body também
        // Usa o RM original do estudante sendo editado
        const updateData: any = {
          rm: editingStudent.rm,
          period: formData.period,
          status: formData.status,
        }
        
        // Adiciona campos opcionais apenas se tiverem valor
        if (formData.course && formData.course.trim()) {
          updateData.course = formData.course
        }
        if (formData.class_name && formData.class_name.trim()) {
          updateData.class = formData.class_name
        }
        if (formData.responsible && formData.responsible.trim()) {
          updateData.responsible = formData.responsible
        }
        
        await api.patch(`/students/${editingStudent.rm}`, updateData)
        toast({ title: "Aluno atualizado!" })
        setDialogOpen(false)
        resetForm()
        setEditingStudent(null)
        loadData()
        return
      } else {
        await api.post("/students", {
          cpf: selectedPerson.cpf,
          rm: formData.rm,
          period: formData.period,
          course: formData.course || undefined,
          class: formData.class_name || undefined,
          responsible: formData.responsible || undefined,
          status: formData.status,
        })
        toast({ title: "Aluno criado!" })
      }

      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar aluno",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      rm: student.rm,
      period: student.period,
      course: student.course || "",
      class_name: student.class_name || "",
      responsible: student.responsible || "",
      status: student.status,
      person_id: student.person_id.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (student: Student) => {
    const confirmado = await confirmar({
      title: "Excluir este aluno?",
      description:
        "Isso apaga a pessoa do sistema junto com as digitais e o histórico de acesso dela. Não tem como desfazer.",
      confirmLabel: "Excluir",
    })
    if (!confirmado) return

    try {
      const person = people.find((p) => p.id === student.person_id)
      if (!person) {
        toast({ title: "Erro", description: "Pessoa não encontrada", variant: "destructive" })
        return
      }
      await api.delete("/people", { data: { cpf: person.cpf } })
      toast({ title: "Aluno excluído!" })
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir aluno",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      rm: "",
      period: "morning",
      course: "",
      class_name: "",
      responsible: "",
      status: "active",
      person_id: "",
    })
    setEditingStudent(null)
  }

  const getPersonName = (personId: number) => {
    const person = people.find((p) => p.id === personId)
    return person?.full_name || "Desconhecido"
  }

  const getStatusBadge = (status: StudentStatusEnum) => {
    const badges = {
      active: <Badge className="bg-green-500">Ativo</Badge>,
      inactive: <Badge className="bg-gray-500">Inativo</Badge>,
      transferred: <Badge className="bg-blue-500">Transferido</Badge>,
    }
    return badges[status] || <Badge>{status}</Badge>
  }

  const getPeriodLabel = (period: PeriodEnum) => {
    const labels: Record<PeriodEnum, string> = {
      morning: "Manhã",
      afternoon: "Tarde",
      night: "Noite",
      integral: "Integral",
    }
    return labels[period] || period
  }

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [managementSearchTerm, setManagementSearchTerm] = useState("")

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setDetailsOpen(true)
  }

  const filteredStudents = students.filter(
    (student) =>
      (student as any).full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || student.rm.includes(searchTerm),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerencie alunos cadastrados no sistema</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              resetForm()
              setEditingStudent(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Settings className="mr-2 w-4 h-4" />
              Gerenciar Alunos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Editar Aluno" : "Gerenciar Alunos"}</DialogTitle>
              <DialogDescription>
                {editingStudent ? "Atualize as informações do aluno" : "Selecione um aluno para editar ou excluir"}
              </DialogDescription>
            </DialogHeader>
            
            {editingStudent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rm">RM *</Label>
                  <Input
                    id="rm"
                    value={formData.rm}
                    disabled
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Período *</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) => setFormData({ ...formData, period: value as PeriodEnum })}
                  >
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
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">Turma</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as StudentStatusEnum })}
                  >
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingStudent(null)
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
                    placeholder="Buscar alunos..."
                    value={managementSearchTerm}
                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredStudents
                    .filter((s) =>
                      (s as any).full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                      s.rm.toLowerCase().includes(managementSearchTerm.toLowerCase())
                    )
                    .length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhum aluno encontrado</p>
                  ) : (
                    filteredStudents
                      .filter((s) =>
                        (s as any).full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                        s.rm.toLowerCase().includes(managementSearchTerm.toLowerCase())
                      )
                      .map((student) => (
                      <Card key={student.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{(student as any).full_name || "Nome não informado"}</h4>
                            <p className="text-sm text-muted-foreground">RM: {student.rm}</p>
                            <div className="flex gap-2 mt-2">
                              {getStatusBadge(student.status)}
                              <Badge variant="outline">{getPeriodLabel(student.period)}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(student)}
                            >
                              <Edit className="mr-2 w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(student)}
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
          <CardDescription>Busque alunos por nome ou RM</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome ou RM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </Card>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum aluno encontrado</p>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="shadow-card hover:shadow-lg transition-all duration-300 border border-border/50 tilt-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1 truncate">{(student as any).full_name || "Nome não informado"}</h3>
                        <p className="text-sm text-muted-foreground font-mono">RM: {student.rm}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getStatusBadge(student.status)}
                      <Badge variant="outline" className="font-medium">{getPeriodLabel(student.period)}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {student.course && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Curso:</span>
                          <span>{student.course}</span>
                        </p>
                      )}
                      {student.class_name && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Turma:</span>
                          <span>{student.class_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(student)} className="flex-shrink-0">
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedStudent && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes do Aluno - ${(selectedStudent as any).full_name || "N/A"}`}
          description="Informações completas do estudante"
          details={[
            { label: "Nome", value: (selectedStudent as any).full_name || "N/A" },
            { label: "E-mail", value: (selectedStudent as any).email || "N/A" },
            { label: "RM", value: selectedStudent.rm || "N/A" },
            { label: "Período", value: getPeriodLabel(selectedStudent.period) },
            { label: "Curso", value: selectedStudent.course || (selectedStudent.course === null ? "N/A" : "N/A") },
            { label: "Turma", value: selectedStudent.class_name || (selectedStudent.class_name === null ? "N/A" : "N/A") },
            { label: "Responsável", value: selectedStudent.responsible || (selectedStudent.responsible === null ? "N/A" : "N/A") },
            {
              label: "Status",
              value: (
                <span>
                  {getStatusBadge(selectedStudent.status)}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />

    </div>

  )
}
