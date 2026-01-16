import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { propertyService, Property } from '@/services/api.service';
import {
  MapPin,
  User,
  Settings,
  Edit2,
  Save,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function MinhaFazenda() {
  const { user, selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('propriedade');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProdutor, setIsEditingProdutor] = useState(false);
  const [isEditingProperty, setIsEditingProperty] = useState(false);

  // Produtor form
  const [produtorForm, setProdutorForm] = useState({
    name: user?.name || '',
    cpfCnpj: user?.cpfCnpj || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Property form
  const [propertyForm, setPropertyForm] = useState<Partial<Property>>({
    nome: selectedProperty?.name || '',
    cidade: selectedProperty?.city || '',
    estado: selectedProperty?.state || '',
    areaTotal: selectedProperty?.totalArea || 0,
    areaCultivada: selectedProperty?.cultivatedArea || 0,
    areaNatural: selectedProperty?.naturalArea || 0,
    quantidadeGado: selectedProperty?.cattleCount || 0,
  });

  // Settings
  const [settings, setSettings] = useState({
    notificacoes: true,
    sincronizacaoAuto: true,
    notificacaoNascimento: true,
    notificacaoMorte: true,
    notificacaoVacina: true,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const handleSaveProdutor = async () => {
    setIsLoading(true);
    try {
      // Aqui seria chamada a API para atualizar usuário
      toast.success('Dados do produtor atualizados com sucesso');
      setIsEditingProdutor(false);
    } catch (error) {
      toast.error('Erro ao atualizar dados do produtor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!selectedProperty) return;
    
    setIsLoading(true);
    try {
      await propertyService.update(selectedProperty.id, propertyForm);
      toast.success('Propriedade atualizada com sucesso');
      setIsEditingProperty(false);
    } catch (error) {
      toast.error('Erro ao atualizar propriedade');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    toast.success('Senha alterada com sucesso');
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  if (!user || !selectedProperty) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 lg:p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-emerald-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Minha Fazenda</h1>
            <p className="text-emerald-100">{selectedProperty.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="propriedade">Propriedade</TabsTrigger>
            <TabsTrigger value="produtor">Produtor</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          </TabsList>

          {/* Propriedade Tab */}
          <TabsContent value="propriedade" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados da Propriedade</CardTitle>
                <Button
                  variant={isEditingProperty ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditingProperty(!isEditingProperty)}
                >
                  {isEditingProperty ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Propriedade</Label>
                    <Input
                      value={propertyForm.nome || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, nome: e.target.value })}
                      disabled={!isEditingProperty}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={propertyForm.cidade || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, cidade: e.target.value })}
                      disabled={!isEditingProperty}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={propertyForm.estado || ''}
                      onChange={(e) => setPropertyForm({ ...propertyForm, estado: e.target.value })}
                      disabled={!isEditingProperty}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>Quantidade de Gado</Label>
                    <Input
                      type="number"
                      value={propertyForm.quantidadeGado || 0}
                      onChange={(e) => setPropertyForm({ ...propertyForm, quantidadeGado: parseInt(e.target.value) })}
                      disabled={!isEditingProperty}
                    />
                  </div>
                  <div>
                    <Label>Área Total (ha)</Label>
                    <Input
                      type="number"
                      value={propertyForm.areaTotal || 0}
                      onChange={(e) => setPropertyForm({ ...propertyForm, areaTotal: parseFloat(e.target.value) })}
                      disabled={!isEditingProperty}
                    />
                  </div>
                  <div>
                    <Label>Área Cultivada (ha)</Label>
                    <Input
                      type="number"
                      value={propertyForm.areaCultivada || 0}
                      onChange={(e) => setPropertyForm({ ...propertyForm, areaCultivada: parseFloat(e.target.value) })}
                      disabled={!isEditingProperty}
                    />
                  </div>
                </div>
                {isEditingProperty && (
                  <Button onClick={handleSaveProperty} disabled={isLoading} className="w-full">
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produtor Tab */}
          <TabsContent value="produtor" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados do Produtor</CardTitle>
                <Button
                  variant={isEditingProdutor ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditingProdutor(!isEditingProdutor)}
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={produtorForm.name}
                      onChange={(e) => setProdutorForm({ ...produtorForm, name: e.target.value })}
                      disabled={!isEditingProdutor}
                    />
                  </div>
                  <div>
                    <Label>CPF/CNPJ</Label>
                    <Input
                      value={produtorForm.cpfCnpj}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={produtorForm.email}
                      onChange={(e) => setProdutorForm({ ...produtorForm, email: e.target.value })}
                      disabled={!isEditingProdutor}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={produtorForm.phone}
                      onChange={(e) => setProdutorForm({ ...produtorForm, phone: e.target.value })}
                      disabled={!isEditingProdutor}
                    />
                  </div>
                </div>
                {isEditingProdutor && (
                  <Button onClick={handleSaveProdutor} disabled={isLoading} className="w-full">
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ativar Notificações</Label>
                  <Switch
                    checked={settings.notificacoes}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificacoes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Nascimentos</Label>
                  <Switch
                    checked={settings.notificacaoNascimento}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificacaoNascimento: checked })}
                    disabled={!settings.notificacoes}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mortes</Label>
                  <Switch
                    checked={settings.notificacaoMorte}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificacaoMorte: checked })}
                    disabled={!settings.notificacoes}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Vacinações</Label>
                  <Switch
                    checked={settings.notificacaoVacina}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificacaoVacina: checked })}
                    disabled={!settings.notificacoes}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} className="w-full">
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
