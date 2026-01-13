import React, { useState } from 'react';
import {
  GTA_RULES,
  GTAState,
  STATE_NAMES,
  GTAValidationRule,
} from '@/lib/gta-validation';
import {
  MapPin,
  Edit2,
  Save,
  FileCheck,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminRegras() {
  const [gtaRules, setGtaRules] = useState<Record<GTAState, GTAValidationRule>>(GTA_RULES);
  const [selectedState, setSelectedState] = useState<GTAState | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  
  // Form state
  const [pattern, setPattern] = useState('');
  const [format, setFormat] = useState('');
  const [length, setLength] = useState(0);
  const [expirationDays, setExpirationDays] = useState(15);
  const [requiredForSale, setRequiredForSale] = useState(true);
  const [requiredForPurchase, setRequiredForPurchase] = useState(true);

  const openEditDialog = (state: GTAState) => {
    const rule = gtaRules[state];
    setSelectedState(state);
    setPattern(rule.pattern.source);
    setFormat(rule.format);
    setLength(rule.length);
    setExpirationDays(rule.expirationDays);
    setRequiredForSale(rule.requiredForSale);
    setRequiredForPurchase(rule.requiredForPurchase);
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedState) return;

    try {
      const newPattern = new RegExp(pattern);
      
      const updatedRule: GTAValidationRule = {
        ...gtaRules[selectedState],
        pattern: newPattern,
        format,
        length,
        expirationDays,
        requiredForSale,
        requiredForPurchase,
      };

      setGtaRules({
        ...gtaRules,
        [selectedState]: updatedRule,
      });

      toast.success(`Regras de GTA para ${STATE_NAMES[selectedState]} atualizadas`);
      setEditDialog(false);
      setSelectedState(null);
    } catch (error) {
      toast.error('Padrão regex inválido');
    }
  };

  const testGTA = (state: GTAState, testNumber: string) => {
    const rule = gtaRules[state];
    const isValid = rule.pattern.test(testNumber);
    
    if (isValid) {
      toast.success(`GTA válido para ${STATE_NAMES[state]}`);
    } else {
      toast.error(`GTA inválido. Formato esperado: ${rule.format}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Regras por Estado
        </h1>
        <p className="text-muted-foreground">
          Configure validações de GTA por estado
        </p>
      </div>

      {/* GTA Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Validação de GTA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Comprimento</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(gtaRules).map(([stateCode, rule]) => (
                <TableRow key={stateCode}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium">{STATE_NAMES[stateCode as GTAState]}</div>
                        <div className="text-xs text-muted-foreground">{stateCode}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {rule.format}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{rule.length} chars</TableCell>
                  <TableCell>{rule.expirationDays} dias</TableCell>
                  <TableCell>
                    {rule.requiredForSale ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.requiredForPurchase ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(stateCode as GTAState)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Examples Card */}
      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Exemplos de GTA por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gtaRules).slice(0, 6).map(([stateCode, rule]) => (
              <div key={stateCode} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{stateCode}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Exemplo válido
                  </span>
                </div>
                <code className="block text-sm bg-background px-3 py-2 rounded border">
                  {rule.example}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => testGTA(stateCode as GTAState, rule.example)}
                >
                  Testar Validação
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configurar Regras de GTA - {selectedState && STATE_NAMES[selectedState]}
            </DialogTitle>
            <DialogDescription>
              Defina as regras de validação para GTA do estado {selectedState}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Formato de Exibição</Label>
                <Input
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="Ex: MS-XXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Use X para representar dígitos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Comprimento Total</Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Número total de caracteres
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Padrão Regex</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="^MS-\d{7}$"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Expressão regular para validação
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDays">Dias de Validade</Label>
              <Input
                id="expirationDays"
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                placeholder="15"
              />
              <p className="text-xs text-muted-foreground">
                Número de dias de validade da GTA após emissão
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requiredForSale">Obrigatório para Venda</Label>
                  <p className="text-xs text-muted-foreground">
                    GTA é obrigatória ao registrar venda de animais
                  </p>
                </div>
                <Switch
                  id="requiredForSale"
                  checked={requiredForSale}
                  onCheckedChange={setRequiredForSale}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requiredForPurchase">Obrigatório para Compra</Label>
                  <p className="text-xs text-muted-foreground">
                    GTA é obrigatória ao registrar compra de animais
                  </p>
                </div>
                <Switch
                  id="requiredForPurchase"
                  checked={requiredForPurchase}
                  onCheckedChange={setRequiredForPurchase}
                />
              </div>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Atenção ao alterar regras
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mudanças nas regras de validação afetam todos os lançamentos futuros.
                    Certifique-se de que o padrão regex está correto antes de salvar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
