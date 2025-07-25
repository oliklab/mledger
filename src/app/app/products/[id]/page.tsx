"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Product, ProductBuild, ProductStore, ProductSalesHistory } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from "@/components/ConfirmDelete";
import { Badge } from '@/components/ui/badge';

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
  Boxes,
  Hammer,
  StickyNote,
  FlaskConical,
  Tags,
  DollarSign,
  History,
  Repeat,
  Lightbulb,
  TrendingUp,
  ShoppingCart // Added for Sales History
} from 'lucide-react';

// Enhanced type for the details page
type EnhancedProductDetails = Product & {
  recipe: RecipeMetadata | null;
  recipe_cost: number;
};

// Sub-components for clarity
const DetailStat = ({ label, value, subValue }: { label: string, value: string | number, subValue?: string }) => (
  <div className="flex justify-between items-baseline">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="text-right">
      <p className="font-semibold text-slate-800">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  </div>
);

const BuildHistoryList = ({ builds, onDelete }: { builds: ProductBuild[], onDelete: (buildId: string) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Manufacturing History</CardTitle>
      <CardDescription>A log of all manufacturing runs for this product.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Quantity Built</TableHead>
            <TableHead className="text-right">Cost of Build</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {builds.length > 0 ? builds.map(build => (
            <TableRow key={build.id}>
              <TableCell>{FormatDate(build.created_at)}</TableCell>
              <TableCell className="text-right font-medium">{build.quantity_built}</TableCell>
              <TableCell className="text-right font-medium">{FormatCurrency(build.total_cost_at_build)}</TableCell>
              <TableCell className="text-muted-foreground">{build.notes || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(build.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Revert
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={5} className="h-24 text-center">No builds have been logged for this product yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const SalesHistoryList = ({ history }: { history: ProductSalesHistory[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Sales History</CardTitle>
      <CardDescription>A log of all completed sales including this product.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Quantity Sold</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? history.map(sale => (
            <TableRow key={sale.sale_id}>
              <TableCell>{FormatDate(sale.sale_date)}</TableCell>
              <TableCell>
                <Link href={`/app/sales/${sale.sale_id}`} className="font-medium text-primary hover:underline">
                  {sale.customer_details || 'Walk-in Sale'}
                </Link>
              </TableCell>
              <TableCell className="text-right font-medium">{sale.quantity_sold}</TableCell>
              <TableCell className="text-right font-medium">{FormatCurrency(sale.subtotal)}</TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={4} className="h-24 text-center">This product has not been part of any completed sales yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // State
  const [product, setProduct] = useState<EnhancedProductDetails | null>(null);
  const [builds, setBuilds] = useState<ProductBuild[]>([]);
  const [salesHistory, setSalesHistory] = useState<ProductSalesHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog State
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [buildToDeleteId, setBuildToDeleteId] = useState<string | null>(null);
  const [isDeletingBuild, setIsDeletingBuild] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const supabase = await NewSPASassClient();
      const productStore = new ProductStore(supabase);
      const productData = await productStore.Read(id);
      if (!productData) throw new Error("Product not found.");

      const [recipeData, materialsData, buildsData, salesHistoryData] = await Promise.all([
        productData.recipe_id ? new RecipeStore(supabase).ReadMetadata(productData.recipe_id) : Promise.resolve(null),
        new MaterialStore(supabase).ReadAll(),
        productStore.readBuildsForProduct(id),
        productStore.getSalesHistory(id) // Fetching sales history
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipe_cost = recipeData?.materials.reduce((sum, item) => {
        const material = materialMap.get(item.material_id);
        return material ? sum + (item.quantity * material.avg_cost) : sum;
      }, 0) || 0;

      setProduct({ ...productData, recipe: recipeData, recipe_cost });
      setBuilds(buildsData);
      setSalesHistory(salesHistoryData); // Storing sales history
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const analytics = useMemo(() => {
    if (!product || !builds) return {
      stockValueCOGS: 0, totalUnitsBuilt: 0, avgBuildCost: 0, latestBuildCost: 0, avgCostPerUnit: 0, profitMargin: 0, totalUnitsSold: 0, totalRevenue: 0
    };

    const stockValueCOGS = product.current_stock * product.recipe_cost;
    const totalUnitsBuilt = builds.reduce((sum, b) => sum + b.quantity_built, 0);
    const totalCostOfAllBuilds = builds.reduce((sum, b) => sum + b.total_cost_at_build, 0);
    const avgBuildCost = builds.length > 0 ? totalCostOfAllBuilds / builds.length : 0;
    const latestBuildCost = builds[0]?.total_cost_at_build || 0;
    const recipeYield = product.recipe?.recipe.yield_quantity || 1;
    const avgCostPerUnit = recipeYield > 0 && avgBuildCost > 0 ? avgBuildCost / recipeYield : 0;
    const profit = (product.selling_price || 0) - product.recipe_cost;
    const profitMargin = (product.selling_price || 0) > 0 ? (profit / (product.selling_price || 1)) * 100 : 0;

    // New sales analytics
    const totalUnitsSold = salesHistory.reduce((sum, s) => sum + s.quantity_sold, 0);
    const totalRevenue = salesHistory.reduce((sum, s) => sum + s.subtotal, 0);

    return { stockValueCOGS, totalUnitsBuilt, avgBuildCost, latestBuildCost, avgCostPerUnit, profitMargin, totalUnitsSold, totalRevenue };
  }, [product, builds, salesHistory]);

  // Handlers
  const handleDeleteProduct = async (returnStock: boolean) => {
    if (!product) return;
    setIsDeletingProduct(true);
    try {
      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).DeleteWithStockManagement(product.id, returnStock);
      toast({ title: "Product Deleted", description: `"${product.name}" has been removed.` });
      router.push('/app/products');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not delete product." });
      setIsDeletingProduct(false);
    }
  };

  const handleConfirmDeleteBuild = async () => {
    if (!buildToDeleteId) return;
    setIsDeletingBuild(true);
    try {
      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).deleteBuild(buildToDeleteId);
      toast({ title: "Build Reverted", description: "Stocks have been restored." });
      setBuildToDeleteId(null);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsDeletingBuild(false);
    }
  };

  if (loading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-10 w-1/2" /><div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /></div>;
  }
  if (error || !product) {
    return <div className="p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl">An Error Occurred</h2><p className="text-muted-foreground">{error || "Product not found."}</p></div>
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* --- DIALOGS --- */}
      <Dialog open={isDeleteProductDialogOpen} onOpenChange={setIsDeleteProductDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete "{product.name}"?</DialogTitle><DialogDescription>This action is irreversible. You have <span className="font-bold text-primary">{product.current_stock}</span> unit(s) in stock.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4"><Alert><Package className="h-4 w-4" /><AlertTitle>Return Materials to Stock</AlertTitle><AlertDescription>This will dismantle the product stock and return materials to your inventory.</AlertDescription></Alert><Alert variant="destructive"><Trash2 className="h-4 w-4" /><AlertTitle>Discard Stock & Delete</AlertTitle><AlertDescription>This will permanently delete the product and its stock record. Materials will NOT be returned.</AlertDescription></Alert></div>
          <DialogFooter className="sm:justify-between"><Button variant="outline" onClick={() => setIsDeleteProductDialogOpen(false)} disabled={isDeletingProduct}>Cancel</Button><div className="flex flex-col-reverse sm:flex-row gap-2"><Button variant="destructive" onClick={() => handleDeleteProduct(false)} disabled={isDeletingProduct}>{isDeletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Discard & Delete</Button><Button onClick={() => handleDeleteProduct(true)} disabled={isDeletingProduct}>{isDeletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Return & Delete</Button></div></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog isOpen={!!buildToDeleteId} onOpenChange={() => setBuildToDeleteId(null)} onConfirm={handleConfirmDeleteBuild} itemName="this product build" isDeleting={isDeletingBuild} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0 text-muted-foreground hover:text-primary"><Link href="/app/products"><ArrowLeft className="h-4 w-4 mr-2" />Back to Products</Link></Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
            {product.sku && <Badge variant="outline">{product.sku}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button asChild><Link href={`/app/products/${product.id}/manufacture`}><Hammer className="h-4 w-4 mr-2" />Log Build</Link></Button>
          <Button variant="outline" asChild><Link href={`/app/products/${id}/edit`}><Edit3 className="h-4 w-4" />Edit</Link></Button>
          <Button variant="destructive" onClick={() => setIsDeleteProductDialogOpen(true)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5" />Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-4 bg-slate-50 rounded-lg"><p className="text-sm text-muted-foreground">Available Stock</p><p className="text-4xl font-bold text-primary">{product.current_stock.toLocaleString()}</p></div>
            <DetailStat label="Stock Value (COGS)" value={FormatCurrency(analytics.stockValueCOGS)} />
            <DetailStat label="Total Units Ever Built" value={analytics.totalUnitsBuilt} />
            <DetailStat label="Total Units Ever Sold" value={analytics.totalUnitsSold} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Tags className="h-5 w-5" />Pricing & Revenue</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-4 bg-slate-50 rounded-lg"><p className="text-sm text-muted-foreground">Selling Price</p><p className="text-4xl font-bold text-primary">{FormatCurrency(product.selling_price || 0)}</p></div>
            <DetailStat label="Total Revenue (All Time)" value={FormatCurrency(analytics.totalRevenue)} />
            <DetailStat label="Material Cost (COGS)" value={FormatCurrency(product.recipe_cost)} />
            <DetailStat label="Profit Margin" value={`${analytics.profitMargin.toFixed(1)}%`} />
          </CardContent>
          <CardFooter className="p-4 bg-amber-50 border-t">
            <div className="flex items-start gap-2 text-amber-800"><Lightbulb className="h-4 w-4 mt-0.5 shrink-0" /><p className="text-xs">Suggested Price is <span className="font-semibold">{FormatCurrency(product.recipe_cost * 2.5)}</span> based on a 2.5x markup.</p></div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Hammer className="h-5 w-5" />Manufacturing</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-4 bg-slate-50 rounded-lg"><p className="text-sm text-muted-foreground">Avg. Cost per Unit</p><p className="text-4xl font-bold text-primary">{FormatCurrency(analytics.avgCostPerUnit)}</p></div>
            <DetailStat label="Avg. Cost per Batch" value={FormatCurrency(analytics.avgBuildCost)} />
            <DetailStat label="Latest Batch Cost" value={FormatCurrency(analytics.latestBuildCost)} />
          </CardContent>
        </Card>
      </div>

      {/* --- DETAILS & HISTORY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BuildHistoryList builds={builds} onDelete={(buildId) => setBuildToDeleteId(buildId)} />
          <SalesHistoryList history={salesHistory} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" />Linked Recipe</CardTitle></CardHeader><CardContent>{product.recipe ? (<Link href={`/app/recipes/${product.recipe.recipe.id}`} className="font-medium text-primary hover:underline">{product.recipe.recipe.name}</Link>) : (<p className="text-sm text-muted-foreground">No recipe linked.</p>)}</CardContent></Card>
          {product.notes && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5" />Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.notes}</p></CardContent></Card>)}
        </div>
      </div>
    </div>
  );
}