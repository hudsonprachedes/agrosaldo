import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  ArrowLeft,
  MapPin,
  User,
  CreditCard,
  Settings,
  Edit2,
  Save,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Ruler,
  Beef,
  Trees,
  Tractor,
  Crown,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { plans } from '@/mocks/mock-auth';
import { getTotalCattle } from '@/mocks/mock-bovinos';
import MobileLayout from '@/components/layout/MobileLayout';
import AppLayout from '@/components/layout/AppLayout';

export default function MinhaFazenda() {
  const { user, selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('propriedade');

  // Form states
  const [farmData, setFarmData] = useState({
    name: selectedProperty?.name || '',
    city: selectedProperty?.city || '',
    state: selectedProperty?.state || '',
    totalArea: selectedProperty?.totalArea || 0,
    cultivatedArea: selectedProperty?.cultivatedArea || 0,
    naturalArea: selectedProperty?.naturalArea || 0,
  });

  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpfCnpj: user?.cpfCnpj || '',
    phone: '(65) 99999-9999',
  });

  const [settings, setSettings] = useState({
    notifications: true,
    emailReports: true,
    autoSync: true,
    darkMode: false,
  });

  if (!user || !selectedProperty) {
    navigate('/login');
    return null;
  }

  const totalCattle = getTotalCattle(selectedProperty.id);
  const currentPlan = plans.find(p => p.id === selectedProperty.plan);
  const nextPlan = plans.find(p => p.maxCattle > (currentPlan?.maxCattle || 0));

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Dados salvos com sucesso!');
  };

  const content = (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">🏡</span>
            Minha Fazenda
          </h1>
          <p className="text-muted-foreground">
            Gerencie os dados da sua propriedade
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} h-auto`}>
          <TabsTrigger value="propriedade" className="py-3">
            <MapPin className="w-4 h-4 mr-2" />
            Propriedade
          </TabsTrigger>
          <TabsTrigger value="produtor" className="py-3">
            <User className="w-4 h-4 mr-2" />
            Produtor
          </TabsTrigger>
          {!isMobile && (
            <>
              <TabsTrigger value="plano" className="py-3">
                <CreditCard className="w-4 h-4 mr-2" />
                Plano
              </TabsTrigger>
              <TabsTrigger value="config" className="py-3">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {isMobile && (
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="plano" className="py-3">
              <CreditCard className="w-4 h-4 mr-2" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="config" className="py-3">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>
        )}

        {/* PROPRIEDADE TAB */}
        <TabsContent value="propriedade" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Dados da Propriedade
              </CardTitle>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Fazenda</Label>
                <Input
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={farmData.city}
                    onChange={(e) => setFarmData({ ...farmData, city: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={farmData.state}
                    onChange={(e) => setFarmData({ ...farmData, state: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Areas Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                Áreas (hectares)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary/10 text-center">
                  <Tractor className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-primary">{farmData.totalArea.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Área Total</p>
                </div>
                <div className="p-4 rounded-xl bg-warning/10 text-center">
                  <Beef className="w-8 h-8 mx-auto text-warning mb-2" />
                  <p className="text-2xl font-bold text-warning">{farmData.cultivatedArea.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Área Cultivada</p>
                </div>
                <div className="p-4 rounded-xl bg-success/10 text-center">
                  <Trees className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="text-2xl font-bold text-success">{farmData.naturalArea.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Área Natural</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total de Cabeças</p>
                  <p className="text-4xl font-bold font-display">{totalCattle.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-6xl">🐮</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUTOR TAB */}
        <TabsContent value="produtor" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados do Produtor
              </CardTitle>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
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
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl text-primary-foreground font-bold">
                  {userData.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{userData.name}</p>
                  <Badge variant="secondary">{user.role === 'owner' ? 'Proprietário' : 'Gerente'}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome Completo
                  </Label>
                  <Input
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </Label>
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CPF/CNPJ
                  </Label>
                  <Input
                    value={userData.cpfCnpj}
                    disabled
                    className="h-12 bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANO TAB */}
        <TabsContent value="plano" className="space-y-6">
          {/* Current Plan */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Plano Atual
                </CardTitle>
                <Badge className="bg-primary text-lg px-4 py-1">
                  {currentPlan?.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    R$ {currentPlan?.price.toFixed(2).replace('.', ',')}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Até {currentPlan?.maxCattle === Infinity ? 'ilimitado' : currentPlan?.maxCattle.toLocaleString()} cabeças
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ativo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Renova em 15/02/2024
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Uso do plano</span>
                  <span className="text-sm font-medium">
                    {totalCattle} / {currentPlan?.maxCattle === Infinity ? '∞' : currentPlan?.maxCattle}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ 
                      width: currentPlan?.maxCattle === Infinity 
                        ? '10%' 
                        : `${Math.min(100, (totalCattle / currentPlan!.maxCattle) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Todos os Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      plan.id === currentPlan?.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: plan.color }}
                        />
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Até {plan.maxCattle === Infinity ? 'ilimitado' : plan.maxCattle.toLocaleString()} cabeças
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </div>
                    {plan.id === currentPlan?.id && (
                      <Badge className="mt-2" variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Seu plano atual
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {nextPlan && (
                <Button className="w-full mt-4" variant="outline">
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer upgrade para {nextPlan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIGURAÇÕES TAB */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">Receber alertas no celular</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(v) => setSettings({ ...settings, notifications: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatórios por E-mail</p>
                  <p className="text-sm text-muted-foreground">Receber resumo semanal</p>
                </div>
                <Switch
                  checked={settings.emailReports}
                  onCheckedChange={(v) => setSettings({ ...settings, emailReports: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sincronização Automática</p>
                  <p className="text-sm text-muted-foreground">Sincronizar dados ao abrir</p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(v) => setSettings({ ...settings, autoSync: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Tema escuro para o app</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(v) => setSettings({ ...settings, darkMode: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Zona de Perigo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-between" onClick={() => toast.info('Em desenvolvimento')}>
                <span>Exportar meus dados</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="destructive" className="w-full" onClick={() => toast.error('Entre em contato com o suporte')}>
                Cancelar assinatura
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-lg">Minha Fazenda</h1>
          </div>
          {content}
        </div>
      </MobileLayout>
    );
  }

  return <AppLayout>{content}</AppLayout>;
}
