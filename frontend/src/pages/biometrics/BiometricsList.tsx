import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Fingerprint, Trash2, Search, Eye, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/services/api"
import { Skeleton } from "@/components/ui/skeleton"
import type { Biometric } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"
import { DialogDetails } from "@/components/ui/dialog-details"
import { useUnitCode } from "@/contexts/AuthContext"

export default function BiometricsList() {
  const [biometrics, setBiometrics] = useState<Biometric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBiometric, setSelectedBiometric] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [managementSearchTerm, setManagementSearchTerm] = useState("")
  const { toast } = useToast()
  const { confirmar, ConfirmDialog } = useConfirm()
  const navigate = useNavigate()
  // Unidade do usuário logado: é o filtro de toda listagem
  const unitCode = useUnitCode()

  useEffect(() => {
    // Enquanto o perfil não chegou a gente não sabe qual unidade consultar
    if (!unitCode) return
    loadBiometrics()
  }, [unitCode])

  const loadBiometrics = async () => {
    try {
      setLoading(true)
      const response = await api.get("/biometrics", {
        params: { unit_code: unitCode, page: "1", page_size: "1000" },
      })


      let data: any[] = []
      if (Array.isArray(response.data?.biometrics)) {
        data = response.data.biometrics
      } else if (Array.isArray(response.data)) {
        data = response.data
      }

      const processedData = data.map((item: any) => ({
        ...item,
        registration_date:
          typeof item.registration_date === "string"
            ? item.registration_date
            : new Date(item.registration_date).toISOString(),
      }))


      setBiometrics(processedData)
    } catch (error: any) {
      console.error("Error loading biometrics:", error)
      let errorMessage = "Erro ao carregar biometrias"
      if (error.response?.status === 500) {
        errorMessage = `Erro no servidor: ${error.response?.data?.message || error.message}`
      } else if (error.response?.status === 400) {
        errorMessage = `Erro de validação: ${error.response?.data?.error || "Parâmetros inválidos"}`
      } else {
        errorMessage = error.message
      }
      toast({
        title: "Erro ao carregar biometrias",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (biometric: any) => {
    const confirmado = await confirmar({
      title: "Excluir esta digital?",
      description: "A pessoa continua cadastrada, mas essa digital não vai mais abrir a catraca.",
      confirmLabel: "Excluir digital",
    })
    if (!confirmado) return

    try {
      // Backend requer cpf e finger no body do DELETE /biometrics
      if (!biometric.person?.cpf || !biometric.finger) {
        toast({
          title: "Erro",
          description: "Dados insuficientes para excluir a biometria",
          variant: "destructive",
        })
        return
      }
      await api.delete("/biometrics", { 
        data: { 
          cpf: biometric.person.cpf,
          finger: biometric.finger
        } 
      })
      toast({
        title: "Biometria excluída",
        description: "O registro foi removido com sucesso.",
      })
      loadBiometrics()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir biometria",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    }
  }

  const filteredBiometrics = biometrics.filter(
    (bio: any) =>
      searchTerm === "" ||
      bio.person?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bio.person?.cpf?.includes(searchTerm) ||
      bio.finger.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getFingerLabel = (finger: string) => {
    const fingers: Record<string, string> = {
      thumb_right: "Polegar Direito",
      index_right: "Indicador Direito",
      middle_right: "Médio Direito",
      ring_right: "Anelar Direito",
      pinky_right: "Mínimo Direito",
      thumb_left: "Polegar Esquerdo",
      index_left: "Indicador Esquerdo",
      middle_left: "Médio Esquerdo",
      ring_left: "Anelar Esquerdo",
      pinky_left: "Mínimo Esquerdo",
    }
    return fingers[finger] || finger
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Biometrias</h1>
          <p className="text-muted-foreground">Registre e gerencie dados biométricos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Settings className="mr-2 w-4 h-4" />
                Gerenciar Biometrias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Biometrias</DialogTitle>
                <DialogDescription>Selecione uma biometria para excluir</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar biometrias..."
                    value={managementSearchTerm}
                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredBiometrics
                    .filter((bio: any) =>
                      managementSearchTerm === "" ||
                      bio.person?.full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                      bio.person?.cpf?.includes(managementSearchTerm) ||
                      bio.finger.toLowerCase().includes(managementSearchTerm.toLowerCase())
                    )
                    .length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhuma biometria encontrada</p>
                  ) : (
                    filteredBiometrics
                      .filter((bio: any) =>
                        managementSearchTerm === "" ||
                        bio.person?.full_name?.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                        bio.person?.cpf?.includes(managementSearchTerm) ||
                        bio.finger.toLowerCase().includes(managementSearchTerm.toLowerCase())
                      )
                      .map((biometric: any) => (
                        <Card key={biometric.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{biometric.person?.full_name || "Desconhecido"}</h4>
                              <p className="text-sm text-muted-foreground">CPF: {biometric.person?.cpf || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">
                                Dedo: {getFingerLabel(biometric.finger)} • {new Date(biometric.registration_date).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                handleDelete(biometric)
                                setDialogOpen(false)
                              }}
                            >
                              <Trash2 className="mr-2 w-4 h-4" />
                              Excluir
                            </Button>
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Quem cadastra digital de verdade é a tela de registro, que pede a pessoa e o dedo */}
          <Button onClick={() => navigate("/biometrics/register")}>
            <Fingerprint className="mr-2 w-4 h-4" />
            Cadastrar Digital
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Buscar Biometrias</CardTitle>
          <CardDescription>Encontre registros por pessoa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou dedo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
        ) : filteredBiometrics.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma biometria encontrada</p>
          </Card>
        ) : (
          filteredBiometrics.map((biometric: any) => (
            <Card key={biometric.id} className="shadow-card hover:shadow-lg transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{biometric.person?.full_name || "Desconhecido"}</h3>
                      <p className="text-sm text-muted-foreground font-mono">CPF: {biometric.person?.cpf || "N/A"}</p>
                      <div className="space-y-1 text-sm text-muted-foreground mt-2">
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Dedo:</span>
                          <span>{getFingerLabel(biometric.finger)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Dispositivo:</span>
                          <span>{biometric.device}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Data:</span>
                          <span>{new Date(biometric.registration_date).toLocaleDateString("pt-BR")}</span>
                        </p>
                        {biometric.unit && (
                          <p className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Unidade:</span>
                            <span>{biometric.unit.name} ({biometric.unit.unit_code})</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBiometric(biometric);
                      setDetailsOpen(true);
                    }}
                    className="flex-shrink-0"
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


      {selectedBiometric && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes da Biometria - ${selectedBiometric.person?.full_name || "Desconhecido"}`}
          description="Informações completas do registro biométrico"
          details={[
            { label: "Nome", value: selectedBiometric.person?.full_name || "N/A" },
            { label: "CPF", value: selectedBiometric.person?.cpf || "N/A" },
            { label: "Dedo", value: getFingerLabel(selectedBiometric.finger) },
            { label: "Dispositivo", value: selectedBiometric.device || "N/A" },
            {
              label: "Data de Registro",
              value: new Date(selectedBiometric.registration_date).toLocaleDateString("pt-BR"),
            },
            {
              label: "Unidade",
              value: selectedBiometric.unit
                ? `${selectedBiometric.unit.name} (${selectedBiometric.unit.unit_code})`
                : "N/A",
            },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />

    </div>

  )
}
