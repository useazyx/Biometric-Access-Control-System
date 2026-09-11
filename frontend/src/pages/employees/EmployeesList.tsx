import type React from "react"

import { useState, useEffect } from "react"
import { Settings, Trash2, Edit, Briefcase, Eye, Search } from "lucide-react"
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
import type { Employee, Person, Role } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"
import { useUnitCode } from "@/contexts/AuthContext"

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [managementSearchTerm, setManagementSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    registration_number: "",
    admission_date: "",
    active: true,
    person_id: "",
    role_id: "",
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
      const employeesData = employeesRes.data.employees || []

      const transformedEmployees = employeesData.map((e: any) => ({
        id: e.id,
        registration_number: e.registration_number,
        admission_date: e.admission_date,
        active: e.active !== undefined ? e.active : true,
        person_id: e.person_id || e.id,
        role_id: e.role_id || null,
        full_name: e.full_name,
        email: e.email,
        cpf: e.cpf || '',
        role_name: e.role_name || 'Sem cargo definido',
        person_type: e.person_type || 'employee',
      }))

      setEmployees(transformedEmployees)

      const peopleRes = await api.get("/people", {
        params: { unit_code: unitCode, type: "employee", page: "1", page_size: "1000" },
      })
      setPeople(peopleRes.data.people || [])

      // Carregar roles da API
      try {
        const rolesRes = await api.get("/roles")
        const rolesData = rolesRes.data?.roles || rolesRes.data || []
        setRoles(rolesData)
      } catch (error) {
        console.error("Error loading roles:", error)
        setRoles([])
      }
    } catch (error: any) {
      console.error("Error loading employees:", error)

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
      if (!formData.person_id || !formData.role_id) {
        toast({
          title: "Erro",
          description: "Selecione uma pessoa e um cargo",
          variant: "destructive",
        })
        return
      }

      if (editingEmployee) {
        // Buscar CPF usando a matrícula
        let cpf: string | null = null
        try {
          const cpfRes = await api.post("/employees/get-by-registration", {
            registration_number: formData.registration_number,
          })
          cpf = cpfRes.data.cpf
        } catch (error: any) {
          toast({
            title: "Erro",
            description: error.response?.data?.error || "Erro ao buscar CPF pela matrícula",
            variant: "destructive",
          })
          return
        }
        
        if (!cpf) {
          toast({
            title: "Erro",
            description: "CPF não encontrado para atualização",
            variant: "destructive",
          })
          return
        }
        
        const role = roles.find((r) => r.id.toString() === formData.role_id)
        if (!role) {
          toast({
            title: "Erro",
            description: "Cargo não encontrado",
            variant: "destructive",
          })
          return
        }
        
        const updateData: any = {
          role_name: role.name,
          active: formData.active,
        }
        
        // Adicionar data de admissão se foi alterada
        if (formData.admission_date && formData.admission_date.trim()) {
          updateData.admission_date = formData.admission_date
        }
        
        await api.patch(`/employees/${cpf}`, updateData)
        toast({ title: "Funcionário atualizado!" })
        setDialogOpen(false)
        resetForm()
        setEditingEmployee(null)
        loadData()
        return
      } else {
        await api.post("/employees", {
          ...formData,
          person_id: Number.parseInt(formData.person_id),
          role_id: Number.parseInt(formData.role_id),
        })
        toast({ title: "Funcionário criado!" })
      }

      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar funcionário",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    
    // Encontrar o role_id - usar o que vem do backend ou buscar pelo role_name
    let roleId = ""
    if (employee.role_id) {
      roleId = employee.role_id.toString()
    } else if (roles.length > 0 && (employee as any).role_name) {
      const foundRole = roles.find((r) => r.name === (employee as any).role_name)
      if (foundRole) {
        roleId = foundRole.id.toString()
      }
    }
    
    setFormData({
      registration_number: employee.registration_number,
      admission_date: employee.admission_date || "",
      active: employee.active,
      person_id: employee.person_id.toString(),
      role_id: roleId,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (employee: Employee) => {
    const confirmado = await confirmar({
      title: "Excluir este funcionário?",
      description:
        "Isso apaga a pessoa do sistema junto com as digitais e o histórico de acesso dela. Não tem como desfazer.",
      confirmLabel: "Excluir",
    })
    if (!confirmado) return

    try {
      // Buscar CPF usando a matrícula
      let cpf: string | null = null
      try {
        const cpfRes = await api.post("/employees/get-by-registration", {
          registration_number: employee.registration_number,
        })
        cpf = cpfRes.data.cpf
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.response?.data?.error || "Erro ao buscar CPF pela matrícula",
          variant: "destructive",
        })
        return
      }
      
      if (!cpf) {
        toast({ 
          title: "Erro", 
          description: "CPF não encontrado para exclusão", 
          variant: "destructive" 
        })
        return
      }
      
      await api.delete("/people", { data: { cpf } })
      toast({ title: "Funcionário excluído!" })
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir funcionário",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      registration_number: "",
      admission_date: "",
      active: true,
      person_id: "",
      role_id: "",
    })
    setEditingEmployee(null)
  }

  const getPersonName = (personId: number) => {
    const person = people.find((p) => p.id === personId)
    return person?.full_name || "Desconhecido"
  }

  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId)
    return role?.name || "Desconhecido"
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      (employee as any).full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.registration_number.includes(searchTerm),
  )

  const getPersonTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      employee: "Funcionário",
      coordinator: "Coordenador",
      inspector: "Inspetor",
      teacher: "Professor",
    }
    return labels[type] || "Funcionário"
  }

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDetailsOpen(true)
  }

  const getPersonType = (employee: Employee) => {
    const person = people.find((p) => p.id === (employee as any).person_id)
    return person?.type || "employee"
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Funcionários</h1>
          <p className="section-description">Gerencie funcionários cadastrados no sistema</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              resetForm()
              setEditingEmployee(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Settings className="mr-2 w-4 h-4" />
              Gerenciar Funcionários
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Editar Funcionário" : "Gerenciar Funcionários"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Atualize as informações do funcionário" : "Selecione um funcionário para editar ou excluir"}
              </DialogDescription>
            </DialogHeader>
            
            {editingEmployee ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Matrícula *</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    disabled
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Funcionário</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      {getPersonTypeLabel((editingEmployee as any).person_type || getPersonType(editingEmployee))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tipo: {(editingEmployee as any).person_type || getPersonType(editingEmployee)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_id">Cargo *</Label>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-md mb-2">
                      <p className="text-sm font-medium">
                        Cargo atual: {(editingEmployee as any).role_name || "Sem cargo definido"}
                      </p>
                    </div>
                    <Select
                      value={formData.role_id}
                      onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um novo cargo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecione um novo cargo ou mantenha o atual
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admission_date">Data de Admissão</Label>
                  <div className="space-y-2">
                    {formData.admission_date && (
                      <div className="p-2 bg-muted rounded-md mb-2">
                        <p className="text-sm font-medium">
                          Data atual: {new Date(formData.admission_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                    <Input
                      id="admission_date"
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional: altere a data de admissão ou mantenha a atual
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.active ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, active: true })}
                      className="flex-1"
                    >
                      Ativo
                    </Button>
                    <Button
                      type="button"
                      variant={!formData.active ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, active: false })}
                      className="flex-1"
                    >
                      Inativo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status atual: {formData.active ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingEmployee(null)
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
                    placeholder="Buscar funcionários..."
                    value={managementSearchTerm}
                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredEmployees
                    .filter((e) =>
                      (e as any).full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                      e.registration_number.toLowerCase().includes(managementSearchTerm.toLowerCase())
                    )
                    .length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhum funcionário encontrado</p>
                  ) : (
                    filteredEmployees
                      .filter((e) =>
                        (e as any).full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                        e.registration_number.toLowerCase().includes(managementSearchTerm.toLowerCase())
                      )
                      .map((employee) => (
                      <Card key={employee.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{(employee as any).full_name || "Nome não informado"}</h4>
                            <p className="text-sm text-muted-foreground">Matrícula: {employee.registration_number}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="font-medium">
                                {getPersonTypeLabel((employee as any).person_type || getPersonType(employee))}
                              </Badge>
                              {(employee as any).role_name && (
                                <Badge variant="outline" className="font-medium">
                                  Cargo: {(employee as any).role_name}
                                </Badge>
                              )}
                              {employee.active ? (
                                <Badge className="bg-green-500">Ativo</Badge>
                              ) : (
                                <Badge className="bg-gray-500">Inativo</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit className="mr-2 w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(employee)}
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
          <CardDescription>Busque funcionários por nome ou matrícula</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome ou matrícula..."
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
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="glass-card shadow-card transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{(employee as any).full_name || "Desconhecido"}</h3>
                        <p className="text-sm text-muted-foreground">Matrícula: {employee.registration_number}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="font-medium">
                        {getPersonTypeLabel((employee as any).person_type || getPersonType(employee))}
                      </Badge>
                      {(employee as any).role_name && (
                        <Badge variant="outline" className="font-medium">
                          Cargo: {((employee as any).role_name === "Funcionário") ? "Outra função" : (employee as any).role_name}
                        </Badge>
                      )}
                      {employee.active ? (
                        <Badge className="badge-soft-green">Ativo</Badge>
                      ) : (
                        <Badge className="badge-soft-gray">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(employee)}>
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedEmployee && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes do Funcionário - ${(selectedEmployee as any).full_name || "N/A"}`}
          description="Informações completas do funcionário"
          details={[
            { label: "Nome", value: (selectedEmployee as any).full_name || "N/A" },
            { label: "CPF", value: (selectedEmployee as any).cpf || "N/A" },
            { label: "E-mail", value: (selectedEmployee as any).email || ((selectedEmployee as any).email === null ? "N/A" : "N/A") },
            { label: "Tipo", value: getPersonTypeLabel((selectedEmployee as any).person_type || getPersonType(selectedEmployee)) },
            { label: "Matrícula", value: selectedEmployee.registration_number || "N/A" },
            { label: "Cargo", value: ((selectedEmployee as any).role_name === "Funcionário") ? "Outra função" : ((selectedEmployee as any).role_name || "N/A") },
            {
              label: "Data de Admissão",
              value: selectedEmployee.admission_date
                ? new Date(selectedEmployee.admission_date).toLocaleDateString("pt-BR")
                : (selectedEmployee as any).admission_date 
                  ? new Date((selectedEmployee as any).admission_date).toLocaleDateString("pt-BR")
                  : "N/A",
            },
            {
              label: "Status",
              value: selectedEmployee.active === true ? "Ativo" : selectedEmployee.active === false ? "Inativo" : "N/A",
            },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />

    </div>

  )
}
