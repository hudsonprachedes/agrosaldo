import React, { useMemo, useState, useEffect } from 'react';
import { PreferencesDTO, useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  MapPin,
  User,
  CreditCard,
  Receipt,
  Settings,
  Edit2,
  Save,
  Mail,
  Phone,
  FileText,
  Beef,
  Plus,
  Trash2,
  Check,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchViaCepWithCache } from '@/lib/cep';
import { apiClient } from '@/lib/api-client';
import { PropertyDTO } from '@/types';
import { usePropertiesMine } from '@/hooks/queries/usePropertiesMine';
import { usePlansCatalog } from '@/hooks/queries/usePlansCatalog';
import { useUpdateProperty } from '@/hooks/mutations/useUpdateProperty';
import { useSubscriptionMine } from '@/hooks/queries/useSubscriptionMine';
import { useSubscriptionPaymentsMine } from '@/hooks/queries/useSubscriptionPaymentsMine';
import { useUpsertPropertyMine } from '@/hooks/mutations/useUpsertPropertyMine';
import { useDeletePropertyMine } from '@/hooks/mutations/useDeletePropertyMine';
import { useUpdateSubscriptionMine } from '@/hooks/mutations/useUpdateSubscriptionMine';

type PropertyForm = {
  name: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  viaAcesso?: string;
  comunidade?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  areaTotal?: number;
  areaPastagemNatural?: number;
  areaPastagemCultivada?: number;
};

type PlanId = 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';

type PlanCatalogItem = {
  id: PlanId;
  name: string;
  price: number;
  maxCattle: number;
};

type SubscriptionDTO = {
  id: string;
  usuarioId: string;
  plano: PlanId;
  status: 'ativa' | 'cancelada' | 'inadimplente' | string;
  valorMensal?: number | null;
  inicioEm: string;
  fimEm?: string | null;
  criadoEm: string;
  atualizadoEm: string;
} | null;

type PaymentMethod = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'outros';

type PaymentHistoryItem = {
  id: string;
  paidAt: string;
  amount: number;
  method: PaymentMethod;
  planId: PlanId;
  cattleCountAtPayment: number;
};

type PaymentHistoryApiItem = {
  id: string;
  paidAt: string;
  amount: number;
  method: string;
  planId: string;
  cattleCountAtPayment: number;
};

