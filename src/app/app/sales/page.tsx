"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { SaleMetadata, SalesStore } from '@/storage/sales';
import { Product, ProductStore } from '@/storage/products';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDelete';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Utils and Icons
import { FormatCurrency, FormatDate, IsThisMonth } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Archive,
  Wallet,
  Plus,
  Edit3,
  Trash2,
  ViewIcon,
  ShoppingCart,
  TrendingUp,
  FileText,
  MoreVertical
} from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [initialLoading, setInitialLoading] = useState(true);
  const [sales, setSales] = useState<SaleMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSale, setSelectedSale] = useState<{ id: string; customer: string } | null>(null);

  const itemsPerPage = 10;

  const loadData = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      // Using the updated SalesStore
      const salesData = await new SalesStore(supabase).ReadAllMetadata();
      setSales(salesData);
    } catch (err: any) {
      setError("Failed to load sales data: " + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Analytics
  const analytics = useMemo(() => {
    const completedSales = sales.filter(s => s.sale.status === 'Completed');
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.sale.total_amount, 0);
    const salesThisMonth = completedSales.filter(s => IsThisMonth(s.sale.sale_date));
    const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.sale.total_amount, 0);
    const openOrders = sales.filter(s => s.sale.status === 'Draft').length;

    return {
      totalRevenue: FormatCurrency(totalRevenue),
      revenueThisMonth: FormatCurrency(revenueThisMonth),
      salesThisMonthCount: salesThisMonth.length,
      openOrders
    };
  }, [sales]);

  // Filtering & Pagination
  const filteredSales = sales.filter(s =>
    s.sale.customer_details?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  // Handlers
  const handleConfirmDelete = async () => {
    if (!selectedSale) return;
    setIsDeleting(true);
    try {
      const supabase = await NewSPASassClient();
      await new SalesStore(supabase).Delete(selectedSale.id);
      toast({ title: "Sale Deleted", description: `The sale for ${selectedSale.customer} has been removed.` });
      loadData();
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the sale." });
    } finally {
      setIsDeleting(false);
      setSelectedSale(null);
    }
  };

  const getStatusVariant = (status: string | null): "default" | "destructive" | "outline" | "secondary" => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'draft': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ConfirmDeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} itemName={`the sale for ${selectedSale?.customer}`} isDeleting={isDeleting} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales</h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">Track customer orders, manage their status, and monitor your revenue.</p>
        </div>
        <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
          <Button asChild className="bg-primary-600 text-white hover:bg-primary-700">
            <Link href="/app/sales/new"><Plus className="h-4 w-4 mr-2" />New Sale</Link>
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* --- ANALYTICS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Revenue" value={analytics.totalRevenue} icon={TrendingUp} description="Gross revenue from all completed sales." />
        <AnalyticsCard title="Revenue This Month" value={analytics.revenueThisMonth} icon={Wallet} description="Gross revenue from sales completed this month." />
        <AnalyticsCard title="Sales This Month" value={analytics.salesThisMonthCount.toString()} icon={ShoppingCart} description="Number of sales completed this month." />
        <AnalyticsCard title="Open Orders" value={analytics.openOrders.toString()} icon={FileText} description="Sales currently in 'Draft' status." />
      </div>

      {/* --- SALES LIST --- */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by customer details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedSales.length > 0 ? (
              paginatedSales.map(({ sale, items }) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Link href={`/app/sales/${sale.id}`} className="group">
                          <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-primary">
                            {sale.customer_details || 'Walk-in Sale'}
                          </h3>
                        </Link>
                        <Badge variant={getStatusVariant(sale.status)}>{sale.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{FormatDate(sale.sale_date)} • {items.length} item(s)</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">{FormatCurrency(sale.total_amount)}</p>
                      </div>
                      <div className="border-l pl-2 ml-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push(`/app/sales/${sale.id}`)}><ViewIcon className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/app/sales/${sale.id}/edit`)}><Edit3 className="mr-2 h-4 w-4" />Edit Sale</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-16"><Archive className="mx-auto h-12 w-12 text-slate-300" /><h3 className="mt-2 text-lg font-medium">No sales found</h3><p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search.' : 'Create a new sale to get started.'}</p></div>
            )}
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        )}
      </Card>
    </div>
  );
}