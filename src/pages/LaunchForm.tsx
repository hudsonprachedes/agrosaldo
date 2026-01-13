import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  Baby,
  Skull,
  Truck,
  Syringe,
  Dog,
  ArrowLeft,
  Camera,
  Calendar,
  Hash,
  DollarSign,
  FileText,
  Zap,
  Bug,
  Heart,
  Check,
  Plus,
  Minus,
  Droplets,
  X,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ageGroups } from '@/mocks/mock-bovinos';
import { cn } from '@/lib/utils';
import MobileLayout from '@/components/layout/MobileLayout';
import { 
  saveMovement, 
  savePhoto,
  saveSpeciesBalance,
  saveSpeciesAdjustment,
} from '@/lib/indexeddb';
import { compressImage } from '@/lib/image-compression';

import { getAvailableMatrizes } from '@/mocks/mock-bovinos';
import CameraCapture from '@/components/CameraCapture';
interface LaunchFormProps {
  type: 'nascimento' | 'mortalidade' | 'venda' | 'vacina' | 'outras';
}

const deathCauses = [
  { id: 'snake', label: 'Cobra', icon: '🐍' },
  { id: 'lightning', label: 'Raio', icon: '⚡' },
  { id: 'disease', label: 'Doença', icon: '🦠' },
  { id: 'other', label: 'Outras', icon: '❓' },
];

const vaccineCampaigns = [
  { id: 'aftosa', label: 'Febre Aftosa', icon: '💉' },
  { id: 'brucelose', label: 'Brucelose', icon: '🔬' },
  { id: 'raiva', label: 'Raiva', icon: '🦇' },
  { id: 'clostridiose', label: 'Clostridiose', icon: '🧫' },
];

const otherSpecies = [
  { id: 'equinos', label: 'Equinos', icon: '🐴', count: 12 },
  { id: 'muares', label: 'Muares', icon: '🫏', count: 3 },
  { id: 'ovinos', label: 'Ovinos', icon: '🐑', count: 45 },
  { id: 'suinos', label: 'Suínos', icon: '🐷', count: 28 },
  { id: 'aves', label: 'Aves', icon: '🐔', count: 150 },
];

interface SaleItem {
  id: string;
  ageGroup: string;
  quantity: number;
  unitValue: number;
}

