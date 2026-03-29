'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSettings } from '@/components/SettingsProvider';
import { 
  BarChart3, 
  Download, 
  Printer,
  Loader2, 
  Package, 
  ClipboardList, 
  ShoppingCart, 
  Truck,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'inventory' | 'consumption' | 'orders' | 'shipments';

export default function ReportsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const isRestrictedUser = user?.role === 'dependency' || user?.role === 'warehouse';

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
          if (isRestrictedUser && user?.location) {
            setSelectedLocation(user.location);
          }
        }
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    }
    fetchLocations();
  }, [user, isRestrictedUser]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedLocation, selectedYear, selectedMonth, selectedCategory]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/${reportType}`;
      const params = new URLSearchParams();
      
      if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        let result = await res.json();
        
        // Client-side date filtering
        if (reportType !== 'inventory') {
          result = result.filter((item: any) => {
            const itemDate = new Date(item.createdAt || item.date || item.orderDate);
            if (isNaN(itemDate.getTime())) return true;
            
            if (itemDate.getFullYear() !== selectedYear) return false;
            
            if (selectedMonth !== '') {
              if (itemDate.getMonth() !== parseInt(selectedMonth)) return false;
            }
            
            return true;
          });
        }

        // Client-side category filtering
        if (selectedCategory !== '') {
          result = result.filter((item: any) => {
            if (reportType === 'orders' || reportType === 'shipments') {
              // For orders and shipments, check if any item matches the category
              return item.items?.some((i: any) => i.product?.category === selectedCategory);
            } else {
              // For inventory and consumption
              return item.product?.category === selectedCategory;
            }
          });
        }
        
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (data.length === 0) return;

    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'inventory') {
      headers = ['Produto', 'Categoria', 'Quantidade', 'Unidade', 'Local', 'Valor Unitário', 'Valor Total'];
      rows = data.map(item => [
        item.product?.name || 'N/A',
        item.product?.category === 'meal' ? 'Alimentação' : item.product?.category === 'office' ? 'Escritório' : item.product?.category || 'N/A',
        item.quantity,
        item.product?.unit || '',
        item.location?.name || 'N/A',
        `R$ ${(item.product?.price || 0).toFixed(2).replace('.', ',')}`,
        `R$ ${(item.quantity * (item.product?.price || 0)).toFixed(2).replace('.', ',')}`
      ]);
      
      const totalValue = data.reduce((sum, item) => sum + (item.quantity * (item.product?.price || 0)), 0);
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      rows.push(['', 'Total Geral:', totalQuantity.toString(), '', '', '', `R$ ${totalValue.toFixed(2).replace('.', ',')}`]);
    } else if (reportType === 'consumption') {
      headers = ['Data', 'Produto', 'Quantidade', 'Local', 'Registrado Por', 'Observações'];
      rows = data.map(item => [
        new Date(item.createdAt).toLocaleDateString('pt-BR'),
        item.product?.name || 'N/A',
        item.quantity,
        item.location?.name || 'N/A',
        item.consumedBy?.name || 'N/A',
        item.notes || ''
      ]);
    } else if (reportType === 'orders') {
      headers = ['Data', 'Fornecedor', 'Status', 'Valor Total', 'Itens'];
      rows = data.map(item => {
        const totalValue = item.items?.reduce((sum: number, i: any) => sum + (i.quantity * (i.pricePerUnit || 0)), 0) || 0;
        const supplierName = item.contract?.supplier?.name || item.supplierName || 'N/A';
        return [
          new Date(item.createdAt).toLocaleDateString('pt-BR'),
          supplierName,
          item.status,
          totalValue.toFixed(2),
          item.items?.length || 0
        ];
      });
    } else if (reportType === 'shipments') {
      headers = ['Data', 'Origem', 'Destino', 'Status', 'Itens'];
      rows = data.map(item => [
        new Date(item.createdAt).toLocaleDateString('pt-BR'),
        item.fromLocation?.name || 'N/A',
        item.toLocation?.name || 'N/A',
        item.status === 'completed' ? 'Concluída' : item.status === 'pending' ? 'Pendente' : item.status,
        item.items?.length || 0
      ]);
    }

    const doc = new jsPDF();
    
    // Add Logo if exists
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 10, 18, 18, undefined, 'FAST');
      } catch (e) {
        console.error('Failed to add logo to PDF', e);
      }
    }

    // Add Title
    doc.setFontSize(18);
    const titleY = settings.logoUrl ? 18 : 20;
    const titleX = settings.logoUrl ? 36 : 14;
    
    let reportTitle = 'Relatório';
    if (reportType === 'inventory') reportTitle = 'Relatório de Estoque Atual';
    if (reportType === 'consumption') reportTitle = 'Relatório de Consumo';
    if (reportType === 'orders') reportTitle = 'Relatório de Pedidos de Compra';
    if (reportType === 'shipments') reportTitle = 'Relatório de Remessas';
    
    doc.text(reportTitle, titleX, titleY);
    
    // Add Subtitle / Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Escola: ${settings.systemName}`, titleX, titleY + 6);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, titleX, titleY + 11);
    
    if (selectedYear) {
      doc.text(`Período: ${selectedMonth ? `${parseInt(selectedMonth) + 1}/` : ''}${selectedYear}`, titleX, titleY + 16);
    }

    // Add Table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: settings.logoUrl ? 40 : 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
      didParseCell: function (data) {
        if (reportType === 'inventory' && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    doc.save(`relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Chart Data Preparation
  const getChartData = () => {
    if (reportType === 'inventory') {
      // Group by category
      const grouped = data.reduce((acc, item) => {
        const cat = item.product?.category || 'Outros';
        acc[cat] = (acc[cat] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    } else if (reportType === 'consumption') {
      // Group by product
      const grouped = data.reduce((acc, item) => {
        const prod = item.product?.name || 'Outros';
        acc[prod] = (acc[prod] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10) // Top 10
        .map(([name, value]) => ({ name, value }));
    } else if (reportType === 'orders') {
      // Group by status
      const grouped = data.reduce((acc, item) => {
        const status = item.status || 'Desconhecido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    } else if (reportType === 'shipments') {
      // Group by destination
      const grouped = data.reduce((acc, item) => {
        const dest = item.destination?.name || 'Desconhecido';
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }
    return [];
  };

  const chartData = getChartData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
          <p className="mt-2 text-slate-600">Gere relatórios e visualize dados do sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={data.length === 0 || isLoading}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </button>
        </div>
      </header>

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-8">
        <div className="flex items-center gap-4 mb-4">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{settings.systemName}</h1>
            <h2 className="text-xl text-slate-700">
              {reportType === 'inventory' && 'Relatório de Estoque Atual'}
              {reportType === 'consumption' && 'Relatório de Consumo'}
              {reportType === 'orders' && 'Relatório de Pedidos de Compra'}
              {reportType === 'shipments' && 'Relatório de Remessas'}
            </h2>
            <p className="text-sm text-slate-500">
              Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              Filtros
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Relatório</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setReportType('inventory')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${reportType === 'inventory' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    <Package className="h-4 w-4 mr-2" /> Estoque Atual
                  </button>
                  <button
                    onClick={() => setReportType('consumption')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${reportType === 'consumption' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" /> Consumo
                  </button>
                  <button
                    onClick={() => setReportType('orders')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${reportType === 'orders' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Pedidos de Compra
                  </button>
                  <button
                    onClick={() => setReportType('shipments')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${reportType === 'shipments' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    <Truck className="h-4 w-4 mr-2" /> Remessas
                  </button>
                </div>
              </div>

              {!isRestrictedUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Todos os Locais</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria de Produto</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Todas as Categorias</option>
                  <option value="meal">Alimentação</option>
                  <option value="office">Escritório</option>
                </select>
              </div>

              {reportType !== 'inventory' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {Array.from({ length: 6 }, (_, i) => currentYear - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Todos os meses</option>
                      <option value="0">Janeiro</option>
                      <option value="1">Fevereiro</option>
                      <option value="2">Março</option>
                      <option value="3">Abril</option>
                      <option value="4">Maio</option>
                      <option value="5">Junho</option>
                      <option value="6">Julho</option>
                      <option value="7">Agosto</option>
                      <option value="8">Setembro</option>
                      <option value="9">Outubro</option>
                      <option value="10">Novembro</option>
                      <option value="11">Dezembro</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 print:col-span-4">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 print:hidden">
            <h3 className="font-semibold text-slate-900 mb-4">
              {reportType === 'inventory' && 'Estoque por Categoria'}
              {reportType === 'consumption' && 'Top 10 Produtos Consumidos'}
              {reportType === 'orders' && 'Pedidos por Status'}
              {reportType === 'shipments' && 'Remessas por Destino'}
            </h3>
            
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Nenhum dado para exibir no gráfico
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {(reportType === 'inventory' || reportType === 'orders' || reportType === 'shipments') ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Data Table Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">
                Resultados ({data.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto max-h-96">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" />
                  Carregando dados...
                </div>
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-900">Nenhum dado encontrado</p>
                  <p className="mt-1 text-sm">Ajuste os filtros para ver mais resultados.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 shadow-sm">
                    {reportType === 'inventory' && (
                      <tr>
                        <th className="px-4 py-3 font-medium">Produto</th>
                        <th className="px-4 py-3 font-medium">Categoria</th>
                        <th className="px-4 py-3 font-medium">Local</th>
                        <th className="px-4 py-3 font-medium text-right">Qtd</th>
                        <th className="px-4 py-3 font-medium text-right">Valor Unit.</th>
                        <th className="px-4 py-3 font-medium text-right">Valor Total</th>
                      </tr>
                    )}
                    {reportType === 'consumption' && (
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Produto</th>
                        <th className="px-4 py-3 font-medium">Local</th>
                        <th className="px-4 py-3 font-medium text-right">Qtd</th>
                      </tr>
                    )}
                    {reportType === 'orders' && (
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Fornecedor</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Valor</th>
                      </tr>
                    )}
                    {reportType === 'shipments' && (
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Origem</th>
                        <th className="px-4 py-3 font-medium">Destino</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50">
                        {reportType === 'inventory' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name || 'N/A'}</td>
                            <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{item.product?.category === 'meal' ? 'Alimentação' : item.product?.category === 'office' ? 'Escritório' : item.product?.category || 'N/A'}</span></td>
                            <td className="px-4 py-3">{item.location?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.quantity} {item.product?.unit}</td>
                            <td className="px-4 py-3 text-right">R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">R$ {(item.quantity * (item.product?.price || 0)).toFixed(2).replace('.', ',')}</td>
                          </>
                        )}
                        {reportType === 'consumption' && (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name || 'N/A'}</td>
                            <td className="px-4 py-3">{item.location?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">-{item.quantity} {item.product?.unit}</td>
                          </>
                        )}
                        {reportType === 'orders' && (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.contract?.supplier?.name || item.supplierName || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.status === 'delivered' ? 'Entregue' : item.status === 'pending' ? 'Pendente' : item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">R$ {(item.items?.reduce((sum: number, i: any) => sum + (i.quantity * (i.pricePerUnit || 0)), 0) || 0).toFixed(2)}</td>
                          </>
                        )}
                        {reportType === 'shipments' && (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3">{item.fromLocation?.name || 'N/A'}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.toLocation?.name || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.status === 'completed' || item.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'pending' || item.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.status === 'completed' || item.status === 'delivered' ? 'Concluída' : item.status === 'pending' || item.status === 'preparing' ? 'Pendente' : item.status}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {reportType === 'inventory' && data.length > 0 && (
                    <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Total Geral:</td>
                        <td className="px-4 py-3 text-right">{data.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td className="px-4 py-3 text-right"></td>
                        <td className="px-4 py-3 text-right">
                          R$ {data.reduce((sum, item) => sum + (item.quantity * (item.product?.price || 0)), 0).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
