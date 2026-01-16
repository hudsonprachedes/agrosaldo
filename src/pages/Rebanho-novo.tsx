import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { livestockService, CattleReport } from '@/services/api.service';
import {
  Beef,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function Rebanho() {
  const { selectedProperty, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [cattleReport, setCattleReport] = useState<CattleReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCattleData = async () => {
      if (!selectedProperty) return;
      
      setIsLoading(true);
      try {
        const data = await livestockService.getBalance(selectedProperty.id);
        setCattleReport(data);
      } catch (error) {
        console.error('Erro ao carregar rebanho:', error);
        toast.error('Erro ao carregar dados do rebanho');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCattleData();
  }, [selectedProperty]);

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Beef className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Carregando dados do rebanho...</p>
        </div>
      </div>
    );
  }

  const livestock = cattleReport?.livestock || [];
  const totalCattle = cattleReport?.total || 0;
  const maleCount = livestock.filter(l => l.sexo === 'macho').reduce((sum, l) => sum + l.cabecas, 0);
  const femaleCount = livestock.filter(l => l.sexo === 'femea').reduce((sum, l) => sum + l.cabecas, 0);

  const handlePrint = () => {
    window.print();
    toast.success('Relatório enviado para impressão');
  };

  return (
    <div className={`min-h-screen ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 lg:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-emerald-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Rebanho</h1>
              <p className="text-emerald-100">{selectedProperty.nome}</p>
            </div>
          </div>
          <Button
            onClick={handlePrint}
            className="bg-white text-emerald-600 hover:bg-emerald-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Cabeças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCattle}</div>
              <p className="text-xs text-gray-500 mt-1">Rebanho total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Machos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{maleCount}</div>
              <p className="text-xs text-gray-500 mt-1">{((maleCount / totalCattle) * 100).toFixed(1)}% do total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fêmeas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{femaleCount}</div>
              <p className="text-xs text-gray-500 mt-1">{((femaleCount / totalCattle) * 100).toFixed(1)}% do total</p>
            </CardContent>
          </Card>
        </div>

        {/* Livestock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa Etária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Faixa Etária</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead className="text-right">Cabeças</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livestock.length > 0 ? (
                    livestock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.especie}</TableCell>
                        <TableCell>{item.faixaEtaria}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.sexo === 'macho' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {item.sexo === 'macho' ? 'Macho' : 'Fêmea'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{item.cabecas}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        Nenhum rebanho registrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary by Age Group */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Faixa Etária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {livestock.length > 0 ? (
                livestock.reduce((acc, item) => {
                  const existing = acc.find(a => a.ageGroup === item.faixaEtaria);
                  if (existing) {
                    existing.total += item.cabecas;
                  } else {
                    acc.push({ ageGroup: item.faixaEtaria, total: item.cabecas });
                  }
                  return acc;
                }, [] as Array<{ ageGroup: string; total: number }>).map((group) => (
                  <div key={group.ageGroup} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{group.ageGroup}</span>
                    <span className="text-lg font-bold text-emerald-600">{group.total} cabeças</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Sem dados disponíveis</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
