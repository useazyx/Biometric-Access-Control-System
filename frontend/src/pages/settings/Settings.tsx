import { Bell, Shield, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Perfil do Usuário</CardTitle>
              <CardDescription>Informações pessoais e de contato</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Nome de Exibição</p>
              <p className="text-sm text-muted-foreground">Administrador do Sistema</p>
            </div>
            <Button variant="outline">Editar</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">admin@bioaccess.com</p>
            </div>
            <Button variant="outline">Alterar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure suas preferências de notificação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="access-alerts">Alertas de Acesso</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações de acessos não autorizados
              </p>
            </div>
            <Switch id="access-alerts" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="new-registrations">Novos Cadastros</Label>
              <p className="text-sm text-muted-foreground">
                Notificações quando novas pessoas forem cadastradas
              </p>
            </div>
            <Switch id="new-registrations" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="system-updates">Atualizações do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Mantenha-se informado sobre atualizações e manutenções
              </p>
            </div>
            <Switch id="system-updates" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Configurações de segurança da conta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="two-factor">Autenticação de Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Switch id="two-factor" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Alterar Senha</p>
              <p className="text-sm text-muted-foreground">
                Atualize sua senha periodicamente
              </p>
            </div>
            <Button variant="outline">
              <Lock className="mr-2 w-4 h-4" />
              Alterar
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Sessões Ativas</p>
              <p className="text-sm text-muted-foreground">
                Gerencie dispositivos conectados
              </p>
            </div>
            <Button variant="outline">Ver Dispositivos</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gradient-primary">Salvar Alterações</Button>
      </div>
    </div>
  );
}
