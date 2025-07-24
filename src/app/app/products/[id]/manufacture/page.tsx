"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Product, ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Utils and Icons
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ArrowLeft, Hammer } from 'lucide-react';

// Simplified type for this page
type ProductForBuild = Product & {
  recipe?: RecipeMetadata;
};

export default function ManufactureProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form State
  const [buildQuantity, setBuildQuantity] = useState('');
  const [buildNotes, setBuildNotes] = useState('');
  const [product, setProduct] = useState<ProductForBuild | null>(null);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProductData = useCallback(async () => {
    if (!productId) return;
    try {
      const supabase = await NewSPASassClient();
      const productData = await new ProductStore(supabase).Read(productId);
      if (!productData) throw new Error("Product not found.");

      let recipeData = null;
      if (productData.recipe_id) {
        recipeData = await new RecipeStore(supabase).ReadMetadata(productData.recipe_id);
      }

      setProduct({ ...productData, recipe: recipeData || undefined });
      // Set the default build quantity to 1 batch
      if (recipeData) {
        setBuildQuantity(String(recipeData.recipe.yield_quantity));
      }

    } catch (err: any) {
      setError('Could not load product data: ' + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!buildQuantity || parseInt(buildQuantity) <= 0) {
      setError('Please select a valid number of batches to build.');
      return;
    }

    setLoading(true);

    try {
      if (!productId) throw new Error("Product ID is missing.");

      const supabase = await NewSPASassClient();
      await new ProductStore(supabase).logBuild(productId, parseInt(buildQuantity), buildNotes);

      toast({ title: "Build Successful!", description: `${buildQuantity} unit(s) of ${product?.name} have been added to stock.` });
      router.push(`/app/products/${productId}`); // Navigate to the product details page

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the build.");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const recipeYield = product?.recipe?.recipe.yield_quantity || 1;
  const recipeUnit = product?.recipe?.recipe.yield_unit || 'items';
  const batchOptions = Array.from({ length: 25 }, (_, i) => i + 1); // Generates options for 1 to 25 batches

  if (initialLoading) {
    return <div className="p-8 max-w-2xl mx-auto"><Skeleton className="h-screen w-full" /></div>;
  }

  if (error && !product) {
    return <div className="p-8 text-center max-w-2xl mx-auto"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl">An Error Occurred</h2><p className="text-muted-foreground">{error}</p></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Stock</h1>
        <p className="text-muted-foreground mt-1">
          Log Manufacture of new stock for Product: <span className="font-semibold text-primary">{product?.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              This will increase this product's stock and deduct materials from your inventory based on the linked recipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="build-quantity">Batches to Build</Label>
              <Select
                onValueChange={setBuildQuantity}
                value={buildQuantity}
                disabled={!product?.recipe}
              >
                <SelectTrigger id="build-quantity">
                  <SelectValue placeholder="Select number of batches..." />
                </SelectTrigger>
                <SelectContent>
                  {batchOptions.map(batchNumber => {
                    const totalYield = batchNumber * recipeYield;
                    return (
                      <SelectItem key={batchNumber} value={String(totalYield)}>
                        {batchNumber} {batchNumber > 1 ? 'batches' : 'batch'} ({totalYield.toLocaleString()} {recipeUnit})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Based on the recipe yield of <span className="font-semibold">{recipeYield.toLocaleString()} {recipeUnit}</span> per batch.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="build-notes">Notes (Optional)</Label>
              <Textarea
                id="build-notes"
                value={buildNotes}
                onChange={(e) => setBuildNotes(e.target.value)}
                placeholder="e.g., Batch #123, special order for..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-4 mt-6">
          {error && <Alert variant="destructive" className="py-2 px-3 text-sm flex-1">{error}</Alert>}
          <Button type="submit" size="lg" disabled={loading || !product?.recipe}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Hammer className="mr-2 h-4 w-4" />
            Confirm Build
          </Button>
        </div>
      </form>
    </div>
  );
}