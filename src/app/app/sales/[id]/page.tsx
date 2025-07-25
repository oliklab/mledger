"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { SaleMetadata, SalesStore } from '@/storage/sales';
import { Product, ProductStore } from '@/storage/products';

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  Package,
  DollarSign,
  TrendingUp,
  FileCheck2,
  FileX2,
  Undo2
} from 'lucide-react';

// Sub-components
const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default function SaleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // State
  const [saleMeta, setSaleMeta] = useState<SaleMetadata | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog State
  const [dialogAction, setDialogAction] = useState<'complete' | 'cancel' | 'delete' | 'revert' | null>(null);
  const [dialogContent, setDialogContent] = useState({ title: '', description: '', confirmText: '' });

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const supabase = await NewSPASassClient();
      const [saleData, productsData] = await Promise.all([
        new SalesStore(supabase).ReadMetadata(id),
        new ProductStore(supabase).ReadAll(),
      ]);
      setSaleMeta(saleData);
      setProducts(new Map(productsData.map(p => [p.id, p])));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Analytics
  const analytics = useMemo(() => {
    if (!saleMeta) return { totalCOGS: 0, totalProfit: 0, profitMargin: 0 };
    const totalCOGS = saleMeta.items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit_at_sale), 0);
    const totalProfit = saleMeta.sale.total_amount - totalCOGS;
    const profitMargin = saleMeta.sale.total_amount > 0 ? (totalProfit / saleMeta.sale.total_amount) * 100 : 0;
    return { totalCOGS, totalProfit, profitMargin };
  }, [saleMeta]);

  // Handlers
  const openConfirmationDialog = (action: 'complete' | 'cancel' | 'delete' | 'revert') => {
    const content = {
      complete: { title: "Complete this Sale?", description: "This will deduct stock from your inventory. This action can be reverted.", confirmText: "Yes, Complete Sale" },
      cancel: { title: "Cancel this Sale?", description: `The sale status will be set to 'Cancelled'. ${saleMeta?.sale.status === 'Completed' ? 'Product stock will be returned to your inventory.' : ''}`, confirmText: "Yes, Cancel Sale" },
      revert: { title: "Revert this Sale?", description: "The sale will be returned to 'Draft' status, and product stock will be returned to your inventory.", confirmText: "Yes, Revert Sale" },
      delete: { title: "Permanently Delete Sale?", description: "This action cannot be undone and will permanently remove this sale record.", confirmText: "Delete Permanently" }
    };
    setDialogContent(content[action]);
    setDialogAction(action);
  };

  const handleAction = async () => {
    if (!id || !dialogAction) return;
    setIsProcessing(true);
    try {
      const supabase = await NewSPASassClient();
      const salesStore = new SalesStore(supabase);
      let successMessage = '';

      switch (dialogAction) {
        case 'complete':
          await salesStore.CompleteSale(id);
          successMessage = "Sale marked as complete and stock has been deducted.";
          break;
        case 'revert':
          await salesStore.RevertSale(id, 'Draft');
          successMessage = "Sale reverted to Draft and stock has been returned.";
          break;
        case 'cancel':
          if (saleMeta?.sale.status === 'Completed') {
            await salesStore.RevertSale(id, 'Cancelled');
            successMessage = "Completed sale cancelled and stock has been returned.";
          } else {
            await salesStore.UpdateWithItems(id, { saleDetails: { ...saleMeta!.sale, status: 'Cancelled' }, items: saleMeta!.items });
            successMessage = "Sale has been cancelled.";
          }
          break;
        case 'delete':
          await salesStore.Delete(id);
          toast({ title: "Sale Deleted", description: "The sale has been permanently removed." });
          router.push('/app/sales');
          return;
      }
      toast({ title: "Success!", description: successMessage });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setIsProcessing(false);
      setDialogAction(null);
    }
  };

  const getStatusBadge = (status: string | null): "default" | "destructive" | "outline" | "secondary" => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'draft': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }
  if (error || !saleMeta) {
    return <div className="p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl">An Error Occurred</h2><p className="text-muted-foreground">{error || "Sale not found."}</p></div>
  }

  const { sale, items } = saleMeta;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AlertDialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={isProcessing} className={dialogAction === 'delete' || dialogAction === 'cancel' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0 text-muted-foreground hover:text-primary"><Link href="/app/sales"><ArrowLeft className="h-4 w-4 mr-2" />Back to Sales</Link></Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{sale.customer_details || 'Walk-in Sale'}</h1>
            <Badge variant={getStatusBadge(sale.status)}>{sale.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {sale.status === 'Draft' && (
            <>
              <Button onClick={() => openConfirmationDialog('complete')}><FileCheck2 className="mr-2 h-4 w-4" />Complete Sale</Button>
              <Button variant="outline" onClick={() => openConfirmationDialog('cancel')}><FileX2 className="mr-2 h-4 w-4" />Cancel</Button>
            </>
          )}
          {sale.status === 'Completed' && (
            <>
              <Button variant="outline" onClick={() => openConfirmationDialog('revert')}><Undo2 className="mr-2 h-4 w-4" />Revert to Draft</Button>
              <Button variant="destructive" onClick={() => openConfirmationDialog('cancel')}>Cancel Sale</Button>
            </>
          )}
          <Button variant="outline" asChild><Link href={`/app/sales/${id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit</Link></Button>
          {(sale.status === 'Draft' || sale.status === 'Cancelled') && (
            <Button variant="destructive" onClick={() => openConfirmationDialog('delete')}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          )}
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={FormatCurrency(sale.total_amount)} icon={TrendingUp} description="The gross amount for this sale." />
        <StatCard title="Cost of Goods Sold" value={FormatCurrency(analytics.totalCOGS)} icon={Package} description="The material cost of the items sold." />
        <StatCard title="Profit" value={FormatCurrency(analytics.totalProfit)} icon={Wallet} description="Revenue minus COGS." />
        <StatCard title="Profit Margin" value={`${analytics.profitMargin.toFixed(1)}%`} icon={DollarSign} description="The percentage of revenue that is profit." />
      </div>

      {/* --- DETAILS & ITEMS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Price / Unit</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{products.get(item.product_id!)?.name || 'Deleted Product'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{FormatCurrency(item.price_per_unit)}</TableCell>
                      <TableCell className="text-right font-semibold">{FormatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Sale Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Sale Date:</span> <span className="font-medium">{FormatDate(sale.sale_date)}</span></div>
              <div className="flex justify-between"><span>Status:</span> <span className="font-medium">{sale.status}</span></div>
              <div className="flex justify-between"><span>Customer:</span> <span className="font-medium">{sale.customer_details || 'N/A'}</span></div>
            </CardContent>
          </Card>
          {sale.notes && (<Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{sale.notes}</p></CardContent></Card>)}
        </div>
      </div>
    </div>
  );
}