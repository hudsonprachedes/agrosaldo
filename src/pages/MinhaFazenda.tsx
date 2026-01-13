import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  MapPin,
  User,
  CreditCard,
  Settings,
  Edit2,
  Save,
  Mail,
  Phone,
  FileText,
  Beef,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getTotalCattle } from '@/mocks/mock-bovinos';
import { plans } from '@/mocks/mock-auth';
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
  });

  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpfCnpj: user?.cpfCnpj || '',
    phone: '(65) 99999-9999',
  });

  if (!user || !selectedProperty) {
    navigate('/login');
    return null;
  }

  const totalCattle = getTotalCattle(selectedProperty.id);
  const currentPlan = plans.find(p => p.id === selectedProperty.plan);

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Dados atualizados com sucesso!');
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
            Gerencie os dados da sua propriedade
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="propriedade" className="py-3">
            <MapPin className="w-4 h-4 mr-2" />
            Propriedade
          </TabsTrigger>
          <TabsTrigger value="produtor" className="py-3">
            <User className="w-4 h-4 mr-2" />
            Produtor
          </TabsTrigger>
          <TabsTrigger value="plano" className="py-3">
            <CreditCard className="w-4 h-4 mr-2" />
            Plano
          </TabsTrigger>
        </TabsList>

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

              <div className="space-y-2">
                <Label>Área Total (hectares)</Label>
                <Input
                  type="number"
                  value={farmData.totalArea}
                  onChange={(e) => setFarmData({ ...farmData, totalArea: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="h-12"
                />
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
                <Beef className="w-16 h-16 text-primary-foreground/20" />
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
                    onChange={(e) => setUserData({ ...userData, cpfCnpj: e.target.value })}
                    disabled={!isEditing}
                    className="h-12"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary font-display">{currentPlan?.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{currentPlan?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">R$ {currentPlan?.price}</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <span className="text-sm text-muted-foreground">Limite de cabeças</span>
                    <span className="font-medium">{currentPlan?.maxCattle === -1 ? 'Ilimitado' : currentPlan?.maxCattle.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <span className="text-sm text-muted-foreground">Cabeças atuais</span>
                    <span className="font-medium">{totalCattle.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <span className="text-sm text-muted-foreground">Disponível</span>
                    <span className="font-medium text-success">
                      {currentPlan?.maxCattle === -1 ? 'Ilimitado' : (currentPlan!.maxCattle - totalCattle).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-6" size="lg">
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return isMobile ? content : <AppLayout>{content}</AppLayout>;
}
