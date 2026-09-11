import { useState, useEffect } from 'react';
import { Settings, Trash2, Edit, Users, Eye, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogDetails } from '@/components/ui/dialog-details';
import { api } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Visitor, Person, Employee } from '../../types';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/hooks/use-confirm';
import { useUnitCode } from '@/contexts/AuthContext';

export default function VisitorsList() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [managementSearchTerm, setManagementSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    visit_reason: '',
    registration_date: new Date().toISOString().split('T')[0],
    visit_expiry_date: '',
    person_id: '',
    responsible_employee_id: '',
  });
  const { toast } = useToast();
  const { confirmar, ConfirmDialog } = useConfirm();

  // Unidade do usuário logado: é o filtro de toda listagem
  const unitCode = useUnitCode();

  useEffect(() => {
    // Enquanto o perfil não chegou a gente não sabe qual unidade consultar
    if (!unitCode) return;
    loadData();
  }, [unitCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar visitantes da API
      try {
        const visitorsRes = await api.get('/visitors', {
          params: { unit_code: unitCode, page: 1, page_size: 1000 }
        });
        const visitorsData = visitorsRes.data.visitors || [];
        setVisitors(visitorsData.map((v: any) => ({
          id: v.id,
          company: v.company,
          visit_reason: v.visit_reason,
          registration_date: v.registration_date ? new Date(v.registration_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          visit_expiry_date: v.visit_expiry_date ? new Date(v.visit_expiry_date).toISOString().split('T')[0] : undefined,
          person_id: v.person_id,
          responsible_employee_id: v.responsible_employee_id,
          responsible_employee: v.responsible_employee,
        })));
        
        // Buscar pessoas para ter os dados completos
        const peopleRes = await api.get('/people', { 
          params: { unit_code: unitCode, type: 'visitor', page: 1, page_size: 1000 } 
        });
        const peopleData = peopleRes.data.people || [];
        setPeople(peopleData);
      } catch (error: any) {
        // Fallback: se não tiver rota de visitors, usar people
        const peopleRes = await api.get('/people', { 
          params: { unit_code: unitCode, type: 'visitor', page: 1, page_size: 1000 } 
        });
        const peopleData = peopleRes.data.people || [];
        setPeople(peopleData);
        setVisitors(peopleData.map((p: Person) => ({
          id: p.id,
          registration_date: new Date().toISOString().split('T')[0],
          person_id: p.id,
        })));
      }
      
      // Buscar employees para o select de responsável
      try {
        const employeesRes = await api.get('/employees', {
          params: { unit_code: unitCode, page: 1, page_size: 1000 }
        });
        setEmployees(employeesRes.data.employees || []);
      } catch (error) {
        console.error('Error loading employees:', error);
        setEmployees([]);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.person_id) {
        toast({
          title: 'Erro',
          description: 'Selecione uma pessoa',
          variant: 'destructive',
        });
        return;
      }

      const submitData = {
        ...formData,
        person_id: parseInt(formData.person_id),
        responsible_employee_id: formData.responsible_employee_id ? parseInt(formData.responsible_employee_id) : null,
      };

      if (editingVisitor) {
        // Garantir que temos o ID do visitante
        if (!editingVisitor.id) {
          toast({
            title: 'Erro',
            description: 'ID do visitante não encontrado',
            variant: 'destructive',
          })
          return
        }
        
        // Preparar dados para envio, tratando campos vazios
        const updateData: any = {}
        if (formData.company !== undefined && formData.company !== null) updateData.company = formData.company || null
        if (formData.visit_reason !== undefined && formData.visit_reason !== null) updateData.visit_reason = formData.visit_reason || null
        if (formData.registration_date) updateData.registration_date = formData.registration_date
        if (formData.visit_expiry_date) {
          updateData.visit_expiry_date = formData.visit_expiry_date
        } else {
          // Se não tiver data de expiração, pode ser null
          updateData.visit_expiry_date = null
        }
        if (formData.responsible_employee_id) {
          updateData.responsible_employee_id = parseInt(formData.responsible_employee_id)
        } else {
          updateData.responsible_employee_id = null
        }
        
        await api.patch(`/visitors/${editingVisitor.id}`, updateData);
        toast({ title: 'Visitante atualizado!' });
        setDialogOpen(false);
        resetForm();
        setEditingVisitor(null);
        loadData();
        return;
      } else {
        await api.post('/visitors', submitData);
        toast({ title: 'Visitante criado!' });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar visitante',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (visitor: Visitor) => {
    try {
      setLoading(true)
      
      // Buscar dados completos do visitante usando GET /people
      let person = people.find((p) => p.id === visitor.person_id)
      
      // Se não encontrou na lista local, buscar pela API
      if (!person || !person.cpf) {
        try {
          const peopleRes = await api.get('/people', { 
            params: { unit_code: unitCode, type: 'visitor', page: 1, page_size: 1000 } 
          })
          const peopleData = peopleRes.data.people || []
          person = peopleData.find((p: any) => p.id === visitor.person_id)
        } catch (error) {
          console.error('Error fetching people:', error)
        }
      }
      
      if (!person || !person.cpf) {
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar os dados do visitante. Recarregue a página.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
      
      // Buscar dados completos da pessoa
      let personDetails
      try {
        const personDetailsRes = await api.post('/people/get-people', { cpf: person.cpf })
        personDetails = personDetailsRes.data
      } catch (error: any) {
        console.error('Error fetching person details:', error)
        toast({
          title: 'Erro',
          description: error.response?.data?.error || 'Erro ao carregar dados do visitante',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
      
      const visitorData = personDetails.visitor || {}
      
      // Função auxiliar para converter datas de forma segura
      const safeDate = (date: any) => {
        if (!date) return ''
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return ''
          return d.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }
      
      // Preparar dados do visitante
      const editingVisitorData: any = {
        ...visitor,
        id: visitor.id,
        company: visitorData.company !== undefined ? visitorData.company : (visitor.company || ''),
        visit_reason: visitorData.visit_reason !== undefined ? visitorData.visit_reason : (visitor.visit_reason || ''),
        registration_date: safeDate(visitorData.registration_date || visitor.registration_date) || new Date().toISOString().split('T')[0],
        visit_expiry_date: safeDate(visitorData.visit_expiry_date || visitor.visit_expiry_date),
        responsible_employee_id: visitorData.responsible_employee_id !== undefined 
          ? visitorData.responsible_employee_id 
          : visitor.responsible_employee_id,
        person_id: visitor.person_id,
      }
      
      setEditingVisitor(editingVisitorData)
      
      setFormData({
        company: visitorData.company !== undefined ? visitorData.company : (visitor.company || ''),
        visit_reason: visitorData.visit_reason !== undefined ? visitorData.visit_reason : (visitor.visit_reason || ''),
        registration_date: safeDate(visitorData.registration_date || visitor.registration_date) || new Date().toISOString().split('T')[0],
        visit_expiry_date: safeDate(visitorData.visit_expiry_date || visitor.visit_expiry_date),
        person_id: visitor.person_id.toString(),
        responsible_employee_id: visitorData.responsible_employee_id?.toString() || visitor.responsible_employee_id?.toString() || '',
      })
      
      setDialogOpen(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading visitor:', error)
      setLoading(false)
      toast({
        title: 'Erro ao carregar dados do visitante',
        description: error.response?.data?.error || error.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  };

  const handleDelete = async (visitor: Visitor) => {
    // O CPF vem junto do visitante na listagem, então não precisa procurar em
    // outra lista. Antes esta função recebia visitor.id e procurava por ele em
    // "people", que é indexada por person_id: são sequências diferentes, então
    // a busca quase nunca achava e a tela dizia "Pessoa não encontrada".
    const cpf = visitor.person?.cpf ?? people.find((p) => p.id === visitor.person_id)?.cpf;

    if (!cpf) {
      toast({
        title: 'Não consegui excluir',
        description: 'Não achei o CPF desse visitante. Recarregue a página e tente de novo.',
        variant: 'destructive',
      });
      return;
    }

    const nome = visitor.person?.full_name ?? 'este visitante';

    const confirmado = await confirmar({
      title: `Excluir ${nome}?`,
      description:
        'Isso apaga a pessoa do sistema junto com as digitais e o histórico de acesso dela. Não tem como desfazer.',
      confirmLabel: 'Excluir',
    });

    if (!confirmado) return;

    try {
      // O backend apaga pelo CPF no corpo do DELETE /people (e o resto cai em cascata)
      await api.delete('/people', { data: { cpf } });
      toast({ title: 'Visitante excluído' });
      loadData();
    } catch (error: any) {
      // O interceptor do axios já mostrou o motivo; aqui só registra pra debug
      console.error('Erro ao excluir visitante:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      visit_reason: '',
      registration_date: new Date().toISOString().split('T')[0],
      visit_expiry_date: '',
      person_id: '',
      responsible_employee_id: '',
    });
    setEditingVisitor(null);
  };

  const getPersonName = (personId: number) => {
    const person = people.find((p) => p.id === personId);
    return person?.full_name || 'Desconhecido';
  };

  const getEmployeeName = (employeeId: number | undefined, responsibleEmployee?: any) => {
    if (!employeeId) return '';
    
    // Primeiro tenta usar os dados do responsible_employee que vem da API
    if (responsibleEmployee && responsibleEmployee.person) {
      return responsibleEmployee.person.full_name || '';
    }
    
    // Fallback: busca na lista de employees
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return '';
    const person = people.find((p) => p.id === employee.person_id);
    return person?.full_name || '';
  };

  const isVisitExpired = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredVisitors = visitors.filter((visitor) =>
    getPersonName(visitor.person_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (visitor.company && visitor.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitantes</h1>
          <p className="text-muted-foreground">
            Gerencie visitantes cadastrados no sistema
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingVisitor(null);
          }
        }}>
        <DialogTrigger asChild>
          <Button className="btn-gradient">
            <Settings className="mr-2 w-4 h-4" />
            Gerenciar Visitantes
          </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVisitor ? 'Editar Visitante' : 'Gerenciar Visitantes'}
              </DialogTitle>
              <DialogDescription>
                {editingVisitor ? 'Atualize as informações do visitante' : 'Selecione um visitante para editar ou excluir'}
              </DialogDescription>
            </DialogHeader>
            
            {editingVisitor ? (
              loading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Carregando dados do visitante...</p>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit_reason">Motivo da Visita</Label>
                  <Input
                    id="visit_reason"
                    value={formData.visit_reason}
                    onChange={(e) => setFormData({ ...formData, visit_reason: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_date">Data de Registro *</Label>
                  <Input
                    id="registration_date"
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit_expiry_date">Data de Expiração da Visita</Label>
                  <Input
                    id="visit_expiry_date"
                    type="date"
                    value={formData.visit_expiry_date}
                    onChange={(e) => setFormData({ ...formData, visit_expiry_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible_employee_id">Funcionário Responsável</Label>
                  <Select value={formData.responsible_employee_id} onValueChange={(value) => setFormData({ ...formData, responsible_employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {getEmployeeName(employee.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingVisitor(null);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Atualizar
                  </Button>
                </DialogFooter>
              </form>
              )
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar visitantes..."
                    value={managementSearchTerm}
                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredVisitors
                    .filter((v) =>
                      getPersonName(v.person_id).toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                      (v.company && v.company.toLowerCase().includes(managementSearchTerm.toLowerCase()))
                    )
                    .length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhum visitante encontrado</p>
                  ) : (
                    filteredVisitors
                      .filter((v) =>
                        getPersonName(v.person_id).toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                        (v.company && v.company.toLowerCase().includes(managementSearchTerm.toLowerCase()))
                      )
                      .map((visitor) => (
                      <Card key={visitor.id} className="glass-card p-4 shadow-card transition-smooth">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{getPersonName(visitor.person_id)}</h4>
                            {visitor.company && (
                              <p className="text-sm text-muted-foreground">Empresa: {visitor.company}</p>
                            )}
                            {visitor.registration_date && (
                              <p className="text-sm text-muted-foreground">
                                Registrado em: {new Date(visitor.registration_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {visitor.responsible_employee_id && (
                              <p className="text-sm text-muted-foreground">
                                Responsável: {getEmployeeName(visitor.responsible_employee_id, (visitor as any).responsible_employee) || 'N/A'}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {isVisitExpired(visitor.visit_expiry_date) ? (
                                <Badge className="bg-red-500">Expirado</Badge>
                              ) : visitor.visit_expiry_date ? (
                                <Badge className="badge-soft-green">Válido</Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(visitor)}
                            >
                              <Edit className="mr-2 w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(visitor)}
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
          <CardDescription>Busque visitantes por nome ou empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </Card>
            ))}
          </div>
        ) : filteredVisitors.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum visitante encontrado</p>
          </Card>
        ) : (
          filteredVisitors.map((visitor) => (
            <Card key={visitor.id} className="shadow-card hover:shadow-lg transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{getPersonName(visitor.person_id)}</h3>
                        {visitor.company && (
                          <p className="text-sm text-muted-foreground">Empresa: {visitor.company}</p>
                        )}
                        {visitor.visit_reason && (
                          <p className="text-sm text-muted-foreground">Motivo: {visitor.visit_reason}</p>
                        )}
                        {visitor.registration_date && (
                          <p className="text-sm text-muted-foreground">
                            Registrado em: {new Date(visitor.registration_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {visitor.visit_expiry_date && (
                          <p className="text-sm text-muted-foreground">
                            Expira em: {new Date(visitor.visit_expiry_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {visitor.responsible_employee_id && (
                          <p className="text-sm text-muted-foreground">
                            Responsável: {getEmployeeName(visitor.responsible_employee_id, (visitor as any).responsible_employee) || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {isVisitExpired(visitor.visit_expiry_date) ? (
                        <Badge className="bg-red-500">Expirado</Badge>
                      ) : visitor.visit_expiry_date ? (
                        <Badge className="bg-green-500">Válido</Badge>
                      ) : null}
                      {visitor.responsible_employee_id && (
                        <Badge variant="outline">Resp: {getEmployeeName(visitor.responsible_employee_id, (visitor as any).responsible_employee) || 'N/A'}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedVisitor(visitor);
                    setDetailsOpen(true);
                  }}>
                    <Eye className="mr-2 w-4 h-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedVisitor && (
        <DialogDetails
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={`Detalhes do Visitante - ${getPersonName(selectedVisitor.person_id)}`}
          description="Informações completas do visitante"
          details={[
            { label: "Nome", value: getPersonName(selectedVisitor.person_id) || "N/A" },
            { label: "Empresa", value: selectedVisitor.company || (selectedVisitor.company === null || selectedVisitor.company === undefined ? "N/A" : "N/A") },
            { label: "Motivo da Visita", value: selectedVisitor.visit_reason || (selectedVisitor.visit_reason === null || selectedVisitor.visit_reason === undefined ? "N/A" : "N/A") },
            {
              label: "Data de Registro",
              value: selectedVisitor.registration_date
                ? new Date(selectedVisitor.registration_date).toLocaleDateString("pt-BR")
                : "N/A",
            },
            {
              label: "Data de Expiração",
              value: selectedVisitor.visit_expiry_date
                ? new Date(selectedVisitor.visit_expiry_date).toLocaleDateString("pt-BR")
                : (selectedVisitor.visit_expiry_date === null || selectedVisitor.visit_expiry_date === undefined ? "N/A" : "N/A"),
            },
            {
              label: "Status",
              value: isVisitExpired(selectedVisitor.visit_expiry_date) ? "Expirado" : "Válido",
            },
            {
              label: "Funcionário Responsável",
              value: selectedVisitor.responsible_employee_id
                ? getEmployeeName(selectedVisitor.responsible_employee_id, (selectedVisitor as any).responsible_employee)
                : (selectedVisitor.responsible_employee_id === null || selectedVisitor.responsible_employee_id === undefined ? "N/A" : "N/A"),
            },
          ]}
        />
      )}

      {/* O diálogo de confirmação precisa existir na árvore pra poder abrir */}
      <ConfirmDialog />
    </div>
  );
}
