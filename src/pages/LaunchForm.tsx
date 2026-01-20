import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useQuery } from '@tanstack/react-query';
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
import { AGE_GROUP_BRACKETS } from '@/lib/age-groups';
import { cn } from '@/lib/utils';
import MobileLayout from '@/components/layout/MobileLayout';
import { 
  saveMovement, 
  savePhoto,
  getInitialStock,
  getMovementsByProperty,
} from '@/lib/indexeddb';
import { compressImage } from '@/lib/image-compression';
import { apiClient } from '@/lib/api-client';
import { LivestockMirrorDTO } from '@/types';
import { queryKeys } from '@/lib/react-query/queryKeys';
import { useUpdateOtherSpeciesBalances } from '@/hooks/mutations/useUpdateOtherSpeciesBalances';

import CameraCapture from '@/components/CameraCapture';
interface LaunchFormProps {
  type: 'nascimento' | 'mortalidade' | 'venda' | 'compra' | 'vacina' | 'outras';
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
  { id: 'equinos', label: 'Equinos', icon: '🐴' },
  { id: 'muares', label: 'Muares', icon: '🫏' },
  { id: 'ovinos', label: 'Ovinos', icon: '🐑' },
  { id: 'suinos', label: 'Suínos', icon: '🐷' },
  { id: 'aves', label: 'Aves', icon: '🐔' },
];

type AgeGroupId = (typeof AGE_GROUP_BRACKETS)[number]['id'];

const ageGroups: Array<{ id: AgeGroupId; label: string }> = AGE_GROUP_BRACKETS.map((bracket) => ({
  id: bracket.id,
  label: bracket.label,
}));

const normalizeAgeGroupId = (raw: unknown): AgeGroupId | null => {
  if (typeof raw !== 'string' || !raw) return null;
  if (raw.endsWith('m')) return raw as AgeGroupId;

  const directMap: Record<string, AgeGroupId> = {
    '0-4': '0-4m',
    '5-12': '5-12m',
    '12-24': '13-24m',
    '13-24': '13-24m',
    '24-36': '25-36m',
    '25-36': '25-36m',
    '36+': '36+m',
  };

  return directMap[raw] ?? null;
};

const normalizeSex = (raw: unknown): 'male' | 'female' | null => {
  if (raw === 'male' || raw === 'female') return raw;
  if (raw === 'macho') return 'male';
  if (raw === 'femea' || raw === 'fêmea') return 'female';
  return null;
};

interface SaleItem {
  id: string;
  ageGroup: string;
  quantity: number;
  unitValue: number;
}

interface PurchaseItem {
  id: string;
  ageGroupId: string;
  quantity: number;
}

