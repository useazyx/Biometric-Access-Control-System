import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { personAPI } from '@/services/api';
import { Person } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function PeopleList() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPeople();
  }, [typeFilter]);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const params = typeFilter !== 'all' ? { type: typeFilter } : {};
      const response = await personAPI.getAll(params);
      setPeople(response.data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pessoas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.cpf.includes(searchTerm)
  );

  const getPersonTypeBadge = (type: string) => {
    const badges = {
      STUDENT: <Badge className="bg-primary">Aluno</Badge>,
      EMPLOYEE: <Badge className="bg-secondary">Funcionário</Badge>,
      VISITOR: <Badge className="bg-warning">Visitante</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pessoas</h1>
          <p className="text-muted-foreground">
            Gerencie alunos, funcionários e visitantes
          </p>
        </div>
        <Button onClick={() => navigate('/people/create')} className="gradient-primary">
          <Plus className="mr-2 w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre pessoas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
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
                <SelectItem value="STUDENT">Alunos</SelectItem>
                <SelectItem value="EMPLOYEE">Funcionários</SelectItem>
                <SelectItem value="VISITOR">Visitantes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </Card>
        ) : filteredPeople.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma pessoa encontrada</p>
          </Card>
        ) : (
          filteredPeople.map((person) => (
            <Card
              key={person.id}
              className="shadow-card hover:shadow-lg transition-smooth cursor-pointer"
              onClick={() => navigate(`/people/${person.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{person.name}</h3>
                      {getPersonTypeBadge(person.personType)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CPF: {person.cpf} {person.email && `• ${person.email}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
