"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { SalesStore } from '@/storage/sales';
import { Product, ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Utils and Icons
import { FormatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft, Info } from 'lucide-react';

// Enhanced type for product dropdown
type ProductForSale = Product & {
  recipe_cost: number;
};

// Type for a single line item in the form state
type LineItem = {
  id: string; // Temporary ID for React keys
  product_id: string;
  quantity: string;
  price_per_unit: string;
};

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form State
  const [saleDetails, setSaleDetails] = useState({ sale_date: '', customer_details: '', notes: '', status: '' });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductForSale[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Determine if the form should be locked
  const isLocked = useMemo(() => saleDetails.status === 'Completed' || saleDetails.status === 'Cancelled', [saleDetails.status]);

  // Fetch existing sale data and all available products
  const loadData = useCallback(async () => {
    if (!saleId) return;
    try {
      const supabase = await NewSPASassClient();
      const [saleData, productsData, recipesData, materialsData] = await Promise.all([
        new SalesStore(supabase).ReadMetadata(saleId),
        new ProductStore(supabase).ReadAll(),
        new RecipeStore(supabase).ReadAllMetadata(),
        new MaterialStore(supabase).ReadAll()
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipeMap = new Map(recipesData.map(r => [r.recipe.id, r]));
      const enhancedProducts = productsData.map(product => {
        const recipe = recipeMap.get(product.recipe_id);
        const recipe_cost = recipe?.materials.reduce((sum, item) => {
          const material = materialMap.get(item.material_id);
          return material ? sum + (item.quantity * material.avg_cost) : sum;
        }, 0) || 0;
        return { ...product, recipe_cost };
      });
      setAvailableProducts(enhancedProducts);

      setSaleDetails({
        sale_date: saleData.sale.sale_date,
        customer_details: saleData.sale.customer_details || '',
        notes: saleData.sale.notes || '',
        status: saleData.sale.status, // Store the initial status
      });
      setLineItems(saleData.items.map(item => ({
        id: item.id,
        product_id: item.product_id || '',
        quantity: String(item.quantity),
        price_per_unit: String(item.price_per_unit),
      })));

    } catch (err: any) {
      setError('Could not load sale data: ' + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [saleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handlers
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaleDetails(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleItemChange = (itemId: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
    let updatedItems = lineItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    if (field === 'product_id') {
      const product = availableProducts.find(p => p.id === value);
      if (product) {
        updatedItems = updatedItems.map(item =>
          item.id === itemId ? { ...item, price_per_unit: String(product.selling_price || '') } : item
        );
      }
    }
    setLineItems(updatedItems);
  };

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), product_id: '', quantity: '1', price_per_unit: '' }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  const totalAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0)), 0);
  }, [lineItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (lineItems.some(item => !item.product_id || !item.quantity || !item.price_per_unit)) {
      setError('Please complete all fields for each line item.');
      return;
    }
    setLoading(true);

    try {
      if (!saleId) throw new Error("Sale ID is missing.");
      const supabase = await NewSPASassClient();
      const salesStore = new SalesStore(supabase);

      const itemsPayload = lineItems.map(item => {
        const product = availableProducts.find(p => p.id === item.product_id);
        if (!product) throw new Error('Selected product not found.');
        return {
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          price_per_unit: parseFloat(item.price_per_unit),
          cost_per_unit_at_sale: product.recipe_cost,
        };
      });

      // If the sale was locked, we only update non-critical details.
      // Otherwise, we update everything and revert to draft.
      const finalSaleDetails = isLocked
        ? { ...saleDetails, status: saleDetails.status } // Keep original status
        : { ...saleDetails, status: 'Draft' };

      await salesStore.UpdateWithItems(saleId, {
        saleDetails: finalSaleDetails,
        items: itemsPayload
      });

      toast({ title: "Sale Updated!", description: `The sale has been successfully saved. ${!isLocked ? 'Status was reverted to Draft.' : ''}` });
      router.push(`/app/sales/${saleId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-screen w-full" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sale Details
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Sale</h1>
        <p className="text-muted-foreground mt-1">Modify details for this order.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Sale Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="sale_date">Sale Date</Label><Input id="sale_date" type="date" value={saleDetails.sale_date} onChange={handleDetailChange} required /></div>
            <div className="space-y-2"><Label htmlFor="customer_details">Customer Details (Optional)</Label><Input id="customer_details" placeholder="e.g., John Doe, johndoe@email.com" value={saleDetails.customer_details} onChange={handleDetailChange} /></div>
            <div className="md:col-span-2 space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" placeholder="e.g., Order #, special instructions..." value={saleDetails.notes} onChange={handleDetailChange} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLocked && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Line Items are Locked</AlertTitle>
                <AlertDescription>
                  This sale is {saleDetails.status}. To modify the items, please go back and revert the sale to a 'Draft' first.
                </AlertDescription>
              </Alert>
            )}
            {lineItems.map((item) => {
              const selectedProduct = availableProducts.find(p => p.id === item.product_id);
              return (
                <div key={item.id} className={`relative p-4 border rounded-lg space-y-4 ${isLocked ? 'bg-slate-100 opacity-70' : 'bg-slate-50'}`}>
                  {!isLocked && <div className="absolute top-2 right-2"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 space-y-1"><Label>Product</Label><Select onValueChange={(value) => handleItemChange(item.id, 'product_id', value)} value={item.product_id} disabled={isLocked}><SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger><SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({FormatCurrency(p.selling_price || 0)})</SelectItem>)}</SelectContent></Select></div>
                    <div className="md:col-span-3 space-y-1"><Label>Quantity</Label><Input type="number" placeholder="e.g., 1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} disabled={isLocked} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Price / Unit (€)</Label><Input type="number" step="any" placeholder="e.g., 25.00" value={item.price_per_unit} onChange={(e) => handleItemChange(item.id, 'price_per_unit', e.target.value)} disabled={isLocked} /></div>
                  </div>
                  {selectedProduct && selectedProduct.current_stock < parseInt(item.quantity) && (<Alert variant="destructive" className="text-xs p-2"><AlertCircle className="h-4 w-4" /><AlertDescription>Warning: Insufficient stock ({selectedProduct.current_stock} available).</AlertDescription></Alert>)}
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-2" disabled={isLocked}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-100 rounded-lg">
          <div className="text-center sm:text-left"><p className="text-sm font-medium text-muted-foreground">Total Sale Amount</p><p className="text-3xl font-bold tracking-tight text-gray-900">{FormatCurrency(totalAmount)}</p></div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {error && <Alert variant="destructive" className="py-2 px-3 text-sm"><AlertCircle className="h-4 w-4 mr-2" />{error}</Alert>}
            <Button type="submit" size="lg" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  );
}