import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { MovementRecord } from '@/mocks/mock-bovinos';
import {
  Baby,
  Skull,
  Truck,
  Syringe,
  Settings,
  Calendar,
  ChevronRight,
  Filter,
  Trash2,
  X,
  Download,
  Image as ImageIcon,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { printExtract, ExtractData } from '@/lib/pdf-report-final';

const typeIcons: Record<string, React.ElementType> = {
  birth: Baby,
  death: Skull,
  sale: Truck,
  vaccine: Syringe,
  adjustment: Settings,
  purchase: Truck,
};

const typeLabels: Record<string, string> = {
  birth: 'Nascimento',
  death: 'Mortalidade',
  sale: 'Venda',
  vaccine: 'Vacinação',
  adjustment: 'Ajuste',
  purchase: 'Compra',
};

const typeColors: Record<string, string> = {
  birth: 'bg-success text-success-foreground',
  death: 'bg-death text-death-foreground',
  sale: 'bg-warning text-warning-foreground',
  vaccine: 'bg-chart-3 text-white',
  adjustment: 'bg-muted text-muted-foreground',
  purchase: 'bg-primary text-primary-foreground',
};

const STORAGE_KEY = 'agrosaldo_extrato_filters';

export default function Extrato() {
  const { selectedProperty, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Load filters from localStorage
  const loadFilters = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          filterType: parsed.filterType || 'all',
          filterAgeGroup: parsed.filterAgeGroup || 'all',
          dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
          dateTo: parsed.dateTo ? new Date(parsed.dateTo) : undefined,
        };
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    }
    return { filterType: 'all', filterAgeGroup: 'all', dateFrom: undefined, dateTo: undefined };
  };

  const savedFilters = loadFilters();

  // Filter states
  const [filterType, setFilterType] = useState<string>(savedFilters.filterType);
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>(savedFilters.filterAgeGroup);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(savedFilters.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(savedFilters.dateTo);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    const load = async () => {
      if (!selectedProperty) return;
      try {
        setIsLoading(true);

        const response = await apiClient.get<PaginatedResponse<MovementRecord>>('/lancamentos/extrato', {
          params: {
            type: filterType,
            dateFrom: dateFrom ? dateFrom.toISOString().slice(0, 10) : undefined,
            dateTo: dateTo ? dateTo.toISOString().slice(0, 10) : undefined,
            page: currentPage,
            limit: itemsPerPage,
          },
        });

        setMovements(response.data);
        setTotalItems(response.pagination.total);
      } catch (error) {
        console.error('Erro ao carregar extrato:', error);
        toast.error('Erro ao carregar extrato');
        setMovements([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [selectedProperty, filterType, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    if (!photoDialogOpen && selectedPhoto) {
      URL.revokeObjectURL(selectedPhoto);
      setSelectedPhoto(null);
    }
  }, [photoDialogOpen, selectedPhoto]);

  // Save filters to localStorage when they change
  useEffect(() => {
    const filters = {
      filterType,
      filterAgeGroup,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filterType, filterAgeGroup, dateFrom, dateTo]);

  // Apply filters and pagination
  const filteredMovements = useMemo(() => {
    if (!selectedProperty) return [];

    let filtered = movements;

    // Age group filter (only for birth/death that have sex)
    if (filterAgeGroup !== 'all') {
      filtered = filtered.filter(m => {
        if (!m.sex) return false;
        // TODO: Map movement to age group based on birthDate
        return true; // Placeholder
      });
    }

    return filtered;
  }, [selectedProperty, movements, filterAgeGroup]);

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  // Pagination (vinda do backend)
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedMovements = filteredMovements;

  const hasActiveFilters = filterType !== 'all' || filterAgeGroup !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterType('all');
    setFilterAgeGroup('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const handleQuickDateFilter = (days: number) => {
    setDateFrom(subDays(new Date(), days));
    setDateTo(new Date());
  };

  const handleDelete = (movement: MovementRecord) => {
    toast.success(`Lançamento ${movement.id} excluído`);
  };

  const handlePrintExtract = () => {
    if (!selectedProperty) return;

    try {
      // Calcular resumo
      const totalEntries = filteredMovements
        .filter(m => m.quantity > 0 && (m.type === 'birth' || m.type === 'purchase'))
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const totalExits = filteredMovements
        .filter(m => m.quantity > 0 && (m.type === 'death' || m.type === 'sale'))
        .reduce((sum, m) => sum + m.quantity, 0);

      // Calcular saldo (simplificado para o período)
      const balance = totalEntries - totalExits;

      // Formatar filtros ativos para exibição
      const activeFilters: string[] = [];
      if (filterType !== 'all') activeFilters.push(`Tipo: ${typeLabels[filterType]}`);
      if (filterAgeGroup !== 'all') activeFilters.push(`Faixa: ${filterAgeGroup}`);
      if (dateFrom || dateTo) {
        const from = dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Início';
        const to = dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Hoje';
        activeFilters.push(`Período: ${from} a ${to}`);
      }
      if (activeFilters.length === 0) activeFilters.push('Todos os registros');

      const reportData: ExtractData = {
        propertyName: selectedProperty.name,
        ownerName: user?.name || 'Proprietário',
        period: dateFrom && dateTo 
          ? `${format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateTo, 'dd/MM/yyyy', { locale: ptBR })}`
          : 'Todo o período',
        filters: activeFilters.join(' | '),
        generatedAt: new Date().toLocaleString('pt-BR'),
        movements: filteredMovements.map(m => ({
          date: m.date,
          type: m.type,
          typeLabel: typeLabels[m.type] || m.type,
          description: m.description,
          quantity: (m.type === 'death' || m.type === 'sale') ? -m.quantity : m.quantity,
          value: m.value
        })),
        summary: {
          totalEntries,
          totalExits,
          balance
        }
      };

      printExtract(reportData);
    } catch (error) {
      console.error('Erro ao imprimir extrato:', error);
      toast.error('Erro ao gerar relatório de extrato');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Extrato
          </h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'movimentação' : 'movimentações'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {[filterType !== 'all', filterAgeGroup !== 'all', dateFrom, dateTo].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrintExtract}>
            {/* Botão de impressão oficial */}
            <Printer className="w-4 h-4 mr-2" />
            {isMobile ? 'Imprimir' : 'Imprimir Oficial / Salvar PDF'}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros Avançados</CardTitle>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="birth">Nascimento</SelectItem>
                    <SelectItem value="death">Mortalidade</SelectItem>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="vaccine">Vacinação</SelectItem>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Group Filter */}
              <div className="space-y-2">
                <Label>Faixa Etária</Label>
                <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as faixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as faixas</SelectItem>
                    <SelectItem value="0-4m">0-4 meses</SelectItem>
                    <SelectItem value="5-12m">5-12 meses</SelectItem>
                    <SelectItem value="13-24m">13-24 meses</SelectItem>
                    <SelectItem value="25-36m">25-36 meses</SelectItem>
                    <SelectItem value="36m+">36+ meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${!dateFrom && 'text-muted-foreground'}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal ${!dateTo && 'text-muted-foreground'}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Período rápido:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickDateFilter(7)}
              >
                Últimos 7 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickDateFilter(30)}
              >
                Últimos 30 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDateFrom(subMonths(new Date(), 3));
                  setDateTo(new Date());
                }}
              >
                Últimos 3 meses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Carregando extrato...</p>
            </CardContent>
          </Card>
        ) : paginatedMovements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'Nenhuma movimentação encontrada com os filtros aplicados' 
                  : 'Nenhuma movimentação registrada'}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedMovements.map((movement, index) => {
            const Icon = typeIcons[movement.type] || Settings;
            
            return (
              <Card 
                key={movement.id}
                className="animate-fade-in hover:shadow-card-hover transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeColors[movement.type]}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[movement.type]}
                            </Badge>
                            {movement.sex && (
                              <Badge variant="outline" className="text-xs">
                                {movement.sex === 'male' ? 'Macho' : 'Fêmea'}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-foreground mt-1">
                            {movement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(movement.date)}</span>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="text-right shrink-0">
                          <p className={`text-xl font-bold ${
                            movement.type === 'birth' || movement.type === 'purchase' 
                              ? 'text-success' 
                              : movement.type === 'death' || movement.type === 'sale'
                              ? 'text-error'
                              : 'text-foreground'
                          }`}>
                            {movement.type === 'birth' || movement.type === 'purchase' ? '+' : 
                             movement.type === 'death' || movement.type === 'sale' ? '-' : ''}
                            {movement.quantity}
                          </p>
                          {movement.value && (
                            <p className="text-sm text-muted-foreground">
                              R$ {movement.value.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(movement.destination || movement.gtaNumber || movement.cause || movement.photoUrl) && (
                        <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                          {movement.destination && (
                            <p>📍 {movement.destination}</p>
                          )}
                          {movement.gtaNumber && (
                            <p>📄 GTA: {movement.gtaNumber}</p>
                          )}
                          {movement.cause && (
                            <p>⚠️ Causa: {movement.cause}</p>
                          )}
                          {movement.photoUrl && movement.type === 'death' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={async () => {
                                try {
                                  const axios = apiClient.getAxiosInstance();
                                  const response = await axios.get(`/lancamentos/${movement.id}/foto`, {
                                    responseType: 'blob',
                                  });
                                  const url = URL.createObjectURL(response.data);
                                  setSelectedPhoto(url);
                                  setPhotoDialogOpen(true);
                                } catch (error) {
                                  console.error('Erro ao carregar foto:', error);
                                  toast.error('Erro ao carregar foto');
                                }
                              }}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Ver Foto
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(movement)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Exibindo <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredMovements.length)}</span> de{' '}
                <span className="font-medium text-foreground">{filteredMovements.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto da Mortalidade</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="mt-4">
              <img 
                src={selectedPhoto} 
                alt="Foto da mortalidade" 
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return content;
}
