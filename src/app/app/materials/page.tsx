"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UseUserContext } from '@/lib/context/GlobalContext';
import { NewSPASassClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Package,
  Search,
  Edit3,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Filter,
  Boxes,
  Archive,
  CalendarClock,
  Warehouse,
  Wallet,
  LucideLandmark,
  ViewIcon,
  SquareChartGantt,
  LucideEye,
  LucideClock12
} from 'lucide-react';
import { Material, MaterialStore } from '@/storage/materials';
import { MaterialPurchase, MaterialPurchaseStore } from '@/storage/material_purchases';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { CreateMaterialDialog } from './create';
import { CreatePurchaseShortcutDialog } from './create_purchase';
import { FormatCurrency, FormatDate, IsThisMonth } from '@/lib/utils';


export default function MaterialsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isPurchaseShortcutOpen, setIsPurchaseShortcutOpen] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadAllMaterials();
    loadAllPurchases();
  }, []);

  const loadAllMaterials = async () => {
    try {
      if (!initialLoading) setLoading(true); else setInitialLoading(true);
      const supabase = await NewSPASassClient();
      const materialsData = await new MaterialStore(supabase).ReadAll();
      setMaterials(materialsData);
    } catch (err: any) {
      setError('Failed to load Materials: ' + err.message);
      console.error('Error loading Materials:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const loadAllPurchases = async () => {
    try {
      if (!initialLoading) setLoading(true); else setInitialLoading(true);
      const supabase = await NewSPASassClient();
      const parchasesData = await new MaterialPurchaseStore(supabase).ReadAllForUserId();
      setPurchases(parchasesData);
    } catch (err: any) {
      setError('Failed to load Purchases: ' + err.message);
      console.error('Error loading Materials:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Memoized analytics calculations to prevent re-computing on every render
  const analytics = useMemo(() => {
    const lowStockCount = materials.filter(m => m.current_stock <= m.minimum_threshold).length;
    const totalInventoryValue = materials.reduce((sum, m) => sum + (m.current_stock * m.avg_cost), 0);
    const investmentThisMonth = purchases
      .filter(m => IsThisMonth(m.purchase_date))
      .reduce((sum, m) => sum + m.total_cost, 0);

    const totalInvestment = materials.reduce((sum, m) => sum + m.total_cost, 0);
    const totalPurchasesThisMonth = purchases.filter(m => IsThisMonth(m.purchase_date))
      .length;

    return {
      totalMaterials: materials.length,
      lowStockCount,
      totalInventoryValue,
      investmentThisMonth: investmentThisMonth,
      totalInvestment,
      totalPurchasesThisMonth
    };
  }, [materials, purchases]);

  const filteredMaterials = materials.filter(material => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = material.name.toLowerCase().includes(searchLower) ||
      (material.notes && material.notes.toLowerCase().includes(searchLower));
    const matchesLowStock = !showLowStock || (material.current_stock <= material.minimum_threshold && material.minimum_threshold > 0);
    return matchesSearch && matchesLowStock;
  });

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  // Improved Material Card Component
  const MaterialCard = ({ material }: { material: Material }) => {
    const isLowStock = material.current_stock <= material.minimum_threshold && material.minimum_threshold > 0;
    return (
      <Card className="hover:shadow-lg hover:border-primary-200 transition-all duration-300 group font-inter">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="p-3 bg-slate-100 rounded-lg mt-1">
                <Package className="h-6 w-6 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/app/materials/${material.id}`}>
                    <h3 className="text-lg font-semibold text-slate-800 truncate">{material.name}</h3>
                  </Link>
                  {material.current_stock <= material.minimum_threshold && (
                    <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </div>
                  )}

                </div>
                {material.notes && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    Note: {material.notes}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>Added: {FormatDate(material.created_at)}</span>
                  <span>Updated: {FormatDate(material.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/app/materials/${material.id}`}>
                      <Button variant="link" size="icon" className="text-slate-500 hover:text-slate-800">
                        <LucideEye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent><p>View Details</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/app/materials/${material.id}?edit=true`}>
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Material</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs font-medium text-slate-500">Current Stock</p>
              <p className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>{material.current_stock.toLocaleString()} <span className="text-sm font-normal text-slate-500">{material.crafting_unit}</span></p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Avg. Cost</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(material.avg_cost)} <span className="text-sm font-normal text-slate-500">/ {material.crafting_unit}</span></p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Inventory Value</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(material.current_stock * material.avg_cost)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Low Stock At</p>
              <p className="text-lg font-bold text-slate-800">{material.minimum_threshold > 0 ? `${material.minimum_threshold.toLocaleString()} ${material.crafting_unit}` : 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs font-medium text-slate-500">Purchase Unit</p>
              <p className='text-lg font-bold text-slate-800'>{material.purchase_unit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Crafting Unit</p>
              <p className='text-lg font-bold text-slate-800'>{material.crafting_unit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Conversion Factor</p>
              <p className='text-lg font-bold text-slate-800'>1{material.purchase_unit} = {material.conversion_factor.toLocaleString()}{material.crafting_unit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Inventory Trackedt</p>
              <p className='text-lg font-bold text-slate-800'>{material.total_quantity.toLocaleString()} {material.crafting_unit}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const Pagination = () => (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-slate-600">
        Showing <strong>{Math.min(startIndex + 1, filteredMaterials.length)}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredMaterials.length)}</strong> of <strong>{filteredMaterials.length}</strong> materials
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium p-2">{currentPage} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  const PageHeader = () => (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Material Storeroom</h1>
        <p className="mt-2 text-base text-gray-600 max-w-2xl">
          This is your digital storeroom.<br />
          See every raw material you own, from current stock to the average cost you've paid. Add new materials, log your latest
          supply run, or update details anytime. Keeping this accurate is the first step to pricing your products with confidence.
        </p>
      </div>
      <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
        <CreateMaterialDialog onMaterialCreated={loadAllMaterials} />
        <CreatePurchaseShortcutDialog
          isOpen={isPurchaseShortcutOpen}
          onOpenChange={setIsPurchaseShortcutOpen}
          materials={materials}
          onPurchaseCreated={loadAllMaterials}
        />
      </div>
      <div className='p-6'>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <PageHeader />

      {/* Analytics Bar */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Total Materials" value={analytics.totalMaterials.toString()} icon={Boxes} description="Distinct raw materials you track" />
        <AnalyticsCard title="Low Stock Items" value={analytics.lowStockCount.toString()} icon={AlertTriangle} description="Items at or below threshold" />
        <AnalyticsCard title="Current Inventory Value" value={FormatCurrency(analytics.totalInventoryValue)} icon={Wallet} description="Current value of all stock on hand" />
        <AnalyticsCard title="Investment This Month" value={FormatCurrency(analytics.investmentThisMonth)} icon={CalendarClock} description="Cost of new materials added this month" />
        <AnalyticsCard title="Total Purchases This Month" value={analytics.totalPurchasesThisMonth.toString()} icon={LucideClock12} description="Total Purchases made this month" />
        <AnalyticsCard title="Total Investment" value={FormatCurrency(analytics.totalInvestment)} icon={LucideLandmark} description="Total Cost of materials for all time" />
      </div>

      <Card>
        <CardHeader>
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search materials" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant={showLowStock ? "default" : "outline"} onClick={() => setShowLowStock(!showLowStock)} className={`flex items-center gap-2 ${showLowStock ? "bg-amber-600 text-white hover:bg-amber-700" : ""}`}>
              <Filter className="h-4 w-4" />
              {showLowStock ? "Show All" : "Show Low Stock Only"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4 relative">
            {loading && !initialLoading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            )}
            {paginatedMaterials.length === 0 ? (
              <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <Archive className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || showLowStock ? 'No Materials Found' : 'Your Storeroom is Empty'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || showLowStock ? 'Try adjusting your search or filter.' : 'Get started by adding your first raw material.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedMaterials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pt-6 mt-4 border-t">
                    <Pagination />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
