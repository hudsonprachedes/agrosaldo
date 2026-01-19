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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Save, Shield, Trash2, Plus, X } from 'lucide-react';
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

type DeclarationPeriod = {
  code: string;
  label: string;
  start: string;
  end: string;
};

export default function AdminRegulamentacoes() {
  const [regulations, setRegulations] = useState<StateRegulation[]>([]);
  const [selectedReg, setSelectedReg] = useState<StateRegulation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StateRegulation>>({
    uf: '',
    stateName: '',
    reportingDeadline: 15,
    requiredDocuments: [],
    declarationFrequency: 2,
    declarationPeriods: { periods: [] },
    responsibleAgency: '',
    requiredVaccines: [],
    notificationLeadDays: [30, 15, 7, 3, 0],
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

  const getDeclarationPeriodsArray = (value: Partial<StateRegulation>['declarationPeriods']): DeclarationPeriod[] => {
    const periods = (value as any)?.periods;
    if (!Array.isArray(periods)) return [];
    return periods.map((p: any) => ({
      code: String(p?.code ?? ''),
      label: String(p?.label ?? ''),
      start: String(p?.start ?? ''),
      end: String(p?.end ?? ''),
    }));
  };

  const setDeclarationPeriodsArray = (periods: DeclarationPeriod[]) => {
    setFormData({
      ...formData,
      declarationPeriods: { periods },
    });
  };

  const isValidMmDd = (value: string) => /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(value);

  const openEditDialog = (reg: StateRegulation) => {
    setSelectedReg(reg);
    setFormData({
      ...reg,
      declarationPeriods: reg.declarationPeriods ?? { periods: [] },
      notificationLeadDays: reg.notificationLeadDays ?? [30, 15, 7, 3, 0],
      requiredDocuments: reg.requiredDocuments ?? [],
      requiredVaccines: reg.requiredVaccines ?? [],
    });
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
      declarationFrequency: 2,
      declarationPeriods: { periods: [] },
      responsibleAgency: '',
      requiredVaccines: [],
      notificationLeadDays: [30, 15, 7, 3, 0],
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

    const periods = getDeclarationPeriodsArray(formData.declarationPeriods);
    const invalidPeriodIndex = periods.findIndex((p) => {
      if (!p.code.trim() || !p.label.trim() || !p.start.trim() || !p.end.trim()) return true;
      if (!isValidMmDd(p.start) || !isValidMmDd(p.end)) return true;
      return false;
    });
    if (invalidPeriodIndex !== -1) {
      toast.error(`Verifique o período #${invalidPeriodIndex + 1}: preencha e use datas no formato MM-DD`);
      return;
    }

    try {
      if (isEditing) {
        const updated = await adminService.updateRegulation(selectedReg!.id, {
          uf: formData.uf!,
          stateName: formData.stateName!,
          reportingDeadline: Number.isFinite(formData.reportingDeadline) ? (formData.reportingDeadline as number) : 15,
          requiredDocuments: formData.requiredDocuments || [],
          declarationFrequency: formData.declarationFrequency || 1,
          declarationPeriods: formData.declarationPeriods || { periods: [] },
          responsibleAgency: formData.responsibleAgency || '',
          requiredVaccines: formData.requiredVaccines || [],
          notificationLeadDays: formData.notificationLeadDays || [30, 15, 7, 3, 0],
          gtaRequired: formData.gtaRequired ?? true,
          observations: formData.observations || '',
        });
        setRegulations(regulations.map(r => r.id === selectedReg!.id ? updated : r));
        toast.success('Regulamentação atualizada');
      } else {
        const created = await adminService.createRegulation({
          uf: formData.uf!,
          stateName: formData.stateName!,
          reportingDeadline: Number.isFinite(formData.reportingDeadline) ? (formData.reportingDeadline as number) : 15,
          requiredDocuments: formData.requiredDocuments || [],
          declarationFrequency: formData.declarationFrequency || 1,
          declarationPeriods: formData.declarationPeriods || { periods: [] },
          responsibleAgency: formData.responsibleAgency || '',
          requiredVaccines: formData.requiredVaccines || [],
          notificationLeadDays: formData.notificationLeadDays || [30, 15, 7, 3, 0],
          gtaRequired: formData.gtaRequired ?? true,
          observations: formData.observations || '',
        });
        setRegulations([...regulations, created]);
        toast.success('Regulamentação criada');
      }

      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar regulamentação:', error);
      toast.error('Erro ao salvar regulamentação');
    }
  };

  const handleDelete = async () => {
    if (!selectedReg?.id) return;
    try {
      setIsDeleting(true);
      await adminService.deleteRegulation(selectedReg.id);
      setRegulations(regulations.filter((r) => r.id !== selectedReg.id));
      setShowDialog(false);
      toast.success('Regulamentação excluída');
    } catch (error) {
      console.error('Erro ao excluir regulamentação:', error);
      toast.error('Erro ao excluir regulamentação');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFrequencyLabel = (freq: number) => (freq === 2 ? '2x ao ano' : '1x ao ano');

  const getPeriodsLabel = (periods: Record<string, unknown>) => {
    const p = (periods as any)?.periods;
    if (!Array.isArray(p) || p.length === 0) return 'Não configurado';
    return p.map((x: any) => x?.label || x?.code).filter(Boolean).join(' / ');
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
                  <TableHead>Declaração</TableHead>
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
                      {getFrequencyLabel(reg.declarationFrequency)}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {getPeriodsLabel(reg.declarationPeriods)}
                      </div>
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
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFormData({ ...formData, reportingDeadline: Number.isFinite(v) ? v : 15 });
                    }}
                    className="mt-2"
                    min="1"
                    max="90"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Dias após a movimentação
                  </p>
                </div>

                <div>
                  <Label htmlFor="responsibleAgency">Órgão Responsável</Label>
                  <Input
                    id="responsibleAgency"
                    value={formData.responsibleAgency}
                    onChange={(e) => setFormData({ ...formData, responsibleAgency: e.target.value })}
                    className="mt-2"
                    placeholder="Ex.: INDEA, IAGRO"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="declarationFrequency">Frequência de Declaração</Label>
                <Select
                  value={String(formData.declarationFrequency ?? 1)}
                  onValueChange={(value) => setFormData({ ...formData, declarationFrequency: Number(value) })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x ao ano</SelectItem>
                    <SelectItem value="2">2x ao ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label>Períodos da Declaração</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                      setDeclarationPeriodsArray([
                        ...current,
                        { code: '', label: '', start: '', end: '' },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar período
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {getDeclarationPeriodsArray(formData.declarationPeriods).length === 0 ? (
                    <div className="rounded-md border p-4 text-sm text-gray-600">
                      Nenhum período configurado. Clique em “Adicionar período”.
                    </div>
                  ) : (
                    getDeclarationPeriodsArray(formData.declarationPeriods).map((p, idx) => {
                      const startOk = !p.start || isValidMmDd(p.start);
                      const endOk = !p.end || isValidMmDd(p.end);
                      return (
                        <div key={`${idx}-${p.code}`} className="rounded-md border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium">Período #{idx + 1}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                                setDeclarationPeriodsArray(current.filter((_, i) => i !== idx));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`period-code-${idx}`}>Código</Label>
                              <Input
                                id={`period-code-${idx}`}
                                value={p.code}
                                onChange={(e) => {
                                  const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                                  current[idx] = { ...current[idx], code: e.target.value };
                                  setDeclarationPeriodsArray(current);
                                }}
                                className="mt-2"
                                placeholder="Ex.: MAIO"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`period-label-${idx}`}>Nome</Label>
                              <Input
                                id={`period-label-${idx}`}
                                value={p.label}
                                onChange={(e) => {
                                  const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                                  current[idx] = { ...current[idx], label: e.target.value };
                                  setDeclarationPeriodsArray(current);
                                }}
                                className="mt-2"
                                placeholder="Ex.: Maio"
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`period-start-${idx}`}>Início (MM-DD)</Label>
                              <Input
                                id={`period-start-${idx}`}
                                value={p.start}
                                onChange={(e) => {
                                  const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                                  current[idx] = { ...current[idx], start: e.target.value };
                                  setDeclarationPeriodsArray(current);
                                }}
                                className="mt-2"
                                placeholder="05-01"
                              />
                              {!startOk && (
                                <p className="text-sm text-red-600 mt-1">Use o formato MM-DD</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`period-end-${idx}`}>Fim (MM-DD)</Label>
                              <Input
                                id={`period-end-${idx}`}
                                value={p.end}
                                onChange={(e) => {
                                  const current = getDeclarationPeriodsArray(formData.declarationPeriods);
                                  current[idx] = { ...current[idx], end: e.target.value };
                                  setDeclarationPeriodsArray(current);
                                }}
                                className="mt-2"
                                placeholder="05-31"
                              />
                              {!endOk && (
                                <p className="text-sm text-red-600 mt-1">Use o formato MM-DD</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Datas no formato MM-DD. Ex.: 05-01 até 05-31.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requiredVaccines">Vacinas Obrigatórias (separar por vírgula)</Label>
                  <Input
                    id="requiredVaccines"
                    value={formData.requiredVaccines?.join(', ') || ''}
                    onChange={(e) => setFormData({ ...formData, requiredVaccines: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
                    className="mt-2"
                    placeholder="Brucelose, Raiva"
                  />
                </div>

                <div>
                  <Label htmlFor="notificationLeadDays">Dias de aviso (separar por vírgula)</Label>
                  <Input
                    id="notificationLeadDays"
                    value={formData.notificationLeadDays?.join(', ') || ''}
                    onChange={(e) => setFormData({ ...formData, notificationLeadDays: e.target.value.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v)) })}
                    className="mt-2"
                    placeholder="30, 15, 7, 3, 0"
                  />
                </div>
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
              <div className="flex w-full items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>

                <div className="flex items-center gap-3">
                  {isEditing && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir regulamentação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. A regulamentação será removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
