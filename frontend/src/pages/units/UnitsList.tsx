import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Settings, Eye, Building2, Search, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDetails } from "@/components/ui/dialog-details"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"

interface Unit {
  id: number
  name: string
  unit_code: string
  unit_type: string
  address?: string
  phone?: string
  is_extension: boolean
}

export default function UnitsList() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [managementSearchTerm, setManagementSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    unit_code: "",
    unit_type: "ETEC",
    address: "",
    phone: "",
    is_extension: false,
  })
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirmar, ConfirmDialog } = useConfirm()

  const loadUnits = async () => {
    try {
      const response = await api.get("/units")

      const unitsData = Array.isArray(response.data) ? response.data : response.data.units || []
      
      // Garantir que unit_type está presente e correto
      const normalizedUnits = unitsData.map((unit: any) => ({
        ...unit,
        unit_type: unit.unit_type || unit.unitType || "ETEC", // Fallback para ETEC se não tiver
      }))

      setUnits(normalizedUnits)
      setLoading(false)
    } catch (err: any) {
      console.error("Error loading units:", err)
      const errorMsg = err.response?.data?.error || err.message || "Erro desconhecido"
      setError(errorMsg)
      toast({
        title: "Erro ao carregar unidades",
        description: errorMsg,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Unidades</h1>
          <p className="text-muted-foreground">Gerenciamento de unidades cadastradas</p>
        </div>
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Unidades</h1>
          <p className="text-muted-foreground">Gerenciamento de unidades cadastradas</p>
        </div>
        <Card className="shadow-card border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button onClick={loadUnits} className="gradient-primary">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unidades</h1>
          <p className="text-muted-foreground">Gerenciamento de unidades cadastradas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="gradient-primary"
            onClick={() => navigate('/units/create')}
          >
            + Nova Unidade
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditingUnit(null)
                setFormData({
                  name: "",
                  unit_code: "",
                  unit_type: "ETEC",
                  address: "",
                  phone: "",
                  is_extension: false,
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Settings className="mr-2 w-4 h-4" />
                Gerenciar Unidades
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Editar Unidade" : "Gerenciar Unidades"}</DialogTitle>
                <DialogDescription>
                  {editingUnit ? "Atualize as informações da unidade" : "Selecione uma unidade para editar ou excluir"}
                </DialogDescription>
              </DialogHeader>
              
              {editingUnit ? (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    await api.patch(`/units/${editingUnit.id}`, {
                      name: formData.name,
                      unit_type: formData.unit_type,
                      address: formData.address || undefined,
                      phone: formData.phone || undefined,
                      is_extension: formData.is_extension,
                    })
                    toast({
                      title: "Unidade atualizada!",
                      description: "A unidade foi atualizada com sucesso",
                    })
                    setEditingUnit(null)
                    setFormData({
                      name: "",
                      unit_code: "",
                      unit_type: "ETEC",
                      address: "",
                      phone: "",
                      is_extension: false,
                    })
                    loadUnits()
                  } catch (error: any) {
                    toast({
                      title: "Erro ao atualizar unidade",
                      description: error.message,
                      variant: "destructive",
                    })
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_code">Código *</Label>
                    <Input
                      id="unit_code"
                      value={formData.unit_code}
                      disabled
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_extension"
                      checked={formData.is_extension}
                      onChange={(e) => setFormData({ ...formData, is_extension: e.target.checked })}
                    />
                    <Label htmlFor="is_extension">É uma extensão?</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingUnit(null)
                      setFormData({
                        name: "",
                        unit_code: "",
                        unit_type: "ETEC",
                        address: "",
                        phone: "",
                        is_extension: false,
                      })
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
                      placeholder="Buscar unidades..."
                      value={managementSearchTerm}
                      onChange={(e) => setManagementSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {units
                      .filter((unit) => {
                        const matchesManagementSearch = 
                          managementSearchTerm === "" ||
                          unit.name.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                          unit.unit_code.toLowerCase().includes(managementSearchTerm.toLowerCase())
                        return matchesManagementSearch
                      })
                      .length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">Nenhuma unidade encontrada</p>
                      ) : (
                        units
                          .filter((unit) => {
                            const matchesManagementSearch = 
                              managementSearchTerm === "" ||
                              unit.name.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                              unit.unit_code.toLowerCase().includes(managementSearchTerm.toLowerCase())
                            return matchesManagementSearch
                          })
                          .map((unit) => (
                            <Card key={unit.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold">{unit.name}</h4>
                                  <p className="text-sm text-muted-foreground">Código: {unit.unit_code}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">{unit.unit_type}</Badge>
                                    {unit.is_extension ? (
                                      <Badge variant="secondary">Extensão</Badge>
                                    ) : (
                                      <Badge className="bg-primary/10 text-primary">Principal</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUnit(unit)
                                      setFormData({
                                        name: unit.name,
                                        unit_code: unit.unit_code,
                                        unit_type: unit.unit_type,
                                        address: unit.address || "",
                                        phone: unit.phone || "",
                                        is_extension: unit.is_extension,
                                      })
                                    }}
                                  >
                                    <Edit className="mr-2 w-4 h-4" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      const confirmado = await confirmar({
                                        title: `Excluir a unidade ${unit.name}?`,
                                        description:
                                          "Só dá pra excluir unidade que não tem ninguém cadastrado nela. Se tiver, o sistema recusa.",
                                        confirmLabel: "Excluir unidade",
                                      })
                                      if (!confirmado) return
                                      try {
                                        await api.delete(`/units/${unit.id}`)
                                        toast({
                                          title: "Unidade excluída!",
                                          description: "A unidade foi excluída com sucesso",
                                        })
                                        loadUnits()
                                      } catch (error: any) {
                                        toast({
                                          title: "Erro ao excluir unidade",
                                          description: error.response?.data?.error || error.message,
                                          variant: "destructive",
                                        })
                                      }
                                    }}
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
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Buscar e Filtrar</CardTitle>
          <CardDescription>Busque unidades por código ou nome, filtre por tipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              Todas
            </Button>
            <Button
              variant={filterType === "principal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("principal")}
            >
              Principal
            </Button>
            <Button
              variant={filterType === "extension" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("extension")}
            >
              Extensão
            </Button>
          </div>
        </CardContent>
      </Card>

      {units.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {units
            .filter((unit) => {
              const matchesSearch = 
                searchTerm === "" ||
                unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                unit.unit_code.toLowerCase().includes(searchTerm.toLowerCase())
              
              const matchesFilter = 
                filterType === "all" ||
                (filterType === "principal" && !unit.is_extension) ||
                (filterType === "extension" && unit.is_extension)
              
              return matchesSearch && matchesFilter
            })
            .map((unit) => (
            <Card key={unit.id} className="shadow-card hover:shadow-lg transition-all duration-300 border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1">{unit.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">Código: {unit.unit_code}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="font-medium">{unit.unit_type}</Badge>
                          {unit.is_extension ? (
                            <Badge variant="secondary" className="font-medium">Extensão</Badge>
                          ) : (
                            <Badge className="bg-primary/10 text-primary font-medium">Principal</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mt-3">
                          {unit.address && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Endereço:</span>
                              <span>{unit.address}</span>
                            </p>
                          )}
                          {unit.phone && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Telefone:</span>
                              <span>{unit.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedUnit(unit);
                    setDetailsOpen(true);
                  }} className="flex-shrink-0">
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedUnit && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes da Unidade - ${selectedUnit.name}`}
          description="Informações completas da unidade"
          details={[
            { label: "Nome", value: selectedUnit.name },
            { label: "Código", value: selectedUnit.unit_code },
            { label: "Tipo", value: selectedUnit.unit_type },
            { label: "Endereço", value: selectedUnit.address || (selectedUnit.address === null || selectedUnit.address === undefined ? "N/A" : "N/A") },
            { label: "Telefone", value: selectedUnit.phone || (selectedUnit.phone === null || selectedUnit.phone === undefined ? "N/A" : "N/A") },
            { label: "Tipo de Unidade", value: selectedUnit.is_extension ? "Extensão" : "Principal" },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />

    </div>

  )
}
