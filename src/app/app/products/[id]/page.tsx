"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Product, ProductBuild, ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from "@/components/ConfirmDelete";

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
  DollarSign
} from 'lucide-react';

// Enhanced type for the details page
type EnhancedProductDetails = Product & {
  recipe: RecipeMetadata | null;
  recipe_cost: number;
};

// Sub-components for clarity
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

const BuildHistoryList = ({ builds, onDelete }: { builds: ProductBuild[], onDelete: (buildId: string) => void }) => (
  <Card>
    <CardHeader><CardTitle>Build History</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Quantity Built</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {builds.length > 0 ? builds.map(build => (
            <TableRow key={build.id}>
              <TableCell>{FormatDate(build.created_at)}</TableCell>
              <TableCell className="text-right font-medium">{build.quantity_built}</TableCell>
              <TableCell className="text-muted-foreground">{build.notes || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(build.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Revert
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={4} className="h-24 text-center">No builds have been logged for this product yet.</TableCell></TableRow>
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

      const [recipeData, materialsData, buildsData] = await Promise.all([
        productData.recipe_id ? new RecipeStore(supabase).ReadMetadata(productData.recipe_id) : Promise.resolve(null),
        new MaterialStore(supabase).ReadAll(),
        productStore.readBuildsForProduct(id)
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipe_cost = recipeData?.materials.reduce((sum, item) => {
        const material = materialMap.get(item.material_id);
        return material ? sum + (item.quantity * material.avg_cost) : sum;
      }, 0) || 0;

      setProduct({ ...productData, recipe: recipeData, recipe_cost });
      setBuilds(buildsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const profitMargin = useMemo(() => {
    if (!product || !product.selling_price || product.selling_price === 0) return 0;
    const profit = product.selling_price - product.recipe_cost;
    return (profit / product.selling_price) * 100;
  }, [product]);

  // Handlers
  const handleDeleteProduct = async (returnStock: boolean) => {
    if (!product) return;
    setIsDeletingProduct(true);
    try {
      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).DeleteWithStockManagement(product.id, returnStock);
      toast({ title: "Product Deleted", description: `"${product.name}" has been removed successfully.` });
      router.push('/app/products');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not delete the product." });
      setIsDeletingProduct(false);
    }
  };

  const handleConfirmDeleteBuild = async () => {
    if (!buildToDeleteId) return;
    setIsDeletingBuild(true);
    try {
      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).deleteBuild(buildToDeleteId);
      toast({ title: "Build Reverted", description: "The product build has been deleted and stocks have been restored." });
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
          <DialogHeader>
            <DialogTitle>Delete "{product.name}"?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. You have <span className="font-bold text-primary">{product.current_stock}</span> unit(s) of this product in stock. Please choose how to handle them.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>Return Materials to Stock</AlertTitle>
              <AlertDescription>
                This will "dismantle" the existing product stock and return the component materials to your inventory. Choose this if you want to reuse the materials.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <Trash2 className="h-4 w-4" />
              <AlertTitle>Discard Stock & Delete</AlertTitle>
              <AlertDescription>
                This will permanently delete the product and its stock record. The materials will NOT be returned. Choose this for spoilage or loss.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteProductDialogOpen(false)} disabled={isDeletingProduct}>Cancel</Button>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="destructive" onClick={() => handleDeleteProduct(false)} disabled={isDeletingProduct}>
                {isDeletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Discard Stock & Delete
              </Button>
              <Button onClick={() => handleDeleteProduct(true)} disabled={isDeletingProduct}>
                {isDeletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Return Stock & Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog isOpen={!!buildToDeleteId} onOpenChange={() => setBuildToDeleteId(null)} onConfirm={handleConfirmDeleteBuild} itemName="this product build" isDeleting={isDeletingBuild} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0 text-muted-foreground hover:text-primary"><Link href="/app/products"><ArrowLeft className="h-4 w-4 mr-2" />Back to Products</Link></Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
          <p className="text-muted-foreground mt-1">SKU: {product.sku || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.push(`/app/products/${product.id}/manufacture`)}>
            <Hammer className="h-4 w-4 mr-2" />Add New Stock
          </Button>
          <Button variant="outline" asChild><Link href={`/app/products/${id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit Product</Link></Button>
          <Button variant="destructive" onClick={() => setIsDeleteProductDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete Product</Button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Current Stock" value={product.current_stock.toLocaleString()} icon={Boxes} />
        <StatCard title="Selling Price" value={FormatCurrency(product.selling_price || 0)} icon={Tags} />
        <StatCard title="Recipe Cost (COGS)" value={FormatCurrency(product.recipe_cost)} icon={Package} />
        <StatCard title="Profit Margin" icon={DollarSign}>
          <div className={`text-2xl font-bold ${profitMargin < 0 ? 'text-destructive' : ''}`}>{profitMargin.toFixed(1)}%</div>
        </StatCard>
        <StatCard title="Suggested Price" value={FormatCurrency(product.recipe_cost * 2.5)} icon={Package} />
      </div>

      {/* --- DETAILS & BUILDS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BuildHistoryList builds={builds} onDelete={(buildId) => setBuildToDeleteId(buildId)} />
          <Card>
            <CardHeader><CardTitle>Sales History</CardTitle></CardHeader>
            <CardContent className="text-center text-muted-foreground py-12">
              <p>Sales tracking is coming soon!</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" />Linked Recipe</CardTitle></CardHeader>
            <CardContent>
              {product.recipe ? (
                <Link href={`/app/recipes/${product.recipe.recipe.id}`} className="font-medium text-primary hover:underline">{product.recipe.recipe.name}</Link>
              ) : (
                <p className="text-sm text-muted-foreground">No recipe linked.</p>
              )}
            </CardContent>
          </Card>
          {product.notes && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5" />Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.notes}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}