export default function LaunchForm({ type }: LaunchFormProps) {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Calcula matrizes disponíveis (fêmeas acima de 24 meses)
  const availableMatrizes = selectedProperty ? getAvailableMatrizes(selectedProperty.id) : 0;

  // Common fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Birth fields
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [quantity, setQuantity] = useState(1);

  // Death fields
  const [deathType, setDeathType] = useState<'natural' | 'consumo'>('natural');
  const [deathCause, setDeathCause] = useState('');
  const [ageGroup, setAgeGroup] = useState('0-4');
  const [hasPhoto, setHasPhoto] = useState(false);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

  // Sale fields
  const [destination, setDestination] = useState<'frigorifico' | 'produtor'>('frigorifico');
  const [buyer, setBuyer] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { id: '1', ageGroup: '24-36', quantity: 10, unitValue: 3500 }
  ]);
  const [gtaNumber, setGtaNumber] = useState('');

  // Vaccine fields
  const [campaign, setCampaign] = useState('');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [laboratory, setLaboratory] = useState('');

  // Other species
  const [speciesCounts, setSpeciesCounts] = useState<Record<string, number>>(
    Object.fromEntries(otherSpecies.map(s => [s.id, s.count]))
  );

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on type
    if (type === 'nascimento') {
        // VALIDAÇÃO CRÍTICA: nascimentos não podem exceder matrizes disponíveis
        if (quantity > availableMatrizes) {
          toast.error('Quantidade de nascimentos maior que o número de matrizes disponíveis', {
            description: `Você possui ${availableMatrizes} matrizes. Verifique o saldo antes de continuar.`,
            icon: '⚠️',
          });
          return;
        }
    } else if (type === 'mortalidade') {
      if (deathType === 'natural' && !hasPhoto) {
        toast.error('Foto obrigatória para morte natural', {
          description: 'Tire uma foto para registrar a ocorrência',
        });
        return;
      }
    }

    try {
      // Preparar dados do movimento
      const movementType = type === 'nascimento' ? 'birth' 
        : type === 'mortalidade' ? 'death'
        : type === 'venda' ? 'sale'
        : type === 'vacina' ? 'vaccine'
        : 'adjustment';

      const description = type === 'nascimento' ? `Nascimento - ${sex === 'male' ? 'Machos' : 'Fêmeas'}`
        : type === 'mortalidade' ? `${deathType === 'natural' ? 'Morte Natural' : 'Consumo'} - ${deathCause || 'Não especificado'}`
        : type === 'venda' ? `Venda para ${destination} - ${buyer}`
        : type === 'vacina' ? `Vacinação - ${campaign}`
        : notes || 'Ajuste manual';

      // Salvar movimento no IndexedDB
      const movementId = await saveMovement({
        propertyId: selectedProperty.id,
        type: movementType,
        date,
        quantity,
        sex: type === 'nascimento' ? sex : undefined,
        ageGroupId: type === 'nascimento' ? '0-4' : ageGroup,
        description,
        destination: type === 'venda' ? destination : undefined,
        value: type === 'venda' ? saleItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0) : undefined,
        gtaNumber: type === 'venda' && gtaNumber ? gtaNumber : undefined,
        photoUrl: photoDataUrl || undefined,
        cause: deathCause || undefined,
        birthDate: type === 'nascimento' ? date : undefined,
      });

      // Salvar foto se existir
      if (photoDataUrl) {
        const originalSize = photoDataUrl.length;
        const compressed = await compressImage(photoDataUrl, { 
          maxWidth: 1920, 
          maxHeight: 1080, 
          quality: 0.8 
        });
        const compressedSize = compressed.length;

        await savePhoto(movementId, compressed, originalSize, compressedSize);
      }

      // Toast de sucesso
      const isOnline = navigator.onLine;
      if (type === 'nascimento') {
        toast.success(`+${quantity} ${sex === 'male' ? 'machos' : 'fêmeas'} adicionados ao estoque`, {
          description: isOnline ? 'Nascimento registrado e sincronizado' : '⏳ Pendente sincronização',
          icon: '🐮',
        });
      } else if (type === 'mortalidade') {
        toast.success(`${quantity} animal(is) baixado(s) do estoque`, {
          description: deathType === 'natural' ? `Causa: ${deathCause}` : 'Consumo interno registrado',
          icon: '💀',
        });
      } else if (type === 'venda') {
        const totalValue = saleItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0);
        const totalQty = saleItems.reduce((sum, item) => sum + item.quantity, 0);
        toast.success(`Venda de ${totalQty} animais registrada`, {
          description: `Valor: R$ ${totalValue.toLocaleString('pt-BR')}`,
          icon: '🚚',
        });
      } else if (type === 'vacina') {
        const totalAnimals = selectedAgeGroups.length * 200; // Mock
        toast.success(`Vacinação registrada`, {
          description: `${campaign} aplicada em ~${totalAnimals} animais`,
          icon: '💉',
        });
      } else if (type === 'outras') {
        // Persistir ajustes de outras espécies no IndexedDB
        const previousCounts = Object.fromEntries(otherSpecies.map(s => [s.id, s.count]));
        
        for (const species of otherSpecies) {
          const newCount = speciesCounts[species.id] || 0;
          const previousCount = previousCounts[species.id] || 0;
          
          if (newCount !== previousCount) {
            // Salvar ajuste individual
            await saveSpeciesAdjustment({
              propertyId: selectedProperty.id,
              species: species.id,
              previousCount,
              newCount,
              reason: notes || 'Ajuste manual de saldo',
              createdAt: new Date(),
            });
            
            // Atualizar saldo
            await saveSpeciesBalance({
              propertyId: selectedProperty.id,
              species: species.id,
              count: newCount,
              lastUpdated: new Date(),
            });
          }
        }
        
        toast.success('Saldo de outras espécies atualizado', {
          icon: '🐴',
        });
      }

      navigate(-1);
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast.error('Erro ao salvar lançamento', {
        description: 'Tente novamente em alguns instantes',
      });
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'nascimento': return 'Nascimento';
      case 'mortalidade': return 'Mortalidade';
      case 'venda': return 'Venda';
      case 'vacina': return 'Vacinação';
      case 'outras': return 'Outras Espécies';
      default: return 'Lançamento';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'nascimento': return '🐮';
      case 'mortalidade': return '💀';
      case 'venda': return '🚚';
      case 'vacina': return '💉';
      case 'outras': return '🐴';
      default: return '📝';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'nascimento': return 'bg-success';
      case 'mortalidade': return 'bg-death';
      case 'venda': return 'bg-warning';
      case 'vacina': return 'bg-chart-3';
      default: return 'bg-muted';
    }
  };

  const addSaleItem = () => {
    setSaleItems([
      ...saleItems,
      { id: Date.now().toString(), ageGroup: '12-24', quantity: 1, unitValue: 3000 }
    ]);
  };

  const removeSaleItem = (id: string) => {
    setSaleItems(saleItems.filter(item => item.id !== id));
  };

  const updateSaleItem = (id: string, field: keyof SaleItem, value: unknown) => {
    setSaleItems(saleItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleAgeGroupSelection = (groupId: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const updateSpeciesCount = (speciesId: string, delta: number) => {
    setSpeciesCounts(prev => ({
      ...prev,
      [speciesId]: Math.max(0, (prev[speciesId] || 0) + delta)
    }));
  };

  const formContent = (
    <>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${getColor()} text-white -mx-4 -mt-4`}>
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-2xl">{getIcon()}</span>
          <h1 className="font-display font-bold text-lg">{getTitle()}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-32 -mx-4">
        {/* Date - Common */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <Label className="flex items-center gap-2 text-base font-semibold mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              Data do Lançamento
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 text-lg"
            />
          </CardContent>
        </Card>

        {/* NASCIMENTO */}
        {type === 'nascimento' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Sexo do Animal</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSex('male')}
                    className={cn(
                      'p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sex === 'male'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-4xl">♂️</span>
                    <span className="font-semibold text-lg">Macho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('female')}
                    className={cn(
                      'p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sex === 'female'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-4xl">♀️</span>
                    <span className="font-semibold text-lg">Fêmea</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="flex items-center gap-2 text-base font-semibold mb-4">
                  <Hash className="w-5 h-5 text-primary" />
                  Quantidade
                </Label>
                
                  {/* Badge informativo de matrizes disponíveis */}
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Matrizes disponíveis: <span className="font-bold">{availableMatrizes}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fêmeas acima de 24 meses aptas para reprodução
                    </p>
                  </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-xl text-xl"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  <div className="w-24 text-center">
                    <span className="text-5xl font-bold text-primary">{quantity}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-xl text-xl"
                      onClick={() => {
                        if (quantity < availableMatrizes) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.warning('Limite de matrizes atingido', {
                            description: `Você possui ${availableMatrizes} matrizes disponíveis`,
                          });
                        }
                      }}
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  ℹ️ Nascimentos são automaticamente registrados na faixa 0-4 meses
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* MORTALIDADE */}
        {type === 'mortalidade' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Tipo de Baixa</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeathType('natural')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      deathType === 'natural'
                        ? 'border-death bg-death/10'
                        : 'border-border hover:border-death/50'
                    )}
                  >
                    <span className="text-3xl">💀</span>
                    <span className="font-semibold">Morte Natural</span>
                    <span className="text-xs text-muted-foreground">Doença, acidente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeathType('consumo')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      deathType === 'consumo'
                        ? 'border-warning bg-warning/10'
                        : 'border-border hover:border-warning/50'
                    )}
                  >
                    <span className="text-3xl">🍖</span>
                    <span className="font-semibold">Consumo Interno</span>
                    <span className="text-xs text-muted-foreground">Abate subsistência</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-3 block">Faixa Etária</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id} className="text-base py-3">
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="flex items-center gap-2 text-base font-semibold mb-4">
                  <Hash className="w-5 h-5 text-primary" />
                  Quantidade
                </Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-xl"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  <div className="w-24 text-center">
                    <span className="text-5xl font-bold text-death">{quantity}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-xl"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {deathType === 'natural' && (
              <>
                <Card className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <Label className="text-base font-semibold mb-4 block">Causa da Morte</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {deathCauses.map((cause) => (
                        <button
                          key={cause.id}
                          type="button"
                          onClick={() => setDeathCause(cause.id)}
                          className={cn(
                            'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                            deathCause === cause.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="text-2xl">{cause.icon}</span>
                          <span className="text-xs font-medium">{cause.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-card border-l-4 border-l-warning">
                  <CardContent className="p-4">
                    <Label className="flex items-center gap-2 text-base font-semibold mb-3">
                      <Camera className="w-5 h-5 text-warning" />
                      Foto Obrigatória
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Para morte natural, é obrigatório registrar uma foto para auditoria.
                    </p>
                    
                      {!showCamera && !photoDataUrl && (
                        <Button 
                          type="button" 
                          variant="outline"
                          className="w-full h-20 border-dashed"
                          onClick={() => setShowCamera(true)}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Toque para tirar foto</span>
                          </div>
                        </Button>
                      )}

                      {showCamera && !photoDataUrl && (
                        <CameraCapture
                          onCapture={(dataUrl) => {
                            setPhotoDataUrl(dataUrl);
                            setHasPhoto(true);
                            setShowCamera(false);
                          }}
                          onCancel={() => setShowCamera(false)}
                        />
                      )}

                      {photoDataUrl && !showCamera && (
                        <div className="space-y-3">
                          <div className="relative rounded-lg overflow-hidden border-2 border-success">
                            <img 
                              src={photoDataUrl} 
                              alt="Foto capturada" 
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-success text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Foto Capturada
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setPhotoDataUrl(null);
                              setHasPhoto(false);
                              setShowCamera(true);
                            }}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Tirar Outra Foto
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {/* VENDA */}
        {type === 'venda' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Destino da Venda</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDestination('frigorifico')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      destination === 'frigorifico'
                        ? 'border-warning bg-warning/10'
                        : 'border-border hover:border-warning/50'
                    )}
                  >
                    <span className="text-3xl">🏭</span>
                    <span className="font-semibold">Frigorífico</span>
                    <span className="text-xs text-muted-foreground">Abate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestination('produtor')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      destination === 'produtor'
                        ? 'border-warning bg-warning/10'
                        : 'border-border hover:border-warning/50'
                    )}
                  >
                    <span className="text-3xl">🤝</span>
                    <span className="font-semibold">Produtor</span>
                    <span className="text-xs text-muted-foreground">Engorda/Cria</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-3 block">Comprador</Label>
                <Input
                  placeholder="Nome do frigorífico ou produtor"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  className="h-14 text-base"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Itens da Venda</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSaleItem}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {saleItems.map((item, index) => (
                    <div key={item.id} className="p-3 bg-muted/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        {saleItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSaleItem(item.id)}
                            className="text-destructive h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Select 
                        value={item.ageGroup} 
                        onValueChange={(v) => updateSaleItem(item.id, 'ageGroup', v)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Faixa etária" />
                        </SelectTrigger>
                        <SelectContent>
                          {ageGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Valor Unit. (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitValue}
                            onChange={(e) => updateSaleItem(item.id, 'unitValue', parseInt(e.target.value) || 0)}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-warning/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total da Venda:</span>
                    <span className="text-2xl font-bold text-warning">
                      R$ {saleItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {saleItems.reduce((sum, item) => sum + item.quantity, 0)} animais
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="flex items-center gap-2 text-base font-semibold mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  GTA (opcional)
                </Label>
                <Input
                  placeholder="GTA-2024-000000"
                  value={gtaNumber}
                  onChange={(e) => setGtaNumber(e.target.value)}
                  className="h-14 text-base"
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* VACINA */}
        {type === 'vacina' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Campanha de Vacinação</Label>
                <div className="grid grid-cols-2 gap-3">
                  {vaccineCampaigns.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCampaign(c.id)}
                      className={cn(
                        'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                        campaign === c.id
                          ? 'border-chart-3 bg-chart-3/10'
                          : 'border-border hover:border-chart-3/50'
                      )}
                    >
                      <span className="text-3xl">{c.icon}</span>
                      <span className="font-semibold text-sm">{c.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Lotes Vacinados</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione as faixas etárias que foram vacinadas:
                </p>
                <div className="space-y-2">
                  {ageGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleAgeGroupSelection(group.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                        selectedAgeGroups.includes(group.id)
                          ? 'border-chart-3 bg-chart-3/10'
                          : 'border-border hover:border-chart-3/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedAgeGroups.includes(group.id)}
                          className="data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
                        />
                        <span className="font-medium">{group.label}</span>
                      </div>
                      {selectedAgeGroups.includes(group.id) && (
                        <Check className="w-5 h-5 text-chart-3" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-3 block">Laboratório / Partida (opcional)</Label>
                <Input
                  placeholder="Ex: Ourofino - Lote 12345"
                  value={laboratory}
                  onChange={(e) => setLaboratory(e.target.value)}
                  className="h-14 text-base"
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* OUTRAS ESPÉCIES */}
        {type === 'outras' && (
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <Label className="text-base font-semibold mb-2 block">Saldo de Outras Espécies</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Ajuste o saldo atual de cada espécie usando os botões + e -
              </p>
              <div className="space-y-3">
                {otherSpecies.map((species) => (
                  <div 
                    key={species.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{species.icon}</span>
                      <span className="font-medium">{species.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => updateSpeciesCount(species.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center text-xl font-bold">
                        {speciesCounts[species.id]}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => updateSpeciesCount(species.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes - Common */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Observações (opcional)</Label>
            <Textarea
              placeholder="Adicione observações sobre este lançamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          onClick={handleSubmit}
          className={cn(
            "w-full h-14 text-lg font-semibold rounded-xl",
            type === 'nascimento' && 'bg-success hover:bg-success/90',
            type === 'mortalidade' && 'bg-death hover:bg-death/90',
            type === 'venda' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
            type === 'vacina' && 'bg-chart-3 hover:bg-chart-3/90',
          )}
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmar Lançamento
        </Button>
      </form>
    </>
  );

  if (isMobile) {
    return (
      <MobileLayout showBottomNav={true}>
        <div className="p-4">
          {formContent}
        </div>
      </MobileLayout>
    );
  }

  // Desktop fallback (LaunchForm is mostly mobile)
  return (
    <div className="min-h-screen bg-background p-4">
      {formContent}
    </div>
  );
}