export default function MinhaFazenda() {
  const { user, selectedProperty, refreshMe, preferences, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('propriedade');

  const propertiesQuery = usePropertiesMine(Boolean(user?.id));
  const plansCatalogQuery = usePlansCatalog(Boolean(user?.id));
  const subscriptionQuery = useSubscriptionMine(Boolean(user?.id));
  const paymentHistoryQuery = useSubscriptionPaymentsMine(Boolean(user?.id));

  const properties = propertiesQuery.data ?? [];
  const plansCatalog = (plansCatalogQuery.data ?? []) as PlanCatalogItem[];
  const subscription = (subscriptionQuery.data ?? null) as SubscriptionDTO;

  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyDTO | null>(null);
  const [propertyForm, setPropertyForm] = useState<Partial<PropertyForm>>({});

  // Produtor form
  const [isEditingProdutor, setIsEditingProdutor] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [produtorForm, setProdutorForm] = useState({
    name: user?.name || '',
    cpfCnpj: user?.cpfCnpj || '',
    inscricaoEstadual: '',
    celular: '(44) 99114-7084',
    email: user?.email || '',
    cep: '',
    endereco: '',
    bairro: '',
    municipio: '',
    estado: '',
  });

  // Settings
  const [settings, setSettings] = useState<PreferencesDTO>({
    notificacoes: true,
    sincronizacaoAuto: true,
    modoEscuro: false,
    notificacaoNascimento: true,
    notificacaoMorte: true,
    notificacaoVacina: true,
  });

  const paymentHistory: PaymentHistoryItem[] = useMemo(() => {
    const data = (paymentHistoryQuery.data ?? []) as PaymentHistoryApiItem[];

    return (data ?? [])
      .map((item) => {
        const planIdLower = String(item.planId ?? '').toLowerCase() as PlanId;
        const methodLower = String(item.method ?? '').toLowerCase() as PaymentMethod;

        const planId: PlanId =
          planIdLower === 'porteira' ||
          planIdLower === 'piquete' ||
          planIdLower === 'retiro' ||
          planIdLower === 'estancia' ||
          planIdLower === 'barao'
            ? planIdLower
            : 'porteira';

        const method: PaymentMethod =
          methodLower === 'pix' ||
          methodLower === 'cartao' ||
          methodLower === 'boleto' ||
          methodLower === 'transferencia' ||
          methodLower === 'outros'
            ? methodLower
            : 'outros';

        return {
          id: item.id,
          paidAt: item.paidAt,
          amount: item.amount,
          method,
          planId,
          cattleCountAtPayment: item.cattleCountAtPayment ?? 0,
        };
      })
      .filter((x) => Boolean(x.id) && Boolean(x.paidAt));
  }, [paymentHistoryQuery.data]);

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const upsertProperty = useUpsertPropertyMine();
  const deleteProperty = useDeletePropertyMine();
  const updateSubscription = useUpdateSubscriptionMine();
  const updatePropertyMutation = useUpdateProperty();

  // Password form (local-only mock)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('As senhas não conferem');
      return;
    }
    // Em produção: chamar API para alterar senha
    setPasswordForm({ current: '', next: '', confirm: '' });
    toast.success('Senha alterada com sucesso');
  };

  if (!user || !selectedProperty) {
    return <Navigate to="/selecionar-propriedade" replace />;
  }

  const totalCattleAllProperties = properties.reduce((total, prop) => total + (prop.cattleCount ?? 0), 0);

  const subscriptionPlanId: PlanId | null = subscription?.plano ?? null;
  const currentPlan = subscriptionPlanId
    ? (plansCatalog.find((p) => p.id === subscriptionPlanId) ?? null)
    : null;
  const planMaxCattle = currentPlan?.maxCattle ?? 0;
  const subscriptionStatus = (subscription?.status ?? '').toLowerCase();
  const hasSubscription = Boolean(subscription?.id);
  const isSubscriptionActive = hasSubscription && subscriptionStatus === 'ativa';

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));

  const methodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return 'Pix';
      case 'cartao':
        return 'Cartão';
      case 'boleto':
        return 'Boleto';
      case 'transferencia':
        return 'Transferência';
      default:
        return 'Outros';
    }
  };

  const planLabel = (planId: PlanId) => plansCatalog.find((p) => p.id === planId)?.name ?? planId;

  const paymentHistorySorted = paymentHistory
    .slice()
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  const paymentHistorySection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Histórico de Pagamentos
        </h3>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Cabeças na época</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentHistorySorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum pagamento registrado.
                </TableCell>
              </TableRow>
            ) : (
              paymentHistorySorted.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{formatDate(item.paidAt)}</TableCell>
                  <TableCell>{formatMoney(item.amount)}</TableCell>
                  <TableCell>{methodLabel(item.method)}</TableCell>
                  <TableCell>{planLabel(item.planId)}</TableCell>
                  <TableCell className="text-right">{item.cattleCountAtPayment.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const planRank = (planId: PlanId | null | undefined) => {
    const order: PlanId[] = ['porteira', 'piquete', 'retiro', 'estancia', 'barao'];
    if (!planId) return 0;
    const idx = order.indexOf(planId);
    return idx === -1 ? 0 : idx;
  };

  const handleSubscribeOrUpgrade = async (planId: PlanId) => {
    try {
      await updateSubscription.mutateAsync(planId);
      toast.success('Plano atualizado com sucesso');
    } catch (error: unknown) {
      const maybe = error as Record<string, unknown>;
      const response = maybe.response as Record<string, unknown> | undefined;
      const data = response?.data as Record<string, unknown> | undefined;
      const msg = data?.message;
      const message =
        typeof msg === 'string'
          ? msg
          : 'Não foi possível atualizar o plano. Tente novamente.';
      toast.error(message);
    }
  };

  const handlePlanChangeClick = async (planId: PlanId) => {
    const current = subscription?.plano ?? null;
    const isUpgrade = planRank(planId) > planRank(current);
    if (!isUpgrade && current) {
      toast.info('Downgrade não é automático. Solicite pelo suporte/WhatsApp.');
      return;
    }
    await handleSubscribeOrUpgrade(planId);
  };

  // Property CRUD handlers
  const handleAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm({});
    setIsPropertyDialogOpen(true);
  };

  const handleEditProperty = (property: PropertyDTO) => {
    setEditingProperty(property);
    setPropertyForm({
      name: property.name,
      cep: property.cep,
      logradouro: property.street,
      numero: property.number,
      complemento: property.complement,
      bairro: property.district,
      viaAcesso: property.accessRoute,
      comunidade: property.community,
      municipio: property.city,
      uf: property.state,
      areaTotal: property.totalArea,
      areaPastagemNatural: property.pastureNaturalHa,
      areaPastagemCultivada: property.pastureCultivatedHa,
    });
    setIsPropertyDialogOpen(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (properties.length === 1) {
      toast.error('Você precisa ter pelo menos uma propriedade');
      return;
    }

    try {
      await deleteProperty.mutateAsync(propertyId);
      await refreshMe();
      toast.success('Propriedade removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover propriedade:', error);
      toast.error('Erro ao remover propriedade');
    }
  };

  const handleSaveProperty = async () => {
    if (!propertyForm.name || !propertyForm.municipio || !propertyForm.uf) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const payload = {
      name: propertyForm.name,
      city: propertyForm.municipio,
      state: propertyForm.uf,
      cep: propertyForm.cep,
      street: propertyForm.logradouro,
      number: propertyForm.numero,
      complement: propertyForm.complemento,
      district: propertyForm.bairro,
      accessRoute: propertyForm.viaAcesso,
      community: propertyForm.comunidade,
      totalArea: Number(propertyForm.areaTotal ?? 0),
      cultivatedArea: 0,
      naturalArea: 0,
    };

    try {
      await upsertProperty.mutateAsync({ id: editingProperty?.id, payload });
      toast.success(editingProperty?.id ? 'Propriedade atualizada com sucesso' : 'Propriedade cadastrada com sucesso');

      setIsPropertyDialogOpen(false);
      await refreshMe();
    } catch (error) {
      console.error('Erro ao salvar propriedade:', error);
      toast.error('Erro ao salvar propriedade');
    }
  };

  // CEP Search handler
  const handleSearchCEP = async (cep: string, target: 'property' | 'produtor') => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setSearchingCEP(true);
    try {
      const data = await fetchViaCepWithCache(cleanCEP);
      if (data.found) {
        if (target === 'property') {
          setPropertyForm({
            ...propertyForm,
            logradouro: data.address,
            bairro: data.neighborhood,
            municipio: data.city,
            uf: data.uf,
          });
        } else {
          setProdutorForm({
            ...produtorForm,
            endereco: data.address,
            bairro: data.neighborhood,
            municipio: data.city,
            estado: data.uf,
          });
        }
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingCEP(false);
    }
  };

  const handleSaveProdutor = async () => {
    if (!selectedProperty?.id) {
      toast.error('Propriedade não selecionada');
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        id: selectedProperty.id,
        data: {
          inscricaoEstadual: produtorForm.inscricaoEstadual || null,
        },
      });
      
      setIsEditingProdutor(false);
      toast.success('Dados do produtor atualizados');
    } catch (error) {
      console.error('Erro ao salvar dados do produtor:', error);
      toast.error('Erro ao salvar dados do produtor');
    }
  };

  const handleSavePreferences = async () => {
    try {
      const saved = await updatePreferences(settings);
      if (!saved) {
        toast.error('Erro ao salvar configurações');
        return;
      }
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">🏡</span>
            Minha Fazenda
          </h1>
          <p className="text-muted-foreground">
            Gerencie os dados da sua propriedade e conta
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="propriedade" className="py-3">
            <MapPin className="w-4 h-4 mr-2" />
            {!isMobile && 'Propriedade'}
          </TabsTrigger>
          <TabsTrigger value="produtor" className="py-3">
            <User className="w-4 h-4 mr-2" />
            {!isMobile && 'Produtor'}
          </TabsTrigger>
          <TabsTrigger value="plano" className="py-3">
            <CreditCard className="w-4 h-4 mr-2" />
            {!isMobile && 'Plano'}
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="py-3">
            <Settings className="w-4 h-4 mr-2" />
            {!isMobile && 'Config'}
          </TabsTrigger>
        </TabsList>

        {/* ABA PROPRIEDADE - CRUD */}
        <TabsContent value="propriedade" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Minhas Propriedades</CardTitle>
                <CardDescription>Gerencie todas as suas propriedades</CardDescription>
              </div>
              <Button onClick={handleAddProperty} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Propriedade
              </Button>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-tight break-words">
                            {property.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {property.city}/{property.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={properties.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Área total</p>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {property.totalArea} ha
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Cabeças</p>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {(property.cattleCount ?? 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Município/UF</TableHead>
                      <TableHead>Área Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.name}</TableCell>
                        <TableCell>{property.city}/{property.state}</TableCell>
                        <TableCell>{property.totalArea} ha</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={properties.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Property Dialog */}
          <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da sua fazenda para começar
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[85vh] overflow-y-auto px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">Nome da Propriedade *</Label>
                    <Input
                      id="name"
                      value={propertyForm.name || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                      placeholder="Ex: Fazenda Santa Maria"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="viaAcesso">Via de Acesso</Label>
                    <Input
                      id="viaAcesso"
                      value={propertyForm.viaAcesso || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, viaAcesso: e.target.value })}
                      placeholder="Ex: BR-163, KM 245"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="comunidade">Comunidade/Assentamento</Label>
                    <Input
                      id="comunidade"
                      value={propertyForm.comunidade || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, comunidade: e.target.value })}
                      placeholder="Ex: Assentamento Nova Esperança"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={propertyForm.logradouro || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, logradouro: e.target.value })}
                      placeholder="Ex: Rua das Palmeiras"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={propertyForm.numero || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, numero: e.target.value })}
                      placeholder="Ex: 123"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={propertyForm.complemento || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, complemento: e.target.value })}
                      placeholder="Ex: Sede / Galpão"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={propertyForm.bairro || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bairro: e.target.value })}
                      placeholder="Ex: Centro"
                    />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={propertyForm.cep || ''}
                        onChange={(e) => setPropertyForm({ ...propertyForm, cep: e.target.value })}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleSearchCEP(propertyForm.cep || '', 'property')}
                        disabled={searchingCEP}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="municipio">Município *</Label>
                    <Input
                      id="municipio"
                      value={propertyForm.municipio || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, municipio: e.target.value })}
                      placeholder="Ex: Campo Grande"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="uf">UF *</Label>
                    <Select
                      value={propertyForm.uf || ''}
                      onValueChange={(value) => setPropertyForm({ ...propertyForm, uf: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="areaPastagemNatural">Pastagem Natural (ha)</Label>
                    <Input
                      id="areaPastagemNatural"
                      type="number"
                      value={propertyForm.areaPastagemNatural || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, areaPastagemNatural: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="areaPastagemCultivada">Pastagem Cultivada (ha)</Label>
                    <Input
                      id="areaPastagemCultivada"
                      type="number"
                      value={propertyForm.areaPastagemCultivada || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, areaPastagemCultivada: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="areaTotal">Área Total (ha) *</Label>
                    <Input
                      id="areaTotal"
                      type="number"
                      value={propertyForm.areaTotal || ''}

                      onChange={(e) => setPropertyForm({ ...propertyForm, areaTotal: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t bg-background">
                <Button variant="outline" onClick={() => setIsPropertyDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProperty}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ABA PRODUTOR */}
        <TabsContent value="produtor" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Dados do Produtor
                </CardTitle>
                <CardDescription>Informações pessoais e de contato</CardDescription>
              </div>
              <Button
                variant={isEditingProdutor ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditingProdutor ? handleSaveProdutor() : setIsEditingProdutor(true)}
              >
                {isEditingProdutor ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl text-primary-foreground font-bold">
                  {produtorForm.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{produtorForm.name}</p>
                  <Badge variant="secondary">{user.role === 'owner' ? 'Proprietário' : 'Gerente'}</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={produtorForm.name}
                    onChange={(e) => setProdutorForm({ ...produtorForm, name: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF/CNPJ *</Label>
                  <Input
                    value={produtorForm.cpfCnpj}
                    onChange={(e) => setProdutorForm({ ...produtorForm, cpfCnpj: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={produtorForm.inscricaoEstadual}
                    onChange={(e) => setProdutorForm({ ...produtorForm, inscricaoEstadual: e.target.value })}
                    disabled={!isEditingProdutor}
                    placeholder="Opcional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input
                    value={produtorForm.celular}
                    onChange={(e) => setProdutorForm({ ...produtorForm, celular: e.target.value })}
                    disabled={!isEditingProdutor}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={produtorForm.email}
                    onChange={(e) => setProdutorForm({ ...produtorForm, email: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={produtorForm.cep}
                      onChange={(e) => setProdutorForm({ ...produtorForm, cep: e.target.value })}
                      disabled={!isEditingProdutor}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isEditingProdutor && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleSearchCEP(produtorForm.cep, 'produtor')}
                        disabled={searchingCEP}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={produtorForm.endereco}
                    onChange={(e) => setProdutorForm({ ...produtorForm, endereco: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={produtorForm.bairro}
                    onChange={(e) => setProdutorForm({ ...produtorForm, bairro: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input
                    value={produtorForm.municipio}
                    onChange={(e) => setProdutorForm({ ...produtorForm, municipio: e.target.value })}
                    disabled={!isEditingProdutor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={produtorForm.estado}
                    onChange={(e) => setProdutorForm({ ...produtorForm, estado: e.target.value })}
                    disabled={!isEditingProdutor}
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PLANO */}
        <TabsContent value="plano" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Plano Atual
              </CardTitle>
              <CardDescription>
                Seu plano é aplicado ao CPF/CNPJ e cobre todas as suas propriedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasSubscription ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl border bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold text-foreground">Escolha um plano para continuar</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Você ainda não possui uma assinatura ativa vinculada ao seu CPF/CNPJ.
                        </p>
                      </div>
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-card p-3">
                        <p className="text-xs text-muted-foreground">Total de propriedades</p>
                        <p className="text-sm font-medium text-foreground mt-1">{properties.length}</p>
                      </div>
                      <div className="rounded-lg bg-card p-3">
                        <p className="text-xs text-muted-foreground">Total de cabeças (todas propriedades)</p>
                        <p className="text-sm font-medium text-foreground mt-1">{totalCattleAllProperties.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  {paymentHistorySection}

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Planos Disponíveis</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plansCatalog.slice().sort((a, b) => a.price - b.price).map((plan) => (
                        <Card key={plan.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                <p className="text-2xl font-bold mt-2">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                                <p className="text-xs text-muted-foreground">/mês</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                              <Beef className="w-4 h-4 text-muted-foreground" />
                              <span>Até {plan.maxCattle === -1 ? '∞' : plan.maxCattle.toLocaleString('pt-BR')} cabeças</span>
                            </div>
                            <Button
                              className="w-full mt-4"
                              onClick={() => void handlePlanChangeClick(plan.id)}
                            >
                              Assinar {plan.name}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : !isSubscriptionActive ? (
                <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold text-foreground">Acesso bloqueado por status da assinatura</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sua assinatura está com status <span className="font-medium">{subscription?.status}</span>. Regularize para continuar usando o sistema.
                      </p>
                    </div>
                    <Lock className="w-6 h-6 text-destructive" />
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => toast.info('Fluxo de pagamento/regularização será integrado na próxima etapa.')}
                    >
                      Regularizar pagamento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => refreshMe && void refreshMe()}
                    >
                      Já paguei, atualizar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-primary font-display">{currentPlan?.name}</p>
                        <div className="mt-2">
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Assinatura ativa
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-foreground">
                          R${' '}
                          {currentPlan?.price && typeof currentPlan.price === 'number'
                            ? currentPlan.price.toFixed(2).replace('.', ',')
                            : currentPlan?.price}
                        </p>
                        <p className="text-sm text-muted-foreground">/mês</p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Limite de cabeças</span>
                        <span className="font-medium">{planMaxCattle === -1 ? 'Ilimitado' : planMaxCattle.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Total de propriedades</span>
                        <span className="font-medium">{properties.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Total de cabeças (todas propriedades)</span>
                        <span className="font-medium">{totalCattleAllProperties.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Disponível</span>
                        <span className="font-medium text-success">
                          {planMaxCattle === -1
                            ? 'Ilimitado'
                            : Math.max(0, planMaxCattle - totalCattleAllProperties).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {paymentHistorySection}

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Planos Disponíveis</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plansCatalog.slice().sort((a, b) => a.price - b.price).map((plan) => (
                        <Card
                          key={plan.id}
                          className={plan.id === currentPlan?.id ? 'border-2 border-primary' : ''}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                <p className="text-2xl font-bold mt-2">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                                <p className="text-xs text-muted-foreground">/mês</p>
                              </div>
                              {plan.id === currentPlan?.id && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Atual
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                              <Beef className="w-4 h-4 text-muted-foreground" />
                              <span>Até {plan.maxCattle === -1 ? '∞' : plan.maxCattle.toLocaleString('pt-BR')} cabeças</span>
                            </div>
                            {plan.id !== currentPlan?.id && (
                              <Button
                                className="w-full mt-4"
                                variant="outline"
                                onClick={() => void handlePlanChangeClick(plan.id)}
                              >
                                {planRank(plan.id) > planRank(currentPlan?.id ?? null)
                                  ? 'Fazer Upgrade'
                                  : 'Solicitar Downgrade'}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA CONFIGURAÇÕES */}
        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>Personalize o comportamento do aplicativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-muted-foreground">Receber notificações do app</p>
                  </div>
                  <Switch
                    checked={settings.notificacoes}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificacoes: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sincronização Automática</p>
                    <p className="text-sm text-muted-foreground">Sincronizar dados quando online</p>
                  </div>
                  <Switch
                    checked={settings.sincronizacaoAuto}
                    onCheckedChange={(checked) => setSettings({ ...settings, sincronizacaoAuto: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-sm text-muted-foreground">Tema escuro do aplicativo</p>
                  </div>
                  <Switch
                    checked={settings.modoEscuro}
                    onCheckedChange={(checked) => {
                      setSettings({ ...settings, modoEscuro: checked });
                      void updatePreferences({ modoEscuro: checked });
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Notificações por Tipo de Lançamento</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nascimentos</p>
                      <p className="text-sm text-muted-foreground">Notificar sobre novos nascimentos</p>
                    </div>
                    <Switch
                      checked={settings.notificacaoNascimento}
                      onCheckedChange={(checked) => setSettings({ ...settings, notificacaoNascimento: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mortalidade</p>
                      <p className="text-sm text-muted-foreground">Notificar sobre mortes registradas</p>
                    </div>
                    <Switch
                      checked={settings.notificacaoMorte}
                      onCheckedChange={(checked) => setSettings({ ...settings, notificacaoMorte: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vacinação</p>
                      <p className="text-sm text-muted-foreground">Lembrar campanhas de vacinação</p>
                    </div>
                    <Switch
                      checked={settings.notificacaoVacina}
                      onCheckedChange={(checked) => setSettings({ ...settings, notificacaoVacina: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Alterar Senha
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <Input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordForm.next}
                      onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                      placeholder="Mín. 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={handleChangePassword}>
                  <Save className="w-4 h-4 mr-2" />
                  Atualizar Senha
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSavePreferences}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return content;
}
