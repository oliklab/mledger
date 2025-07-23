"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { RecipeStore, RecipeMaterial, RecipeMetadata } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

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
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

// Define the type for a single line item in our form state
type LineItem = {
  id: string; // Temporary ID for new items, DB ID for existing
  material_id: string;
  quantity: string;
  details: string;
};

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form State
  const [recipeDetails, setRecipeDetails] = useState({ name: '', yield_quantity: '1', yield_unit: '', notes: '' });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch existing recipe and available materials
  const loadData = useCallback(async () => {
    if (!recipeId) return;
    try {
      const supabase = await NewSPASassClient();
      const [recipeData, materialsData] = await Promise.all([
        new RecipeStore(supabase).ReadMetadata(recipeId),
        new MaterialStore(supabase).ReadAll()
      ]);

      setAvailableMaterials(materialsData);
      setRecipeDetails({
        name: recipeData.recipe.name,
        yield_quantity: String(recipeData.recipe.yield_quantity),
        yield_unit: recipeData.recipe.yield_unit || '',
        notes: recipeData.recipe.notes || '',
      });
      setLineItems(recipeData.materials.map(item => ({
        id: item.id,
        material_id: item.material_id || '',
        quantity: String(item.quantity),
        details: item.details || '',
      })));

    } catch (err) {
      setError('Could not load your recipe data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for main details form
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setRecipeDetails(prev => ({ ...prev, [id]: value }));
  };

  // Handlers for line items
  const handleItemChange = (itemId: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
    setLineItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), material_id: '', quantity: '', details: '' }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation ---
    if (!recipeDetails.name || !recipeDetails.yield_quantity) {
      setError('Please provide a name and a yield quantity for the recipe.');
      return;
    }
    if (lineItems.length === 0) {
      setError('A recipe must have at least one ingredient.');
      return;
    }
    if (lineItems.some(item => !item.material_id || !item.quantity || parseFloat(item.quantity) <= 0)) {
      setError('Please select a material and enter a valid quantity for each ingredient.');
      return;
    }

    setLoading(true);

    try {
      if (!recipeId) throw new Error("Recipe ID is missing.");

      const supabase = await NewSPASassClient();
      const recipeStore = new RecipeStore(supabase);

      const materialsPayload: Omit<RecipeMaterial, 'id' | 'recipe_id'>[] = lineItems.map(item => ({
        material_id: item.material_id,
        quantity: parseFloat(item.quantity),
        details: item.details,
      }));

      await recipeStore.Update(recipeId, {
        name: recipeDetails.name,
        notes: recipeDetails.notes,
        yield_quantity: parseFloat(recipeDetails.yield_quantity),
        yield_unit: recipeDetails.yield_unit,
        materials: materialsPayload
      });

      toast({ title: "Recipe Updated!", description: `"${recipeDetails.name}" has been successfully saved.` });
      router.push(`/app/recipes/${recipeId}`);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recipe
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Recipe</h1>
        <p className="text-muted-foreground mt-1">Modify the ingredients and details for this recipe.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <Card>
          <CardHeader><CardTitle>Recipe Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="name">Recipe Name</Label>
              <Input id="name" placeholder="e.g., Large Soy Wax Candle, 10-inch Wreath" value={recipeDetails.name} onChange={handleDetailChange} />
            </div>
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="yield_quantity">Yield Quantity</Label>
              <Input id="yield_quantity" type="number" step="any" value={recipeDetails.yield_quantity} onChange={handleDetailChange} />
              <p className="text-xs text-muted-foreground">How many final items this recipe produces.</p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="yield_unit">Yield Unit</Label>
              <Input id="yield_unit" placeholder="e.g., Candle, Wreath, Bottle" value={recipeDetails.yield_unit} onChange={handleDetailChange} />
              <p className="text-xs text-muted-foreground">The unit of what's produced (e.g., Candle, Loaf).</p>
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="e.g., Curing instructions, assembly steps..." value={recipeDetails.notes} onChange={handleDetailChange} />
            </div>
          </CardContent>
        </Card>

        {/* Ingredients Card */}
        <Card>
          <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item) => {
              const selectedMaterial = availableMaterials.find(m => m.id === item.material_id);
              return (
                <div key={item.id} className="relative p-4 border rounded-lg bg-slate-50 space-y-4">
                  <div className="absolute top-2 right-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <Label>Material</Label>
                      <Select onValueChange={(value) => handleItemChange(item.id, 'material_id', value)} value={item.material_id}>
                        <SelectTrigger><SelectValue placeholder="Select a material..." /></SelectTrigger>
                        <SelectContent>{availableMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.crafting_unit})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Quantity <span className="text-xs text-muted-foreground">({selectedMaterial?.crafting_unit || '...'})</span></Label>
                      <Input type="number" placeholder="e.g., 250" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Details <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                    <Input type="text" placeholder="e.g., Specific variant, supplier note" value={item.details} onChange={(e) => handleItemChange(item.id, 'details', e.target.value)} />
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />Add Ingredient
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end items-center gap-4">
          {error && <Alert variant="destructive" className="py-2 px-3 text-sm flex-1"><AlertCircle className="h-4 w-4 mr-2" />{error}</Alert>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}