"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NewSPASassClient } from '@/lib/supabase/client';
import { Material, MaterialStore } from '@/storage/materials';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { EditPurchaseDialog } from './purchase_edit';
import {
  Loader2,
  Package,
  ArrowLeft,
  Edit3,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Wallet,
  Ruler,
  AlertTriangle,
  History,
  Info,
  Plus,
  LucideWalletCards,
  LucideClock,
  LucideIdCard,
  LucideStars
} from 'lucide-react';
import { ConfirmDeleteDialog } from "@/components/ConfirmDelete";
import { EditMaterialDialog } from './edit_dialog';
import { FormatCurrency, FormatDate } from '@/lib/utils';
import { PurchaseHistoryList } from './purchase_history';
import { MaterialPurchase, MaterialPurchaseStore } from '@/storage/material_purchases';
import { IsThisMonth } from '@/lib/utils';

// A small component for displaying stats
const StatCard = ({ title, value, icon: Icon, description, alert }: { title: string, value: string | number, icon: React.ElementType, description?: string, alert?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
    {alert && (
      <div className="px-1 py-0.5 text-xs bg-red-100 text-red-700 text-xs flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {alert}
      </div>
    )}
  </Card>
);

export default function MaterialDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPurchase, setSelectedPurchase] = useState<MaterialPurchase | null>(null);
  const [isEditPurchaseDialogOpen, setIsEditPurchaseDialogOpen] = useState(false);
  const [isDeletePurchaseDialogOpen, setIsDeletePurchaseDialogOpen] = useState(false);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [isCreatePurchaseDialogOpen, setIsCreatePurchaseDialogOpen] = useState(false);

  const loadMaterialAndPurchases = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const supabase = await NewSPASassClient();
      // Fetch material and purchases in parallel for efficiency
      const [materialData, purchasesData] = await Promise.all([
        new MaterialStore(supabase).Read(id),
        new MaterialPurchaseStore(supabase).ReadAllForMaterial(id)
      ]);

      if (materialData) {
        setMaterial(materialData);
        setPurchases(purchasesData);
      } else {
        setError('Material not found.');
      }
    } catch (err: any) {
      setError('Failed to load material data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handlePurchaseCreated = async () => {
    await loadMaterialAndPurchases();
    toast({
      title: "Purchase Logged",
      description: "The material stock and average cost have been updated successfully.",
    });
  };

  const handleOpenEditPurchaseDialog = (purchase: MaterialPurchase) => {
    setSelectedPurchase(purchase);
    setIsEditPurchaseDialogOpen(true);
  };

  const handleOpenDeletePurchaseDialog = (purchase: MaterialPurchase) => {
    setSelectedPurchase(purchase);
    setIsDeletePurchaseDialogOpen(true);
  };

  const handlePurchaseUpdated = async () => {
    await loadMaterialAndPurchases();
    toast({ title: "Purchase Updated", description: "The purchase record has been updated." });
  };

  const handleConfirmDeletePurchase = async () => {
    if (!selectedPurchase) return;
    setIsDeletingPurchase(true);
    try {
      const supabase = await NewSPASassClient();
      await new MaterialPurchaseStore(supabase).Delete(selectedPurchase.id);
      await loadMaterialAndPurchases();
      toast({ title: "Purchase Deleted", description: "The purchase record has been removed." });
      setIsDeletePurchaseDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete purchase: ${err.message}` });
    } finally {
      setIsDeletingPurchase(false);
    }
  };

  useEffect(() => {
    loadMaterialAndPurchases();
  }, [loadMaterialAndPurchases]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true' && material) {
      setIsEditDialogOpen(true);
      // Immediately remove the URL parameter so it doesn't trigger again.
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, material, router, pathname]);

  const handleUpdateSuccess = async (updatedMaterialName: string) => {
    await loadMaterialAndPurchases(); // Refresh the data
    // Show the success toast
    toast({
      title: "Material Updated",
      description: `"${updatedMaterialName}" has been successfully updated.`,
    });
  };

  const handleDelete = async () => {
    if (!material) return;
    setIsDeleting(true);
    try {
      const materialName = material.name;
      const supabase = await NewSPASassClient();
      await new MaterialStore(supabase).Delete({ id: material.id } as Material);

      toast({ title: "Material Deleted", description: `"${materialName}" has been removed.` });

      // Close the dialog before navigating away
      setIsDeleteDialogOpen(false);
      router.push('/app/materials');

    } catch (err: any) {
      setError('Failed to delete material: ' + err.message);
      toast({ variant: "destructive", title: "Error", description: `Failed to delete material: ${err.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  const inventoryValue = useMemo(() => {
    if (!material) return 0;
    return material.current_stock * material.avg_cost;
  }, [material]);

  const purchaseCostThisMonth = useMemo(() => {
    if (!purchases) return 0;
    return purchases
      .filter(m => IsThisMonth(m.purchase_date))
      .reduce((sum, m) => sum + m.total_cost, 0);
  }, [purchases]);

  const purchaseCountThisMonth = useMemo(() => {
    if (!purchases) return 0;
    return purchases
      .filter(m => IsThisMonth(m.purchase_date))
      .length;
  }, [purchases]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">An Error Occurred</h2>
        <Alert variant="destructive" className="mt-4 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/app/materials"><ArrowLeft className="mr-2 h-4 w-4" />Back to Materials</Link>
        </Button>
      </div>
    );
  }

  if (!material) {
    // This case is handled by the error state but good to have as a fallback
    return <div>Material not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Edit Dialog */}
      <EditMaterialDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        material={material}
        onMaterialUpdated={handleUpdateSuccess}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={material?.name || "this material"}
        isDeleting={isDeleting}
      />

      {material && (
        <EditPurchaseDialog
          isOpen={isEditPurchaseDialogOpen}
          onOpenChange={setIsEditPurchaseDialogOpen}
          onPurchaseUpdated={handlePurchaseUpdated}
          purchase={selectedPurchase}
          materialName={material.name}
          purchaseUnit={material.purchase_unit}
          conversionFactor={material.conversion_factor}
        />
      )}

      <ConfirmDeleteDialog
        isOpen={isDeletePurchaseDialogOpen}
        onOpenChange={setIsDeletePurchaseDialogOpen}
        onConfirm={handleConfirmDeletePurchase}
        itemName={`the purchase from ${FormatDate(selectedPurchase?.purchase_date || '')}`}
        isDeleting={isDeletingPurchase}
      />


      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/app/materials" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Storeroom
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{material.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/app/purchases/new`}>
            <Button className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium" onClick={() => setIsCreatePurchaseDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log Purchase
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="SKU" value={material.sku} icon={LucideIdCard} />
        <StatCard title="Current Stock"
          value={`${material.current_stock.toLocaleString()} ${material.crafting_unit}`}
          icon={Warehouse}
          alert={material.current_stock <= material.minimum_threshold ? "Low Stock" : ""}
          description={material.current_stock <= material.minimum_threshold ? "" : "Stock is Healthy"}
        />
        <StatCard title="Avg. Cost / Unit" value={FormatCurrency(material.avg_cost)} icon={TrendingDown} description={`per ${material.crafting_unit}`} />
        <StatCard title="Current Inventory Value" value={FormatCurrency(inventoryValue)} icon={Wallet} description="Current stock x Avg. cost" />
        <StatCard title="Purchase Cost This Month" value={FormatCurrency(purchaseCostThisMonth)} icon={LucideWalletCards} description="Total Cost for Purchases this month" />
        <StatCard title="Purchases This Month" value={purchaseCountThisMonth} icon={LucideClock} description="Purchases this month" />
        <StatCard title="Low Stock Threshold" value={`${material.minimum_threshold > 0 ? `${material.minimum_threshold.toLocaleString()} ${material.crafting_unit}` : 'Not Set'}`} icon={AlertTriangle} />
        <StatCard title="Starting Average" value={`${(material.initial_cost / material.initial_quantity).toLocaleString()}`} icon={LucideStars} />
      </div>

      {/* Details Cards */}
      <div className="grid gap-2 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Ruler className="h-5 w-5" />Unit Details</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Purchase Unit:</span> <span className="font-medium">{material.purchase_unit}</span></div>
            <div className="flex justify-between"><span>Crafting Unit:</span> <span className="font-medium">{material.crafting_unit}</span></div>
            <div className="flex justify-between"><span>Conversion Factor:</span> <span className="font-medium">1 {material.purchase_unit} = {material.conversion_factor.toLocaleString()} {material.crafting_unit}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5" />Tracking Details</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Starting Unit:</span> <span className="font-medium">{material.initial_quantity.toLocaleString()} {material.crafting_unit}</span></div>
            <div className="flex justify-between"><span>Starting Cost:</span> <span className="font-medium">{material.initial_quantity.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Total Tracked Stock:</span> <span className="font-medium">{material.total_quantity.toLocaleString()} {material.crafting_unit}</span></div>
            <div className="flex justify-between"><span>Date Added:</span> <span className="font-medium">{FormatDate(material.created_at)}</span></div>
            <div className="flex justify-between"><span>Last Updated:</span> <span className="font-medium">{FormatDate(material.updated_at)}</span></div>
          </CardContent>
        </Card>
      </div>

      {material.notes && (<div className="grid gap-2 md:grid-cols-1">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-1 text-lg"><Ruler className="h-5 w-5" />Note</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="font-medium">{material.notes}</span></div>
          </CardContent>
        </Card>
      </div>
      )}

      <PurchaseHistoryList
        purchases={purchases}
        onEdit={handleOpenEditPurchaseDialog}
        onDelete={handleOpenDeletePurchaseDialog}
        craftingUnit={material.crafting_unit} />
    </div>
  );
}