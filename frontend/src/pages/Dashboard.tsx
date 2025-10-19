import { useState, useEffect } from 'react';
import { Users, Fingerprint, Activity, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { personAPI, biometricLogAPI } from '@/services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    totalBiometrics: 0,
    todayAccess: 0,
    weeklyGrowth: '+0%',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [peopleRes, logsRes] = await Promise.all([
        personAPI.getAll(),
        biometricLogAPI.getAll({ 
          startDate: new Date().toISOString().split('T')[0] 
        }),
      ]);

      setStats({
        totalPeople: peopleRes.data.length || 0,
        totalBiometrics: peopleRes.data.filter((p: any) => p.biometrics?.length > 0).length,
        todayAccess: logsRes.data.length || 0,
        weeklyGrowth: '+12%',
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de acesso biométrico
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Pessoas"
          value={stats.totalPeople}
          change={stats.weeklyGrowth}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Biometrias Cadastradas"
          value={stats.totalBiometrics}
          icon={Fingerprint}
        />
        <StatCard
          title="Acessos Hoje"
          value={stats.todayAccess}
          icon={Activity}
        />
        <StatCard
          title="Taxa de Sucesso"
          value="98.5%"
          change="+2.1%"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimos acessos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Acesso registrado</p>
                    <p className="text-sm text-muted-foreground">Há {i * 5} minutos</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                    Aprovado
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Visão Geral por Unidade</CardTitle>
            <CardDescription>Distribuição de acessos por unidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Campus Norte', 'Campus Sul', 'Campus Central'].map((unit, i) => (
                <div key={unit} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{unit}</span>
                    <span className="text-muted-foreground">{85 - i * 10}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary transition-smooth"
                      style={{ width: `${85 - i * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
