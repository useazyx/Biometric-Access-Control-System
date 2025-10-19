import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { personAPI, studentAPI, employeeAPI, visitorAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function CreatePerson() {
  const [personType, setPersonType] = useState<string>('STUDENT');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    contactPhone: '',
    email: '',
    unitId: '',
    // Student specific
    registrationNumber: '',
    course: '',
    shift: '',
    // Employee specific
    employeeId: '',
    department: '',
    position: '',
    // Visitor specific
    visitDate: '',
    visitPurpose: '',
    hostName: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const personData = {
        name: formData.name,
        cpf: formData.cpf,
        birthDate: new Date(formData.birthDate),
        personType,
        contactPhone: formData.contactPhone || undefined,
        email: formData.email || undefined,
        unitId: formData.unitId || undefined,
      };

      const personResponse = await personAPI.create(personData);
      const personId = personResponse.data.id;

      // Create specific type data
      if (personType === 'STUDENT') {
        await studentAPI.create({
          personId,
          registrationNumber: formData.registrationNumber,
          course: formData.course || undefined,
          shift: formData.shift || undefined,
        });
      } else if (personType === 'EMPLOYEE') {
        await employeeAPI.create({
          personId,
          employeeId: formData.employeeId,
          department: formData.department || undefined,
          position: formData.position || undefined,
        });
      } else if (personType === 'VISITOR') {
        await visitorAPI.create({
          personId,
          visitDate: new Date(formData.visitDate),
          visitPurpose: formData.visitPurpose || undefined,
          hostName: formData.hostName || undefined,
        });
      }

      toast({
        title: 'Pessoa criada!',
        description: 'A pessoa foi cadastrada com sucesso.',
      });

      navigate('/people');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar pessoa',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/people')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Pessoa</h1>
          <p className="text-muted-foreground">Cadastre uma nova pessoa no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados pessoais e de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personType">Tipo de Pessoa *</Label>
                <Select value={personType} onValueChange={setPersonType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Aluno</SelectItem>
                    <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                    <SelectItem value="VISITOR">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {personType === 'STUDENT' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Informações do Aluno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Matrícula *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Curso</Label>
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => handleChange('course', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Turno</Label>
                  <Select value={formData.shift} onValueChange={(value) => handleChange('shift', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="night">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {personType === 'EMPLOYEE' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Informações do Funcionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">ID Funcionário *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {personType === 'VISITOR' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Informações do Visitante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Data da Visita *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => handleChange('visitDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitPurpose">Motivo</Label>
                  <Input
                    id="visitPurpose"
                    value={formData.visitPurpose}
                    onChange={(e) => handleChange('visitPurpose', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostName">Anfitrião</Label>
                  <Input
                    id="hostName"
                    value={formData.hostName}
                    onChange={(e) => handleChange('hostName', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/people')}>
            Cancelar
          </Button>
          <Button type="submit" className="gradient-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Pessoa'}
          </Button>
        </div>
      </form>
    </div>
  );
}
