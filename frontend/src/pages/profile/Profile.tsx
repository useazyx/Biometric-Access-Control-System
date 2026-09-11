import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/services/api"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface PersonDetails {
  id: number
  full_name: string
  birth_date: string | null
  cpf: string
  email: string | null
  phone: string | null
  type: string
  main_unit_type: string | null
  registration_unit: { id: number; name: string; unit_code: string } | null
  student?: { id: number; rm: string; status: string } | null
  employee?: { id: number; registration_number: string } | null
  visitor?: {
    id: number
    company: string | null
    visit_reason: string | null
    registration_date: string | null
    visit_expiry_date: string | null
    responsible_employee_id: number | null
  } | null
}

export default function Profile() {
  const { user } = useAuth()
  const [details, setDetails] = useState<PersonDetails | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [webCount, setWebCount] = useState<number>(0)
  const [bioCount, setBioCount] = useState<number>(0)

  const initials = useMemo(() => {
    if (!user?.full_name) return "US"
    const parts = user.full_name.split(" ")
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
  }, [user?.full_name])

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadProfile = async () => {
    if (!user) return
    try {
      setLoading(true)
      const meRes = await api.get(`/me`)
      const me = meRes.data as PersonDetails
      setDetails(me)

      const cpf = me.cpf
      if (cpf) {
        const webRes = await api.get(`/web-access-logs`, { params: { cpf, page_size: 1 } })
        setWebCount(webRes.data.total_items || webRes.data.total || 0)
        const bioRes = await api.get(`/biometric-access-logs`, { params: { cpf, page_size: 1 } })
        setBioCount(bioRes.data.total_items || bioRes.data.total || 0)
      }
    } catch (error) {
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-semibold">{user?.full_name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{user?.type}</Badge>
              {details?.registration_unit?.unit_code && <Badge variant="secondary">{details.registration_unit.unit_code}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ) : details ? (
              <div className="text-sm">
                <div>CPF: {details.cpf || "—"}</div>
                <div>Telefone: {details.phone || "—"}</div>
                <div>Data de Nascimento: {details.birth_date ? new Date(details.birth_date).toLocaleDateString() : "—"}</div>
                <Separator className="my-3" />
                {details.student && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>RM: {details.student.rm}</div>
                    <div>Status: {details.student.status}</div>
                  </div>
                )}
                {details.employee && (
                  <div>Registro: {details.employee.registration_number}</div>
                )}
                {details.visitor && (
                  <div>Empresa: {details.visitor.company || "—"}</div>
                )}
                {details?.registration_unit?.name && (
                  <div className="mt-2">Unidade: {details.registration_unit.name}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Não foi possível carregar seus dados.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border p-4">
                  <div className="text-2xl font-bold">{webCount}</div>
                  <div className="text-sm text-muted-foreground">Acessos Web</div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-2xl font-bold">{bioCount}</div>
                  <div className="text-sm text-muted-foreground">Acessos Biométricos</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}