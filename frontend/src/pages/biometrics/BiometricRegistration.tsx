// frontend/src/pages/biometrics/BiometricRegistration.tsx
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/services/api"
import { Fingerprint, Loader2, CheckCircle, XCircle, CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type FingerType =
  | "thumb_right"
  | "index_right"
  | "middle_right"
  | "ring_right"
  | "pinky_right"
  | "thumb_left"
  | "index_left"
  | "middle_left"
  | "ring_left"
  | "pinky_left"

interface Unit {
  id: string
  code: string
  name: string
}

export default function BiometricRegistration() {
  const { user } = useAuth()
  const [cpf, setCpf] = useState<string>("")
  const [finger, setFinger] = useState<FingerType>("thumb_right")
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [device] = useState<string>("R307")
  const [quality, setQuality] = useState<number>(95)
  const [registrationDate, setRegistrationDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  // Carrega as unidades disponíveis
  useEffect(() => {
    const loadUnits = async () => {
      try {
        setIsLoadingUnits(true)
        const response = await api.get("/units")

        // Verifica se a resposta é um array ou se as unidades estão em uma propriedade 'units'
        const unitsData = Array.isArray(response.data) ? response.data : response.data.units || []

        setUnits(unitsData)

        // Se o usuário tiver uma unidade definida, seleciona automaticamente
        if (user?.unit_code) {
          const userUnit = unitsData.find((unit: Unit) => unit.code === user.unit_code)
          if (userUnit) {
            setSelectedUnit(userUnit.id)
          }
        }

        // Se houver apenas uma unidade, seleciona automaticamente
        if (unitsData.length === 1) {
          setSelectedUnit(unitsData[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar unidades:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as unidades. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        })
        setUnits([])
      } finally {
        setIsLoadingUnits(false)
      }
    }

    loadUnits()
  }, [user, toast])

  const handleGenerateBiometric = async () => {
    if (!selectedUnit) {
      toast({
        title: "Atenção",
        description: "Selecione uma unidade antes de continuar",
        variant: "destructive",
      })
      return
    }

    if (!cpf || cpf.length !== 11) {
      toast({
        title: "Atenção",
        description: "CPF inválido. Digite os 11 números do CPF",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCapturing(true)
      setCaptureStatus("idle")

      const response = await api.get(`/biometrics/generate/${finger}`)

      if (response.data.success) {
        setCaptureStatus("success")
        toast({
          title: "Sucesso",
          description: "Biometria gerada com sucesso!",
          variant: "default",
        })

        // Envia os dados para o backend
        await handleSubmit(response.data.data.template)
      }
    } catch (error) {
      console.error("Erro ao gerar biometria:", error)
      setCaptureStatus("error")
      toast({
        title: "Erro",
        description: "Falha ao gerar biometria",
        variant: "destructive",
      })
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSubmit = async (template?: string) => {
    if (!template) {
      toast({
        title: "Erro",
        description: "Nenhum template biométrico disponível. Por favor, tente novamente.",
        variant: "destructive",
      })
      return
    }

    if (!selectedUnit) {
      toast({
        title: "Erro",
        description: "Nenhuma unidade selecionada. Por favor, selecione uma unidade.",
        variant: "destructive",
      })
      return
    }

    if (!cpf) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o CPF",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Find the selected unit data
      const selectedUnitData = units.find((unit) => unit.id === selectedUnit)

      if (!selectedUnitData) {
        console.error("Unidade selecionada não encontrada:", {
          selectedUnit,
          unitsLength: units.length,
          unitsIds: units.map((u) => u.id),
        })
        throw new Error("Unidade selecionada não encontrada. Por favor, selecione outra unidade.")
      }

      const unitCode = selectedUnitData.code || selectedUnitData.id
      if (!unitCode) {
        console.error("Unidade sem código e sem ID:", selectedUnitData)
        throw new Error("Dados da unidade são inválidos. Por favor, selecione outra unidade.")
      }

      const payload = {
        cpf: cpf.replace(/\D/g, ""),
        unit_code: unitCode,
        template: template,
        finger: finger,
        device: device,
        quality: quality,
      }


      const response = await api.post("/biometrics", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.data || (!response.data.id && !response.data.message)) {
        const errorMessage = response.data?.error || response.data?.details || "Resposta inválida do servidor"
        throw new Error(errorMessage)
      }

      toast({
        title: "Sucesso",
        description: `Biometria cadastrada com sucesso para CPF: ${cpf}`,
        variant: "default",
      })

      // Reset form
      setCpf("")
      setCaptureStatus("idle")
    } catch (error: any) {
      console.error("Erro ao salvar biometria:", error)

      let errorMessage = "Erro ao cadastrar biometria"

      // Check for network errors
      if (error.message === "Network Error") {
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão."
      }
      // Check for validation errors from the server
      else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
        if (error.response.data.solution) {
          errorMessage += ` - ${error.response.data.solution}`
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      // Check for specific error status codes
      else if (error.response?.status === 400) {
        errorMessage = "Dados inválidos fornecidos. Verifique os campos preenchidos."
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Por favor, faça login novamente."
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para realizar esta ação."
      } else if (error.response?.status === 404) {
        errorMessage = error.response.data?.solution || "Recurso não encontrado. Verifique os dados e tente novamente."
      } else if (error.response?.status >= 500) {
        errorMessage = "Erro no servidor. Por favor, tente novamente mais tarde."
      } else if (error.message) {
        errorMessage = error.message
      }

      // Log detailed error information for debugging
      if (process.env.NODE_ENV === "development") {
        console.group("Detalhes do Erro:")
        console.groupEnd()
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cadastro de Biometria</h1>
        <p className="text-muted-foreground">Cadastre uma nova biometria no sistema</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF (apenas números) *</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              placeholder="Digite o CPF (apenas números)"
              maxLength={11}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={isLoadingUnits}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingUnits ? "Carregando..." : "Selecione uma unidade"} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(units) && units.length > 0 ? (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} {unit.code ? `(${unit.code})` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    {isLoadingUnits ? "Carregando unidades..." : "Nenhuma unidade disponível"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finger">Dedo *</Label>
            <Select value={finger} onValueChange={(value: FingerType) => setFinger(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dedo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thumb_right">Polegar Direito</SelectItem>
                <SelectItem value="index_right">Indicador Direito</SelectItem>
                <SelectItem value="middle_right">Médio Direito</SelectItem>
                <SelectItem value="ring_right">Anelar Direito</SelectItem>
                <SelectItem value="pinky_right">Mínimo Direito</SelectItem>
                <SelectItem value="thumb_left">Polegar Esquerdo</SelectItem>
                <SelectItem value="index_left">Indicador Esquerdo</SelectItem>
                <SelectItem value="middle_left">Médio Esquerdo</SelectItem>
                <SelectItem value="ring_left">Anelar Esquerdo</SelectItem>
                <SelectItem value="pinky_left">Mínimo Esquerdo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Qualidade *</Label>
            <Select value={quality.toString()} onValueChange={(value) => setQuality(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a qualidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Baixa (30%)</SelectItem>
                <SelectItem value="50">Média (50%)</SelectItem>
                <SelectItem value="70">Alta (70%)</SelectItem>
                <SelectItem value="90">Muito Alta (90%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Registro</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !registrationDate && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {registrationDate ? (
                    format(registrationDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={registrationDate}
                  onSelect={(date) => date && setRegistrationDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleGenerateBiometric}
            disabled={isLoading || isCapturing || isLoadingUnits}
            className="w-full"
          >
            {isLoading || isCapturing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isCapturing ? "Gerando..." : "Salvando..."}
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Cadastrar Digital
              </>
            )}
          </Button>
        </div>

        {captureStatus !== "idle" && (
          <div
            className={`flex items-center justify-center p-4 rounded-md ${
              captureStatus === "success" ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {captureStatus === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>
              {captureStatus === "success" ? "Biometria cadastrada com sucesso!" : "Erro ao cadastrar biometria"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
