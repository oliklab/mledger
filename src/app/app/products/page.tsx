"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Product, ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDelete';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Utils and Icons
import { FormatCurrency } from '@/lib/utils';
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
  Lightbulb,
  Package,
  Boxes,
  Hammer,
  MoreVertical,
  ViewIcon,
  Trash2,
  LucideBuilding
} from 'lucide-react';

// Enhanced type for UI, combining data from different sources
type EnhancedProduct = Product & {
  recipe?: RecipeMetadata;
  recipe_cost: number;
};

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [initialLoading, setInitialLoading] = useState(true);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  // Dialog State
  const [buildProduct, setBuildProduct] = useState<EnhancedProduct | null>(null);
  const [buildQuantity, setBuildQuantity] = useState('1');
  const [buildNotes, setBuildNotes] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);

  const itemsPerPage = 10;

  const loadData = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const [productsData, recipesData, materialsData] = await Promise.all([
        new ProductStore(supabase).ReadAll(),
        new RecipeStore(supabase).ReadAllMetadata(),
        new MaterialStore(supabase).ReadAll()
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipeMap = new Map(recipesData.map(r => [r.recipe.id, r]));

      const enhanced = productsData.map(product => {
        const recipe = recipeMap.get(product.recipe_id);
        const recipe_cost = recipe?.materials.reduce((sum, item) => {
          const material = materialMap.get(item.material_id);
          return material ? sum + (item.quantity * material.avg_cost) : sum;
        }, 0) || 0;
        return { ...product, recipe, recipe_cost };
      });

      setProducts(enhanced);
    } catch (err: any) {
      setError("Failed to load product data. " + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Analytics
  const analytics = useMemo(() => {
    const totalStockValue = products.reduce((sum, p) => sum + (p.current_stock * (p.selling_price || 0)), 0);
    const totalCOG = products.reduce((sum, p) => sum + (p.current_stock * p.recipe_cost), 0);
    return {
      totalProducts: products.length,
      totalStockValue: FormatCurrency(totalStockValue),
      totalCOG: FormatCurrency(totalCOG),
    };
  }, [products]);

  // Filtering & Pagination
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).Delete(selectedProduct.id);
      toast({ title: "Product Deleted", description: `"${selectedProduct.name}" has been removed.` });
      loadData();
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the product." });
    } finally {
      setIsDeleting(false);
      setSelectedProduct(null);
    }
  };

  const ProductCard = ({ product }: { product: EnhancedProduct }) => {
    return (
      <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-slate-100 rounded-lg hidden sm:block">
                <Boxes className="h-6 w-6 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/app/products/${product.id}`} className="group">
                  <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  SKU: {product.sku || 'N/A'} • Recipe: {product.recipe?.recipe.name || 'Not Set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => router.push(`/app/products/${product.id}/manufacture`)}>
                <Hammer className="h-4 w-4 mr-2" />Add New Stock
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => router.push(`/app/products/${product.id}`)}><ViewIcon className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/app/products/${product.id}/edit`)}><Edit3 className="mr-2 h-4 w-4" />Edit Product</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/app/products/${product.id}/manufacture`)}><LucideBuilding className="mr-2 h-4 w-4" />Add New Stock</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs font-medium text-slate-500">Available Stock</p>
              <p className="text-xl font-bold text-primary">{product.current_stock}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Selling Price</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(product.selling_price || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Material Cost</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(product.recipe_cost)}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-md">
              <p className="text-xs font-medium text-amber-700 flex items-center justify-center gap-1"><Lightbulb className="h-3 w-3" />Guide Price</p>
              <p className="text-lg font-bold text-amber-800">{FormatCurrency(product.recipe_cost * 2.5)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (initialLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ConfirmDeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} itemName={selectedProduct?.name || "this product"} isDeleting={isDeleting} />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">Manage your finished goods, track stock levels, and log new manufacturing builds.</p>
        </div>
        <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
          <Button asChild className="bg-primary-600 text-white hover:bg-primary-700"><Link href="/app/products/new"><Plus className="h-4 w-4 mr-2" />New Product</Link></Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Total Products" value={analytics.totalProducts.toString()} icon={Boxes} description="The number of unique sellable products you track." />
        <AnalyticsCard title="Total Stock Value (Retail)" value={analytics.totalStockValue} icon={Wallet} description="The total retail value of all products currently in stock." />
        <AnalyticsCard title="Total Stock Value (COGS)" value={analytics.totalCOG} icon={Package} description="The total material cost (Cost of Goods Sold) of all products in stock." />
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search products by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="text-center py-16"><Archive className="mx-auto h-12 w-12 text-slate-300" /><h3 className="mt-2 text-lg font-medium">No products found</h3><p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search.' : 'Create a new product to get started.'}</p></div>
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
