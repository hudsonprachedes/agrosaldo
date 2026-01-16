import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Save, Shield } from 'lucide-react';
import { adminService, StateRegulation } from '@/services/api.service';
import { toast } from 'sonner';

const UF_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

export default function AdminRegulamentacoes() {
  const [regulations, setRegulations] = useState<StateRegulation[]>([]);
  const [selectedReg, setSelectedReg] = useState<StateRegulation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<StateRegulation>>({
    uf: '',
    stateName: '',
    reportingDeadline: 15,
    requiredDocuments: [],
    saldoReportFrequency: 'monthly',
    saldoReportDay: 10,
    gtaRequired: true,
    observations: '',
  });

  useEffect(() => {
    const loadRegulations = async () => {
      try {
        const data = await adminService.getRegulations();
        setRegulations(data);
      } catch (error) {
        console.error('Erro ao carregar regulamentações:', error);
        toast.error('Erro ao carregar regulamentações');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRegulations();
  }, []);

  const openEditDialog = (reg: StateRegulation) => {
    setSelectedReg(reg);
    setFormData(reg);
    setIsEditing(true);
    setShowDialog(true);
  };

  const openNewDialog = () => {
    setSelectedReg(null);
    setFormData({
      uf: '',
      stateName: '',
      reportingDeadline: 15,
      requiredDocuments: [],
      saldoReportFrequency: 'monthly',
      saldoReportDay: 10,
      gtaRequired: true,
      observations: '',
    });
    setIsEditing(false);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.uf || !formData.stateName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const newReg: StateRegulation = {
        id: isEditing ? selectedReg!.id : `reg-${formData.uf?.toLowerCase()}`,
        uf: formData.uf!,
        stateName: formData.stateName!,
        reportingDeadline: formData.reportingDeadline || 15,
        requiredDocuments: formData.requiredDocuments || [],
        saldoReportFrequency: formData.saldoReportFrequency || 'monthly',
        saldoReportDay: formData.saldoReportDay || 10,
        gtaRequired: formData.gtaRequired ?? true,
        observations: formData.observations || '',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Master',
      };

      if (isEditing) {
        await adminService.updateRegulation(selectedReg!.id, newReg);
        setRegulations(regulations.map(r => r.id === selectedReg!.id ? newReg : r));
        toast.success('Regulamentação atualizada');
      } else {
        await adminService.createRegulation(newReg);
        setRegulations([...regulations, newReg]);
        toast.success('Regulamentação criada');
      }

      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar regulamentação:', error);
      toast.error('Erro ao salvar regulamentação');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual',
    };
    return labels[freq as keyof typeof labels] || freq;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando regulamentações...</div>;
  }

  return (
    <div className="space-y-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Regulamentações Estaduais</h1>
            <p className="text-gray-600">
              Configure regras da Defesa Agropecuária por UF
            </p>
          </div>

          <Button onClick={openNewDialog}>
            <FileText className="w-4 h-4 mr-2" />
            Nova Regulamentação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Regulamentações por Estado
            </CardTitle>
            <CardDescription>
              Prazos, documentos obrigatórios e frequência de declaração de saldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UF</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prazo Movimentação</TableHead>
                  <TableHead>Declaração Saldo</TableHead>
                  <TableHead>GTA</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regulations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-bold">{reg.uf}</TableCell>
                    <TableCell>{reg.stateName}</TableCell>
                    <TableCell>{reg.reportingDeadline} dias</TableCell>
                    <TableCell>
                      {getFrequencyLabel(reg.saldoReportFrequency)} (dia {reg.saldoReportDay})
                    </TableCell>
                    <TableCell>
                      {reg.gtaRequired ? (
                        <Badge className="bg-green-100 text-green-800">Obrigatória</Badge>
                      ) : (
                        <Badge variant="outline">Não obrigatória</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(reg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {regulations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhuma regulamentação cadastrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição/Criação */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Regulamentação' : 'Nova Regulamentação'}
              </DialogTitle>
              <DialogDescription>
                Configure as regras da Defesa Agropecuária para o estado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uf">UF *</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => {
                      setFormData({ ...formData, uf: value, stateName: UF_NAMES[value] });
                    }}
                    disabled={isEditing}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UF_NAMES).map(([uf, name]) => (
                        <SelectItem key={uf} value={uf}>
                          {uf} - {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stateName">Nome do Estado *</Label>
                  <Input
                    id="stateName"
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    className="mt-2"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportingDeadline">Prazo para Informar Movimentação (dias)</Label>
                  <Input
                    id="reportingDeadline"
                    type="number"
                    value={formData.reportingDeadline}
                    onChange={(e) => setFormData({ ...formData, reportingDeadline: parseInt(e.target.value) })}
                    className="mt-2"
                    min="1"
                    max="90"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Dias após a movimentação
                  </p>
                </div>

                <div>
                  <Label htmlFor="saldoReportDay">Dia da Declaração de Saldo</Label>
                  <Input
                    id="saldoReportDay"
                    type="number"
                    value={formData.saldoReportDay}
                    onChange={(e) => setFormData({ ...formData, saldoReportDay: parseInt(e.target.value) })}
                    className="mt-2"
                    min="1"
                    max="31"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Dia do mês/período
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="saldoReportFrequency">Frequência de Declaração de Saldo</Label>
                <Select
                  value={formData.saldoReportFrequency}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'biannual' | 'annual') => setFormData({ ...formData, saldoReportFrequency: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="biannual">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requiredDocuments">Documentos Obrigatórios</Label>
                <Input
                  id="requiredDocuments"
                  value={formData.requiredDocuments?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value.split(',').map(d => d.trim()) })}
                  className="mt-2"
                  placeholder="GTA, Atestado Sanitário, Certificado Vacinação"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separar por vírgula
                </p>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Switch
                  id="gtaRequired"
                  checked={formData.gtaRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, gtaRequired: checked })}
                />
                <Label htmlFor="gtaRequired" className="cursor-pointer">
                  GTA Obrigatória para Movimentações
                </Label>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="mt-2"
                  rows={4}
                  placeholder="Informações adicionais sobre as regras da Defesa Agropecuária deste estado..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
