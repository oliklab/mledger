"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Utils and Icons
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ArrowLeft, Info } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form State
  const [productDetails, setProductDetails] = useState({
    name: '',
    sku: '',
    recipe_id: '',
    selling_price: '',
    notes: '',
  });
  const [availableRecipes, setAvailableRecipes] = useState<RecipeMetadata[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch available recipes for the dropdown
  const loadRecipes = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const recipesData = await new RecipeStore(supabase).ReadAllMetadata();
      setAvailableRecipes(recipesData);
    } catch (err) {
      setError('Could not load your recipes. Please refresh the page.');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Handler for form input changes
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProductDetails(prev => ({ ...prev, [id]: value }));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation ---
    if (!productDetails.name || !productDetails.recipe_id) {
      setError('Please provide a name and select a recipe for the product.');
      return;
    }

    setLoading(true);

    try {
      const supabase = await NewSPASassClient();
      const productStore = new ProductStore(supabase);

      await productStore.Create({
        name: productDetails.name,
        sku: productDetails.sku || null,
        recipe_id: productDetails.recipe_id,
        selling_price: productDetails.selling_price ? parseFloat(productDetails.selling_price) : null,
        notes: productDetails.notes || null,
      });

      toast({ title: "Product Created!", description: `"${productDetails.name}" has been successfully added.` });
      router.push('/app/products');

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-screen w-full" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Product</h1>
        <p className="text-muted-foreground mt-1">Create a new sellable item by linking it to a recipe.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="e.g., Lavender Bliss Soy Candle" value={productDetails.name} onChange={handleDetailChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input id="sku" placeholder="e.g., LBC-001" value={productDetails.sku} onChange={handleDetailChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe_id">Recipe</Label>
              <Select onValueChange={(value) => setProductDetails(p => ({ ...p, recipe_id: value }))} value={productDetails.recipe_id} required>
                <SelectTrigger id="recipe_id">
                  <SelectValue placeholder="Select the recipe for this product..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRecipes.length > 0 ? (
                    availableRecipes.map(r => <SelectItem key={r.recipe.id} value={r.recipe.id}>{r.recipe.name}</SelectItem>)
                  ) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">No recipes found.</div>
                  )}
                </SelectContent>
              </Select>
              {availableRecipes.length === 0 && (
                <Alert variant="default" className="bg-amber-50 border-amber-200 mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You must create a recipe before you can create a product.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Guide Selling Price</Label>
              <Input id="selling_price" type="number" step="any" placeholder="e.g., 24.99" value={productDetails.selling_price} onChange={handleDetailChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="e.g., Internal notes, product description..." value={productDetails.notes} onChange={handleDetailChange} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-4">
          {error && <Alert variant="destructive" className="py-2 px-3 text-sm flex-1"><AlertCircle className="h-4 w-4 mr-2" />{error}</Alert>}
          <Button type="submit" size="lg" disabled={loading || availableRecipes.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Product
          </Button>
        </div>
      </form>
    </div>
  );
}