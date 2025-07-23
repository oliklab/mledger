"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { PurchaseMetadata, PurchaseStore } from '@/storage/purchases';
import { Material, MaterialStore } from '@/storage/materials';
import { MaterialPurchase, MaterialPurchaseStore } from '@/storage/material_purchases';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDeleteDialog } from "@/components/ConfirmDelete";
import { EditPurchaseDialog as EditPurchaseItemDialog } from '../../materials/[id]/purchase_edit';

// Utils and Icons
import { FormatCurrency, FormatDate } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Edit3,
  Trash2,
  AlertCircle,
  Wallet,
  CalendarClock,
  ClipboardList,
  StickyNote,
  MoreVertical,
  Package
} from 'lucide-react';

// Stat Card Sub-component
const StatCard = ({ title, value, icon: Icon, children }: { title: string, value?: string | number, icon: React.ElementType, children?: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {value && <div className="text-2xl font-bold">{value}</div>}
      {children}
    </CardContent>
  </Card>
);

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Data State
  const [purchaseMeta, setPurchaseMeta] = useState<PurchaseMetadata | null>(null);
  const [materials, setMaterials] = useState<Map<string, Material>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog & Action State
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaterialPurchase | null>(null);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
  const [isProcessingItem, setIsProcessingItem] = useState(false);

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      if (!id) return;
      setLoading(true);
      const supabase = await NewSPASassClient();
      const [metaData, materialsData] = await Promise.all([
        new PurchaseStore(supabase).ReadMetadata(id),
        new MaterialStore(supabase).ReadAll()
      ]);
      setPurchaseMeta(metaData);
      setMaterials(new Map(materialsData.map(m => [m.id, m])));
    } catch (err: any) {
      setError('Failed to load purchase details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleConfirmDeleteOrder = async () => {
    if (!purchaseMeta) return;
    setIsDeletingOrder(true);
    try {
      const supabase = await NewSPASassClient();
      await new PurchaseStore(supabase).Delete(purchaseMeta.purchase.id);
      toast({ title: "Purchase Record Deleted", description: "The Purchase and it's items have been removed." });
      router.push('/app/purchases');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete purchase record." });
      setIsDeletingOrder(false);
    }
  };

  const handleItemUpdated = async () => {
    await loadData();
    toast({ title: "Item Updated", description: "The item has been successfully updated." });
  };

  const handleConfirmDeleteItem = async () => {
    if (!selectedItem) return;
    setIsProcessingItem(true);
    try {
      const supabase = await NewSPASassClient();
      // Uses the robust RPC function in the MaterialPurchaseStore
      await new MaterialPurchaseStore(supabase).Delete(selectedItem.id);
      await loadData();
      toast({ title: "Item Deleted", description: "The Purchase item has been removed from the order." });
      setIsDeleteItemDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the item." });
    } finally {
      setIsProcessingItem(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variant = (s: string) => {
      switch (s) {
        case 'completed': return 'default';
        case 'pending': return 'secondary';
        case 'unpaid': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'outline';
      }
    };
    return <Badge variant={variant(status?.toLowerCase() || '')}>{status || 'Unknown'}</Badge>;
  };

  if (loading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-10 w-1/2" /><div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /></div>;
  }
  if (error) {
    return <div className="p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl">An Error Occurred</h2><p className="text-muted-foreground">{error}</p></div>
  }
  if (!purchaseMeta) {
    return <div className="p-8 text-center"><p>Purchase record not found.</p></div>
  }

  const { purchase, materials: lineItems } = purchaseMeta;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* --- DIALOGS --- */}
      <ConfirmDeleteDialog isOpen={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen} onConfirm={handleConfirmDeleteOrder} itemName={`the purchase record "${purchase.name}"`} isDeleting={isDeletingOrder} />
      <ConfirmDeleteDialog isOpen={isDeleteItemDialogOpen} onOpenChange={setIsDeleteItemDialogOpen} onConfirm={handleConfirmDeleteItem} itemName="this line item" isDeleting={isProcessingItem} />
      {selectedItem && (
        <EditPurchaseItemDialog
          isOpen={isEditItemDialogOpen}
          onOpenChange={setIsEditItemDialogOpen}
          onPurchaseUpdated={handleItemUpdated}
          purchase={selectedItem}
          materialName={materials.get(selectedItem.material_id)?.name || ''}
          purchaseUnit={materials.get(selectedItem.material_id)?.purchase_unit || ''}
          conversionFactor={materials.get(selectedItem.material_id)?.conversion_factor || 1}
        />
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0 text-muted-foreground hover:text-primary"><Link href="/app/purchases"><ArrowLeft className="h-4 w-4 mr-2" />Back to Purchases</Link></Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{purchase.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" asChild><Link href={`/app/purchases/${id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit Order</Link></Button>
          <Button variant="destructive" onClick={() => setIsDeleteOrderDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete Order</Button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Cost" value={FormatCurrency(purchaseMeta.total_cost)} icon={Wallet} />
        <StatCard title="Purchase Date" value={FormatDate(purchase.purchase_date)} icon={CalendarClock} />
        <StatCard title="Status" icon={ClipboardList}>{getStatusBadge(purchase.status)}</StatCard>
        <StatCard title="Total Items" value={lineItems.length} icon={Package} />
      </div>

      {/* --- LINE ITEMS TABLE --- */}
      <Card>
        <CardHeader><CardTitle>Items in this Order</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-center w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map(item => {
                const material = materials.get(item.material_id);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{material?.name || 'Unknown Material'}</TableCell>
                    <TableCell>{item.supplier_name || 'N/A'}</TableCell>
                    <TableCell>{item.supplier_contact || ''}</TableCell>
                    <TableCell className="text-right">{item.total_quantity.toLocaleString()} {material?.crafting_unit}</TableCell>
                    <TableCell className="text-right">{FormatCurrency(item.total_cost)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsEditItemDialogOpen(true); }}><Edit3 className="mr-2 h-4 w-4" /> Edit Item</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsDeleteItemDialogOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Item</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- NOTES --- */}
      {purchase.notes && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><StickyNote className="h-5 w-5" />Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchase.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}