"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { PurchaseMetadata, PurchaseStore, Purchase } from '@/storage/purchases'; // Assuming new purchase store
import { Material, MaterialStore } from '@/storage/materials'; // Needed for name lookups

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDelete';

// Utils and Icons
import { FormatCurrency, FormatDate, IsThisMonth, IsThisWeek } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Archive,
  ShoppingCart,
  Wallet,
  CalendarClock,
  LucideLandmark,
  Plus,
  Edit3,
  Trash2,
  ViewIcon,
  ClipboardList
} from 'lucide-react';


export default function PurchasesListPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchases, setPurchases] = useState<PurchaseMetadata[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]); // For name lookups
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const [purchasesData, materialsData] = await Promise.all([
        new PurchaseStore(supabase).ReadAllWithMetadata(), // Assuming this method exists
        new MaterialStore(supabase).ReadAll()
      ]);
      setPurchases(purchasesData);
      setMaterials(materialsData);
    } catch (err: any) {
      setError('Failed to load purchase data: ' + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analytics = useMemo(() => {
    // Investment calculations
    const totalInvestment = purchases.reduce((sum, p) => sum + p.total_cost, 0);
    const investmentThisMonth = purchases
      .filter(p => IsThisMonth(p.purchase.purchase_date))
      .reduce((sum, p) => sum + p.total_cost, 0);
    const investmentThisWeek = purchases
      .filter(p => IsThisWeek(p.purchase.purchase_date))
      .reduce((sum, p) => sum + p.total_cost, 0);

    // Count calculations
    const totalPurchasesTracked = purchases.length;
    const totalPurchasesThisMonth = purchases.filter(p => IsThisMonth(p.purchase.purchase_date)).length;
    const unpaidPurchases = purchases.filter(p =>
      p.purchase.status?.toLowerCase() === 'pending' ||
      p.purchase.status?.toLowerCase() === 'unpaid'
    ).length;

    return {
      totalInvestment,
      investmentThisMonth,
      investmentThisWeek,
      totalPurchasesTracked,
      totalPurchasesThisMonth,
      unpaidPurchases,
    };
  }, [purchases]);

  // Create a map for material names
  const materialMap = useMemo(() => new Map(materials.map(m => [m.id, m.name])), [materials]);

  // Filtering & Pagination
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p =>
      p.purchase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.purchase.notes && p.purchase.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchases, searchTerm]);

  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // Handlers
  const handleConfirmDelete = async () => {
    if (!selectedPurchaseId) return;
    setIsProcessing(true);
    try {
      const supabase = await NewSPASassClient();
      await new PurchaseStore(supabase).Delete(selectedPurchaseId);
      toast({ title: "Purchase record Deleted", description: "The purchase record has been removed." });
      loadData(); // Refresh data
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete purchase: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusVariant = (status: string | null): "default" | "destructive" | "outline" | "secondary" => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  // Main Loading State
  if (initialLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* --- DIALOGS --- */}
      <ConfirmDeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} itemName="this purchase record" isDeleting={isProcessing} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Purchases</h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">Track your supply runs and run them into instant stock updates, true cost of goods.</p>
        </div>
        <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
          <Button onClick={() => router.push('/app/purchases/new')} className="bg-primary-600 text-white hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />Log New Purchase
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* --- ANALYTICS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard
          title="Total Investment So Far"
          value={FormatCurrency(analytics.totalInvestment)}
          icon={LucideLandmark}
          description="The grand total cost of all purchase orders."
        />
        <AnalyticsCard
          title="Investment This Month"
          value={FormatCurrency(analytics.investmentThisMonth)}
          icon={Wallet}
          description="Total cost of orders placed in the current month."
        />
        <AnalyticsCard
          title="Investment This Week"
          value={FormatCurrency(analytics.investmentThisWeek)}
          icon={CalendarClock}
          description="Total cost of orders placed since last Sunday."
        />
        <AnalyticsCard
          title="Total Purchases Tracked"
          value={analytics.totalPurchasesTracked.toString()}
          icon={ClipboardList}
          description="The total number of individual purchase orders recorded."
        />
        <AnalyticsCard
          title="Purchases This Month"
          value={analytics.totalPurchasesThisMonth.toString()}
          icon={ShoppingCart}
          description="Number of distinct purchase orders made this month."
        />
        <AnalyticsCard
          title="Unpaid Purchases"
          value={analytics.unpaidPurchases.toString()}
          icon={AlertCircle}
          description="Orders with a status of 'Pending' or 'Unpaid'."
        />
      </div>

      {/* --- PURCHASE LIST --- */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by order name or notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedPurchases.length > 0 ? (
              paginatedPurchases.map(({ purchase, materials: purchaseItems, total_items, total_cost }) => (
                <Card key={purchase.id} className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/app/purchases/${purchase.id}`}><h3 className="text-lg font-semibold">{purchase.name}</h3></Link>
                        {purchase.status && <Badge variant={getStatusVariant(purchase.status)}>{purchase.status}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {FormatDate(purchase.purchase_date)} • {total_items} item(s)
                      </p>
                      <p className="text-sm mt-2 line-clamp-2">
                        Includes Purchases For: {purchaseItems.map(item => materialMap.get(item.material_id)).filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <p className="text-xl font-bold">{FormatCurrency(total_cost)}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild><Link href={`/app/purchases/${purchase.id}`}><ViewIcon className="h-4 w-4 mr-1" />View</Link></Button>
                        <Button variant="ghost" size="sm" asChild><Link href={`/app/purchases/${purchase.id}/edit`}><Edit3 className="h-4 w-4 mr-1" />Edit</Link></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setSelectedPurchaseId(purchase.id); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 mr-1" />Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <Archive className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-lg font-medium">No purchase orders found</h3>
                <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search.' : 'Create a new purchase record to get started.'}</p>
              </div>
            )}
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}