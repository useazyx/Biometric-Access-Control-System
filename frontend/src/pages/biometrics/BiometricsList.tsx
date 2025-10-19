import { useState, useEffect } from 'react';
import { Plus, Fingerprint, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { biometricAPI, personAPI } from '@/services/api';
import { Biometric } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function BiometricsList() {
  const [biometrics, setBiometrics] = useState<Biometric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBiometrics();
  }, []);

  const loadBiometrics = async () => {
    try {
      setLoading(true);
      const response = await biometricAPI.getAll();
      setBiometrics(response.data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar biometrias',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    setCapturing(true);
    try {
      await biometricAPI.capture();
      toast({
        title: 'Biometria capturada!',
        description: 'A digital foi registrada com sucesso.',
      });
      loadBiometrics();
    } catch (error: any) {
      toast({
        title: 'Erro ao capturar biometria',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await biometricAPI.delete(deleteId);
      toast({
        title: 'Biometria excluída',
        description: 'O registro foi removido com sucesso.',
      });
      loadBiometrics();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir biometria',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredBiometrics = biometrics.filter((bio) =>
    bio.person?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bio.person?.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Biometrias</h1>
          <p className="text-muted-foreground">
            Registre e gerencie dados biométricos
          </p>
        </div>
        <Button onClick={handleCapture} disabled={capturing} className="gradient-primary">
          <Fingerprint className="mr-2 w-4 h-4" />
          {capturing ? 'Capturando...' : 'Capturar Digital'}
        </Button>
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
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </Card>
        ) : filteredBiometrics.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma biometria encontrada</p>
          </Card>
        ) : (
          filteredBiometrics.map((biometric) => (
            <Card key={biometric.id} className="shadow-card hover:shadow-lg transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                      <Fingerprint className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{biometric.person?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {biometric.person?.cpf} • Dedo: {biometric.fingerNumber}
                      </p>
                      {biometric.quality && (
                        <p className="text-sm text-muted-foreground">
                          Qualidade: {biometric.quality}%
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteId(biometric.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Biometria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
