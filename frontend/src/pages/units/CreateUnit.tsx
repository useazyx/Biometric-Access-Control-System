import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateUnit() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    unit_code: "",
    unit_type: "Fatec" as "Fatec" | "Etec",
    address: "",
    phone: "",
    is_extension: false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const unitData = {
        name: formData.name,
        unit_code: formData.unit_code,
        unit_type: formData.unit_type,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        is_extension: formData.is_extension,
      }

      const response = await api.post("/units", unitData)

      if (response.data) {
        toast({
          title: "Unidade cadastrada com sucesso!",
          description: "A unidade foi registrada no sistema.",
        })
        navigate("/units")
      }
    } catch (error: any) {
      console.error("Error creating unit:", error)
      toast({
        title: "Erro ao cadastrar unidade",
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/units")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Unidade</h1>
          <p className="text-muted-foreground">Cadastre uma nova unidade no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Dados da Unidade</CardTitle>
            <CardDescription>Preencha as informações da unidade</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                placeholder="Ex: FATEC São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_code">Código da Unidade *</Label>
              <Input
                id="unit_code"
                value={formData.unit_code}
                onChange={(e) => handleChange("unit_code", e.target.value.toUpperCase())}
                required
                placeholder="Ex: FAT001 ou ETE001"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">Formato: FAT001 ou ETE001 (6 caracteres)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_type">Tipo de Unidade *</Label>
              <Select value={formData.unit_type} onValueChange={(v) => handleChange("unit_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fatec">FATEC</SelectItem>
                  <SelectItem value="Etec">ETEC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Endereço completo da unidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <Checkbox
                id="is_extension"
                checked={formData.is_extension}
                onCheckedChange={(checked) => handleChange("is_extension", checked === true)}
              />
              <Label htmlFor="is_extension" className="cursor-pointer">
                É uma extensão?
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/units")}>
            Cancelar
          </Button>
          <Button type="submit" className="gradient-primary" disabled={loading}>
            {loading ? "Salvando..." : "Cadastrar Unidade"}
          </Button>
        </div>
      </form>
    </div>
  )
}