export default function LaunchForm({ type }: LaunchFormProps) {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Common fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Birth fields
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [quantity, setQuantity] = useState(1);

  const [sexOther, setSexOther] = useState<'male' | 'female' | null>(null);

  // Death fields
  const [deathType, setDeathType] = useState<'natural' | 'consumo'>('natural');
  const [deathCause, setDeathCause] = useState('');
  const [ageGroup, setAgeGroup] = useState('0-4m');
  const [hasPhoto, setHasPhoto] = useState(false);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

  // Sale fields
  const [destination, setDestination] = useState<'frigorifico' | 'produtor'>('frigorifico');
  const [buyer, setBuyer] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { id: '1', ageGroup: '25-36m', quantity: 10, unitValue: 3500 }
  ]);
  const [gtaNumber, setGtaNumber] = useState('');

  // Purchase fields
  const [supplier, setSupplier] = useState('');
  const [purchaseSex, setPurchaseSex] = useState<'male' | 'female'>('male');
  const [purchaseTotalValue, setPurchaseTotalValue] = useState<number>(0);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { id: '1', ageGroupId: '13-24m', quantity: 1 },
  ]);

  // Vaccine fields
  const [campaign, setCampaign] = useState('');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [laboratory, setLaboratory] = useState('');

  // Other species
  const [speciesCountsDraft, setSpeciesCountsDraft] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!selectedProperty) {
      navigate('/login');
    }
  }, [selectedProperty, navigate]);

  const availabilityQuery = useQuery({
    queryKey: selectedProperty?.id
      ? ['livestock', 'availability', selectedProperty.id]
      : ['livestock', 'availability', 'no-property'],
    enabled: Boolean(selectedProperty?.id),
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!selectedProperty?.id) {
        return {
          availableMatrizes: 0,
          totalByAge: {} as Record<string, number>,
          byAgeSex: {} as Record<string, { male: number; female: number }>,
        };
      }

      const ageGroupIds: AgeGroupId[] = ageGroups.map((g) => g.id);
      const totalByAge: Record<string, number> = Object.fromEntries(ageGroupIds.map((id) => [id, 0]));
      const maleByAge: Record<string, number> = Object.fromEntries(ageGroupIds.map((id) => [id, 0]));
      const femaleByAge: Record<string, number> = Object.fromEntries(ageGroupIds.map((id) => [id, 0]));

      const fillFromMirror = (mirror: LivestockMirrorDTO) => {
        for (const row of mirror?.balances ?? []) {
          const ageId = normalizeAgeGroupId((row as any).ageGroupId);
          if (!ageId) continue;

          maleByAge[ageId] = Number((row as any).male?.currentBalance ?? 0);
          femaleByAge[ageId] = Number((row as any).female?.currentBalance ?? 0);
          totalByAge[ageId] = (maleByAge[ageId] ?? 0) + (femaleByAge[ageId] ?? 0);
        }
      };

      try {
        const mirror = await apiClient.get<LivestockMirrorDTO>(`/rebanho/${selectedProperty.id}/espelho?months=1`);
        fillFromMirror(mirror);
      } catch (e) {
        const [initialStock, movements] = await Promise.all([
          getInitialStock(selectedProperty.id),
          getMovementsByProperty(selectedProperty.id),
        ]);

        const ageGroupIdSet = new Set<AgeGroupId>(ageGroupIds);

        for (const entry of initialStock) {
          if (entry.species !== 'bovino') continue;
          const ageId = normalizeAgeGroupId(entry.ageGroupId);
          if (!ageId) continue;
          if (!ageGroupIdSet.has(ageId)) continue;

          const qty = Number(entry.quantity) || 0;
          if (qty <= 0) continue;

          totalByAge[ageId] += qty;
          const sex = normalizeSex(entry.sex);
          if (sex === 'male') {
            maleByAge[ageId] += qty;
          } else if (sex === 'female') {
            femaleByAge[ageId] += qty;
          }
        }

        for (const m of movements) {
          const ageId = normalizeAgeGroupId(m.ageGroupId);
          if (!ageId) continue;
          if (!ageGroupIdSet.has(ageId)) continue;
          const qty = Number(m.quantity) || 0;
          if (qty <= 0) continue;
          const sex = normalizeSex(m.sex);

          const applyDelta = (delta: number) => {
            totalByAge[ageId] = Math.max(0, totalByAge[ageId] + delta);
            if (sex === 'male') {
              maleByAge[ageId] = Math.max(0, maleByAge[ageId] + delta);
            } else if (sex === 'female') {
              femaleByAge[ageId] = Math.max(0, femaleByAge[ageId] + delta);
            }
          };

          if (m.type === 'birth' || m.type === 'purchase') {
            applyDelta(qty);
          } else if (m.type === 'sale' || m.type === 'death') {
            applyDelta(-qty);
          } else if (m.type === 'adjustment') {
            applyDelta(qty);
          }
        }
      }

      const availableMatrizes = (femaleByAge['25-36m'] ?? 0) + (femaleByAge['36+m'] ?? 0);
      const byAgeSex = Object.fromEntries(
        ageGroupIds.map((id) => [
          id,
          {
            male: Math.min(maleByAge[id] ?? 0, totalByAge[id] ?? 0),
            female: Math.min(femaleByAge[id] ?? 0, totalByAge[id] ?? 0),
          },
        ]),
      );

      return { availableMatrizes, totalByAge, byAgeSex };
    },
  });

  const availableMatrizes = availabilityQuery.data?.availableMatrizes ?? 0;
  const availableByAgeTotal = availabilityQuery.data?.totalByAge ?? {};
  const availableByAgeSex = availabilityQuery.data?.byAgeSex ?? {};

  const otherSpeciesMirrorQuery = useQuery({
    queryKey: selectedProperty?.id
      ? queryKeys.livestock.otherSpecies(selectedProperty.id, 1)
      : ['livestock', 'other-species', 'no-property'],
    enabled: Boolean(selectedProperty?.id && type === 'outras'),
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!selectedProperty?.id) {
        return { balances: [] as any[] };
      }
      return apiClient.get<any>(`/rebanho/${selectedProperty.id}/outras-especies?months=1`);
    },
  });

  const serverSpeciesCounts = useMemo(() => {
    const base: Record<string, number> = Object.fromEntries(otherSpecies.map((s) => [s.id, 0]));
    const mirror = otherSpeciesMirrorQuery.data;
    for (const row of mirror?.balances ?? []) {
      const key = String(row.speciesId ?? '').toLowerCase();
      if (!key) continue;
      base[key] = Number(row.currentBalance ?? 0);
    }
    return base;
  }, [otherSpeciesMirrorQuery.data]);

  const speciesCounts = speciesCountsDraft ?? serverSpeciesCounts;
  const updateOtherSpeciesBalances = useUpdateOtherSpeciesBalances(selectedProperty?.id);

  const getAvailableForAgeGroup = (ageGroupId: string) => {
    const total = availableByAgeTotal[ageGroupId] ?? 0;
    if (sexOther === 'male') {
      return availableByAgeSex[ageGroupId]?.male ?? Math.max(0, total);
    }
    if (sexOther === 'female') {
      return availableByAgeSex[ageGroupId]?.female ?? Math.max(0, total);
    }
    return Math.max(0, total);
  };

  if (!selectedProperty) {
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
      const availableForAge = getAvailableForAgeGroup(ageGroup);
      if (quantity > availableForAge) {
        toast.error('Quantidade maior que o estoque disponível', {
          description: `Disponível na faixa ${ageGroup}: ${availableForAge}. Ajuste a quantidade para continuar.`,
          icon: '⚠️',
        });
        return;
      }
    } else if (type === 'venda') {
      const qtyByAge = saleItems.reduce<Record<string, number>>((acc, item) => {
        const age = item.ageGroup;
        const qty = Number(item.quantity) || 0;
        acc[age] = (acc[age] ?? 0) + qty;
        return acc;
      }, {});

      for (const [age, qty] of Object.entries(qtyByAge)) {
        const availableForAge = getAvailableForAgeGroup(age);
        if (qty > availableForAge) {
          toast.error('Quantidade maior que o estoque disponível', {
            description: `Na faixa ${age}, você tentou vender ${qty}, mas só tem ${availableForAge} disponível.`,
            icon: '⚠️',
          });
          return;
        }
      }
    } else if (type === 'vacina') {
      const invalid = selectedAgeGroups.find((age) => getAvailableForAgeGroup(age) <= 0);
      if (invalid) {
        toast.error('Faixa etária sem estoque disponível', {
          description: 'Remova lotes sem animais no estoque para continuar.',
          icon: '⚠️',
        });
        return;
      }
    }

    try {
      let compressedPhotoBlob: Blob | null = null;

      if (photoDataUrl) {
        const MAX_BYTES = 300 * 1024;
        const attempts = [
          { maxWidth: 1280, maxHeight: 720, quality: 0.6 },
          { maxWidth: 1280, maxHeight: 720, quality: 0.5 },
          { maxWidth: 1024, maxHeight: 576, quality: 0.5 },
          { maxWidth: 960, maxHeight: 540, quality: 0.45 },
        ];

        let bestBlob: Blob | null = null;

        for (const a of attempts) {
          const compressedDataUrl = await compressImage(photoDataUrl, {
            maxWidth: a.maxWidth,
            maxHeight: a.maxHeight,
            quality: a.quality,
            mimeType: 'image/jpeg',
          });

          const response = await fetch(compressedDataUrl);
          const blob = await response.blob();

          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
          }

          if (blob.size <= MAX_BYTES) {
            bestBlob = blob;
            break;
          }
        }

        if (!bestBlob || bestBlob.size > MAX_BYTES) {
          toast.error('Foto muito grande para auditoria', {
            description: 'Não foi possível reduzir para 300 KB mantendo legibilidade. Tente uma foto mais próxima/iluminada.',
          });
          return;
        }

        compressedPhotoBlob = bestBlob;
      }

      if (type === 'compra') {
        const cleanedItems = purchaseItems
          .map((it) => ({ ...it, quantity: Number(it.quantity) || 0 }))
          .filter((it) => it.quantity > 0);

        if (cleanedItems.length === 0) {
          toast.error('Adicione pelo menos uma faixa etária com quantidade', {
            description: 'Inclua uma faixa e informe a quantidade para continuar.',
          });
          return;
        }

        const totalQty = cleanedItems.reduce((sum, it) => sum + it.quantity, 0);
        const baseDescription = `Compra${supplier ? ` - ${supplier}` : ''}${notes ? ` | Obs: ${notes}` : ''}`;

        for (const it of cleanedItems) {
          const proportionalValue = totalQty > 0 ? (purchaseTotalValue * it.quantity) / totalQty : 0;

          await saveMovement({
            propertyId: selectedProperty.id,
            type: 'purchase',
            date,
            quantity: it.quantity,
            sex: purchaseSex,
            ageGroupId: it.ageGroupId,
            description: baseDescription,
            destination: supplier || undefined,
            value: purchaseTotalValue > 0 ? proportionalValue : undefined,
            gtaNumber: undefined,
            photoUrl: undefined,
            cause: undefined,
            birthDate: undefined,
            createdAt: new Date().toISOString(),
          });
        }

        toast.success(`Compra de ${totalQty} animal(is) registrada`, {
          description: purchaseTotalValue > 0 ? `Valor: R$ ${purchaseTotalValue.toLocaleString('pt-BR')}` : undefined,
          icon: '🛒',
        });

        navigate(-1);
        return;
      }

      // Preparar dados do movimento
      const movementType = type === 'nascimento' ? 'birth' 
        : type === 'mortalidade' ? 'death'
        : type === 'venda' ? 'sale'
        : type === 'vacina' ? 'vaccine'
        : 'adjustment';

      const baseDescription = type === 'nascimento' ? `Nascimento - ${sex === 'male' ? 'Machos' : 'Fêmeas'}`
        : type === 'mortalidade' ? `${deathType === 'natural' ? 'Morte Natural' : 'Consumo'} - ${deathCause || 'Não especificado'}`
        : type === 'venda' ? `Venda para ${destination} - ${buyer}`
        : type === 'vacina' ? `Vacinação - ${campaign}${laboratory ? ` - ${laboratory}` : ''}`
        : 'Ajuste manual';

      const description = `${baseDescription}${notes ? ` | Obs: ${notes}` : ''}`;

      // Salvar movimento no IndexedDB
      const movement = await saveMovement({
        propertyId: selectedProperty.id,
        type: movementType,
        date,
        quantity,
        sex: type === 'nascimento' ? sex : sexOther ?? undefined,
        ageGroupId: type === 'nascimento' ? '0-4m' : ageGroup,
        description,
        destination: type === 'venda' ? destination : undefined,
        value: type === 'venda'
          ? saleItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0)
          : undefined,
        gtaNumber: type === 'venda' && gtaNumber ? gtaNumber : undefined,
        photoUrl: undefined,
        cause: deathCause || undefined,
        birthDate: type === 'nascimento' ? date : undefined,
        createdAt: new Date().toISOString(),
      });
      const movementId = movement.id;

      // Salvar foto se existir
      if (compressedPhotoBlob) {
        await savePhoto(movementId, selectedProperty.id, compressedPhotoBlob, compressedPhotoBlob.size);
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
        if (!navigator.onLine) {
          toast.error('Sem conexão', {
            description: 'Conecte-se à internet para atualizar o saldo no servidor.',
          });
          return;
        }

        const payload = {
          date,
          notes,
          balances: otherSpecies.map((s) => ({
            speciesId: s.id,
            count: speciesCounts[s.id] ?? 0,
          })),
        };

        await updateOtherSpeciesBalances.mutateAsync(payload);

        toast.success('Saldo de outras espécies atualizado', { icon: '🐾' });
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
      case 'compra': return 'Compra';
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
      case 'compra': return '🛒';
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
      case 'compra': return 'bg-primary';
      case 'vacina': return 'bg-chart-3';
      default: return 'bg-muted';
    }
  };

  const addSaleItem = () => {
    setSaleItems([
      ...saleItems,
      { id: Date.now().toString(), ageGroup: '13-24m', quantity: 1, unitValue: 3000 }
    ]);
  };

  const removeSaleItem = (id: string) => {
    setSaleItems(saleItems.filter(item => item.id !== id));
  };

  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      { id: Date.now().toString(), ageGroupId: '13-24m', quantity: 1 },
    ]);
  };

  const removePurchaseItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter((it) => it.id !== id));
  };

  const updatePurchaseItem = (id: string, patch: Partial<PurchaseItem>) => {
    setPurchaseItems(purchaseItems.map((it) => (it.id === id ? { ...it, ...patch } : it)));
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
    setSpeciesCountsDraft((prev) => {
      const current = prev ?? serverSpeciesCounts;
      return {
        ...current,
        [speciesId]: Math.max(0, (current[speciesId] || 0) + delta),
      };
    });
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

        {/* COMPRA */}
        {type === 'compra' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-3 block">Fornecedor (opcional)</Label>
                <Input
                  placeholder="Nome do vendedor / leilão / fazenda"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-14 text-base"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Sexo do Animal</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPurchaseSex('male')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      purchaseSex === 'male'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♂️</span>
                    <span className="font-semibold">Macho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseSex('female')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      purchaseSex === 'female'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♀️</span>
                    <span className="font-semibold">Fêmea</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="flex items-center gap-2 text-base font-semibold mb-3">
                  <Hash className="w-5 h-5 text-primary" />
                  Faixas Etárias e Quantidades
                </Label>
                <div className="space-y-3">
                  {purchaseItems.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-xl border bg-muted/30"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="font-semibold">Faixa {idx + 1}</span>
                        {purchaseItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => removePurchaseItem(it.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Faixa Etária</Label>
                          <Select
                            value={it.ageGroupId}
                            onValueChange={(value) => updatePurchaseItem(it.id, { ageGroupId: value })}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione a faixa" />
                            </SelectTrigger>
                            <SelectContent>
                              {ageGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">Quantidade</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-12 w-12 rounded-xl"
                              onClick={() =>
                                updatePurchaseItem(it.id, {
                                  quantity: Math.max(1, (Number(it.quantity) || 0) - 1),
                                })
                              }
                            >
                              <Minus className="w-5 h-5" />
                            </Button>

                            <Input
                              type="number"
                              min="1"
                              inputMode="numeric"
                              value={it.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(it.id, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="h-12 text-center"
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-12 w-12 rounded-xl"
                              onClick={() =>
                                updatePurchaseItem(it.id, {
                                  quantity: (Number(it.quantity) || 0) + 1,
                                })
                              }
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 h-12"
                  onClick={addPurchaseItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar faixa etária
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-3 block">Valor Total (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={purchaseTotalValue}
                  onChange={(e) => setPurchaseTotalValue(Number(e.target.value) || 0)}
                  className="h-14 text-base"
                />
                <div className="mt-3 p-3 bg-primary/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Custo por cabeça:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {(purchaseItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0) > 0 ? purchaseTotalValue / purchaseItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0) : 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* MORTALIDADE */}
        {type === 'mortalidade' && (
          <>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <Label className="text-base font-semibold mb-4 block">Sexo do Animal (opcional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSexOther('male')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'male'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♂️</span>
                    <span className="font-semibold">Macho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther('female')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'female'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♀️</span>
                    <span className="font-semibold">Fêmea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther(null)}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === null
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">➖</span>
                    <span className="font-semibold">Não informar</span>
                  </button>
                </div>
              </CardContent>
            </Card>

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

                <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-sm font-medium">
                    Disponível na faixa: <span className="font-bold">{getAvailableForAgeGroup(ageGroup)}</span>
                  </p>
                </div>

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
                    onClick={() => {
                      const availableForAge = getAvailableForAgeGroup(ageGroup);
                      if (quantity < availableForAge) {
                        setQuantity(quantity + 1);
                      } else {
                        toast.warning('Limite do estoque atingido', {
                          description: `Disponível na faixa: ${availableForAge}`,
                        });
                      }
                    }}
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
                      Foto (opcional)
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Se possível, registre uma foto para auditoria.
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
                <Label className="text-base font-semibold mb-4 block">Sexo do Animal (opcional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSexOther('male')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'male'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♂️</span>
                    <span className="font-semibold">Macho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther('female')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'female'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♀️</span>
                    <span className="font-semibold">Fêmea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther(null)}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === null
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">➖</span>
                    <span className="font-semibold">Não informar</span>
                  </button>
                </div>
              </CardContent>
            </Card>

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

                      <div className="-mt-1 text-xs text-muted-foreground">
                        Disponível nesta faixa: {getAvailableForAgeGroup(item.ageGroup)}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value) || 1;
                              const availableForAge = getAvailableForAgeGroup(item.ageGroup);
                              updateSaleItem(item.id, 'quantity', Math.min(raw, Math.max(1, availableForAge)));
                            }}
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
                <Label className="text-base font-semibold mb-4 block">Sexo do Animal (opcional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSexOther('male')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'male'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♂️</span>
                    <span className="font-semibold">Macho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther('female')}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === 'female'
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">♀️</span>
                    <span className="font-semibold">Fêmea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSexOther(null)}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      sexOther === null
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-3xl">➖</span>
                    <span className="font-semibold">Não informar</span>
                  </button>
                </div>
              </CardContent>
            </Card>

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
                    (() => {
                      const availableForAge = getAvailableForAgeGroup(group.id);
                      const disabled = availableForAge <= 0;
                      return (
                    <div
                      key={group.id}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all',
                        selectedAgeGroups.includes(group.id)
                          ? 'border-chart-3 bg-chart-3/10'
                          : 'border-border hover:border-chart-3/50'
                      )}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <Checkbox 
                          checked={selectedAgeGroups.includes(group.id)}
                          disabled={disabled}
                          onCheckedChange={() => {
                            if (disabled) {
                              toast.warning('Sem estoque disponível nesta faixa', {
                                description: `${group.label}: ${availableForAge} disponível`,
                              });
                              return;
                            }
                            toggleAgeGroupSelection(group.id);
                          }}
                          className="data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
                        />
                        <span className={cn('font-medium', disabled && 'text-muted-foreground')}>
                          {group.label} (disp: {availableForAge})
                        </span>
                      </label>
                      {selectedAgeGroups.includes(group.id) && (
                        <Check className="w-5 h-5 text-chart-3" />
                      )}
                    </div>
                      );
                    })()
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
            type === 'compra' && 'bg-primary hover:bg-primary/90 text-primary-foreground',
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
