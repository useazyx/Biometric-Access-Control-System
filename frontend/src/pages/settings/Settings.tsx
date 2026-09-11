import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon, LockKeyhole } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'

export default function Settings() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    if (newPassword !== newPasswordConfirm) {
      toast({ title: 'Nova senha e confirmação não coincidem', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      toast({ title: 'Senha alterada com sucesso' })
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao alterar senha'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6" />
            <div>
              <CardTitle>Esqueci minha senha</CardTitle>
              <CardDescription>
                Envie uma nova senha temporária para seu email
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!forgotEmail) {
                toast({ title: 'Informe o email', variant: 'destructive' })
                return
              }
              setForgotLoading(true)
              try {
                await api.post('/forgot-password', { email: forgotEmail })
                toast({ title: 'Senha temporária enviada para seu email' })
                setForgotEmail('')
              } catch (error: any) {
                const msg = error?.response?.data?.message || 'Falha ao enviar senha temporária'
                toast({ title: msg, variant: 'destructive' })
              } finally {
                setForgotLoading(false)
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="forgot_email">Email</Label>
              <Input
                id="forgot_email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={forgotLoading} className="w-full">
              {forgotLoading ? 'Enviando...' : 'Enviar senha temporária'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6" />
            <div>
              <CardTitle>Trocar Senha</CardTitle>
              <CardDescription>
                Altere sua senha atual por uma definitiva
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Senha atual</Label>
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password_confirm">Confirmar nova senha</Label>
              <Input
                id="new_password_confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6" />
            <div>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure os parâmetros gerais do sistema de controle de acesso
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades de configuração em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
