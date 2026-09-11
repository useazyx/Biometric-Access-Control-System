import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DialogDetails } from "@/components/ui/dialog-details"
import { api } from "@/services/api"
import type { Person } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { useUnitCode } from "@/contexts/AuthContext"

export default function PeopleList() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Unidade do usuário logado: é o filtro de toda listagem
  const unitCode = useUnitCode()

  useEffect(() => {
    // Enquanto o perfil não chegou a gente não sabe qual unidade consultar
    if (!unitCode) return
    loadPeople()
  }, [typeFilter, unitCode])


  const loadPeople = async () => {
    try {
      setLoading(true)


      const params: any = {
        unit_code: unitCode,
        page: "1",
        page_size: "1000",
      }

      if (typeFilter !== "all") {
        params.type = typeFilter
      }

      const response = await api.get("/people", { params })

      const data = response.data?.people || response.data || []

      if (!Array.isArray(data)) {
        console.warn("Data is not an array, received:", typeof data)
        setPeople([])
      } else {
        setPeople(
          data.map((person: any) => ({
            ...person,
            unit_name: person.registration_unit?.name || "Sem unidade",
            unit_code: person.registration_unit?.unit_code || "",
          })),
        )
      }
    } catch (error: any) {
      console.error("Error loading people:", error)

      let errorMessage = "Erro desconhecido"
      if (error.response?.status === 400) {
        errorMessage = `Erro de validação: ${error.response?.data?.error || "Parâmetros inválidos"}`
      } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Timeout - Backend não respondeu em tempo. Verifique se está rodando em http://localhost:2077"
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Erro ao carregar pessoas",
        description: errorMessage,
        variant: "destructive",
      })

      setPeople([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPeople = people.filter(
    (person) =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.cpf.includes(searchTerm) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPersonTypeBadge = (type: string) => {
    const badges = {
      student: <Badge className="bg-primary">Aluno</Badge>,
      employee: <Badge className="bg-amber-600">Funcionário</Badge>, // darker amber instead of secondary
      visitor: <Badge className="bg-yellow-500">Visitante</Badge>,
      teacher: <Badge className="bg-blue-500">Professor</Badge>,
      coordinator: <Badge className="bg-purple-500">Coordenador</Badge>,
      inspector: <Badge className="bg-green-500">Inspetor</Badge>,
    }
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>
  }

  const getUnitName = (person: any): string => {
    if (person.registration_unit?.name) {
      return person.registration_unit.name
    }
    return "Sem unidade"
  }

  const handleViewDetails = (person: Person, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPerson(person)
    fetchPersonDetails(person)
  }

  const [selectedDetails, setSelectedDetails] = useState<any | null>(null)

  const fetchPersonDetails = async (person: Person) => {
    try {
      const res = await api.post("/people/get-people", { cpf: person.cpf })
      setSelectedDetails(res.data)
    } catch (error) {
      setSelectedDetails(null)
    } finally {
      setDetailsOpen(true)
    }
  }

  const getPersonTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student: "Aluno",
      employee: "Funcionário",
      visitor: "Visitante",
      teacher: "Professor",
      coordinator: "Coordenador",
      inspector: "Inspetor",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Gestão de Pessoas</h1>
          <p className="section-description">Gerencie alunos, funcionários e visitantes</p>
        </div>
        <Button onClick={() => navigate("/people/create")} className="btn-gradient">
          <Plus className="mr-2 w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre pessoas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 w-4 h-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="student">Alunos</SelectItem>
                <SelectItem value="employee">Funcionários</SelectItem>
                <SelectItem value="teacher">Professores</SelectItem>
                <SelectItem value="visitor">Visitantes</SelectItem>
                <SelectItem value="coordinator">Coordenadores</SelectItem>
                <SelectItem value="inspector">Inspetores</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        ) : filteredPeople.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma pessoa encontrada</p>
          </Card>
        ) : (
          filteredPeople.map((person) => (
            <Card key={person.id} className="glass-card shadow-card transition-smooth tilt-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{person.full_name}</h3>
                      {getPersonTypeBadge(person.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CPF: {person.cpf} • E-mail: {person.email}
                    </p>
                    <p className="text-sm text-muted-foreground">Unidade: {getUnitName(person)}</p>
                    {person.phone && <p className="text-sm text-muted-foreground">Telefone: {person.phone}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleViewDetails(person, e)}
                  >
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedPerson && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes de ${selectedDetails?.full_name || selectedPerson.full_name}`}
          description="Informações completas da pessoa"
          details={[
            { label: "Nome Completo", value: selectedDetails?.full_name || selectedPerson.full_name },
            { label: "CPF", value: selectedDetails?.cpf || selectedPerson.cpf },
            { label: "E-mail", value: selectedDetails?.email || selectedPerson.email || "Não informado" },
            { label: "Tipo", value: getPersonTypeLabel(selectedDetails?.type || selectedPerson.type) },
            { label: "Telefone", value: selectedDetails?.phone || selectedPerson.phone || "Não informado" },
            {
              label: "Data de Nascimento",
              value: (selectedDetails?.birth_date || selectedPerson.birth_date)
                ? new Date(selectedDetails?.birth_date || selectedPerson.birth_date as any).toLocaleDateString("pt-BR")
                : "Não informado",
            },
            { label: "Unidade", value: selectedDetails?.registration_unit?.name || getUnitName(selectedPerson) },
            {
              label: "Tipo de Unidade Principal",
              value: (selectedDetails?.main_unit_type || selectedPerson.main_unit_type) === "Fatec" ? "FATEC" : "ETEC",
            },
          ]}
        />
      )}
    </div>
  )
}
